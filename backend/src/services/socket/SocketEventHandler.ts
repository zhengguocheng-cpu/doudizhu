/**
 * Socket事件处理器
 * 统一处理所有Socket.IO事件，使用新的认证服务
 */

import { Socket } from 'socket.io';
import { EventBus } from '../../core/EventBus';
import { gameRoomsService } from '../game/gameRoomsService';
import { roomService } from '../room/roomService';
import { gameFlowHandler } from './GameFlowHandler';
import { playHintService } from '../llm/PlayHintService';
import { scoreService } from '../score/ScoreService';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
  sessionId?: string;
  authenticated?: boolean;
  user?: any;
}

export class SocketEventHandler {
  private static instance: SocketEventHandler;
  private eventBus: EventBus;
  private gameRoomsService: any;
  private io: any; // Socket.IO服务器实例
  private quickRoomBotTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    // Initialize services
    this.eventBus = EventBus.getInstance();
    this.gameRoomsService = gameRoomsService;
  }

  public static getInstance(): SocketEventHandler {
    if (!SocketEventHandler.instance) {
      SocketEventHandler.instance = new SocketEventHandler();
    }
    return SocketEventHandler.instance;
  }

  /**
   * 初始化Socket.IO服务器实例
   */
  public initialize(io: any): void {
    this.io = io;
    gameFlowHandler.initialize(io);
    console.log('SocketEventHandler initialized with IO instance');
  }

  /**
   * 处理获取房间列表请求
   */
  public async handleGetRoomsList(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      // 确保快速游戏区房间（K01~K06 等）已就绪
      this.ensureQuickRooms();

      // 从roomService获取房间数据（统一数据源）
      const rooms = roomService.getAllRooms();

      // 发送房间列表给客户端
      socket.emit('rooms_list', {
        success: true,
        rooms: rooms,
        timestamp: new Date()
      });

      console.log(`发送房间列表给客户端 ${socket.id}，房间数量: ${rooms.length}`);

    } catch (error) {
      socket.emit('rooms_list', {
        success: false,
        error: error instanceof Error ? error.message : '获取房间列表失败'
      });
    }
  }

  /**
   * 处理获取房间状态请求
   */
  public async handleGetRoomState(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      const { roomId, userId } = data;
      console.log('🔍 收到获取房间状态请求:', { roomId, userId });

      const room = roomService.getRoom(roomId);
      if (!room) {
        socket.emit('room_state_error', { message: '房间不存在' });
        return;
      }

      // 检查玩家是否在房间中
      const playerInRoom = room.players?.some((p: any) => p.id === userId);
      if (!playerInRoom) {
        socket.emit('room_state_error', { message: '您不在此房间中' });
        return;
      }

      // 发送房间状态
      socket.emit('join_game_success', {
        roomId: roomId,
        roomName: room.name,
        players: room.players || [],
        room: {
          id: roomId,
          name: room.name,
          players: room.players || [],
          maxPlayers: room.maxPlayers || 3,
          status: room.status || 'waiting'
        }
      });

      console.log('✅ 发送房间状态成功:', roomId);

    } catch (error) {
      console.error('获取房间状态错误:', error);
      socket.emit('room_state_error', {
        message: error instanceof Error ? error.message : '获取房间状态失败'
      });
    }
  }

  /**
   * 处理加入游戏事件 - 简化版
   */
  public async handleJoinGame(socket: AuthenticatedSocket, data: any): Promise<void> {
    const { roomId, userId } = data;
    try {
      console.log('🔄 收到join_game请求:', {
        socketId: socket.id,
        requestData: data,
        handshakeAuth: socket.handshake.auth
      });

      // 注释掉认证检查
      // if (!this.validateAuthentication(socket, data.userId)) {
      //   console.error('❌ 发送认证错误消息给客户端');
      //   socket.emit('error', { message: '请先进行用户认证' });
      //   return;
      // }

      console.log('✅ 跳过认证检查，开始处理房间逻辑');
      console.log('玩家加入游戏:', roomId, userId);

      // 简化用户信息处理
      const user = { name: userId }; // 直接使用用户名作为用户对象

      // 从客户端数据中获取头像（如果有）
      const playerAvatar = data.playerAvatar;

      // 加入房间（会抛出错误如果失败）
      const result = roomService.joinRoom(roomId, userId, playerAvatar);

      // 获取房间信息
      const room = roomService.getRoom(roomId);
      if (!room) {
        socket.emit('join_game_failed', { message: '房间不存在' });
        return;
      }

      // 更新房间内该玩家的 socketId，保证断线重连后使用最新连接
      const joinedPlayer = room.players?.find((p: any) => p.id === userId || p.userId === userId);
      if (joinedPlayer) {
        joinedPlayer.socketId = socket.id;
        joinedPlayer.isOnline = true;
        console.log(`🔗 [房间玩家更新] 玩家 ${userId} 在房间 ${roomId} 的 socketId 已更新为 ${socket.id}`);
      }

      // 加入Socket房间（异步操作）
      await socket.join(`room_${roomId}`);
      console.log(`✅ Socket ${socket.id} 已加入房间 room_${roomId}`);

      console.log('✅ 房间加入成功，发送join_game_success事件:', {
        roomId: roomId,
        roomName: room.name,
        //players: room.players
      });

      // 检查是否有保存的游戏状态（玩家重连）
      const savedGameState = roomService.getGameState(roomId);
      
      // 为每个玩家添加积分信息，并回写到 room.players，后续广播统一复用
      const playersWithScore = (room.players || []).map((p: any) => {
        const playerScore = scoreService.getPlayerScore(p.id || p.name);
        return {
          ...p,
          score: playerScore?.totalScore ?? 0
        };
      });
      (room as any).players = playersWithScore;

      // 发送成功响应给当前玩家（携带带积分的玩家列表）
      socket.emit('join_game_success', {
        roomId: roomId,
        roomName: room.name,
        players: playersWithScore,
        room: {
          id: roomId,
          name: room.name,
          players: playersWithScore,
          maxPlayers: room.maxPlayers || 3,
          status: room.status || 'waiting'
        },
        // 如果有保存的游戏状态，一并发送
        gameState: savedGameState || null
      });
      
      // 如果有游戏状态，说明是重连，额外发送游戏状态恢复事件
      if (savedGameState) {
        console.log(`🔄 玩家 ${userId} 重连，恢复游戏状态`);
        socket.emit('game_state_restored', savedGameState);
      }

      // 通知房间内其他玩家（发送完整的房间玩家列表）
      console.log(`📢 向房间 room_${roomId} 的其他玩家广播 player_joined 事件`);
      console.log(`📢 当前房间内的所有socket:`, Array.from(this.io.sockets.adapter.rooms.get(`room_${roomId}`) || []));
      console.log(`📢 当前socket ID: ${socket.id}`);
      
      // 使用已经带有积分信息的 room.players 进行广播
      const playersWithScoreForJoin = (room.players || []) as any[];

      socket.to(`room_${roomId}`).emit('player_joined', {
        playerId: userId,
        playerName: user.name,
        players: playersWithScoreForJoin // 发送带积分的玩家列表
      });
      
      console.log(`✅ player_joined 事件已发送`);

      // 广播房间更新给所有客户端
      this.broadcastRoomsUpdate('player_joined', roomId, {
        playerName: user.name
      });

      console.log('加入游戏成功:', roomId, userId);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加入游戏过程中发生错误';
      console.log(`⚠️ 玩家 ${userId} 加入房间 ${roomId} 失败: ${errorMessage}`);
      socket.emit('join_game_failed', {
        message: errorMessage
      });
    }
  }

  /**
   * 处理离开游戏事件 - 简化版
   */
  public async handleLeaveGame(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      // 注释掉认证检查
      // if (!this.validateAuthentication(socket, data.userId)) {
      //   socket.emit('error', { message: '用户未认证' });
      //   return;
      // }

      const { roomId, userId } = data;
      console.log('玩家离开游戏:', roomId, userId);

      // 离开房间
      const result = roomService.leaveRoom(roomId, userId);

      if (result) {
        // 离开Socket房间
        socket.leave(`room_${roomId}`);

        // 获取更新后的房间信息
        const room = roomService.getRoom(roomId);

        // 通知其他玩家（发送完整的玩家列表）
        socket.to(`room_${roomId}`).emit('player_left', { 
          playerId: userId,
          playerName: userId,
          players: room?.players || [] // 发送更新后的玩家列表
        });

        // 广播房间更新给所有客户端
        this.broadcastRoomsUpdate('player_left', roomId, {
          playerId: userId
        });

        console.log('离开游戏成功:', roomId, userId);
      } else {
        socket.emit('error', { message: '离开游戏失败' });
      }

    } catch (error) {
      console.error('离开游戏错误:', error);
      socket.emit('error', {
        message: error instanceof Error ? error.message : '离开游戏过程中发生错误'
      });
    }
  }

  /**
   * 处理玩家准备事件 - 简化版
   */
  public async handlePlayerReady(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      // 注释掉认证检查
      // if (!this.validateAuthentication(socket, data.userId)) {
      //   socket.emit('error', { message: '用户未认证' });
      //   return;
      // }

      const { roomId, userId } = data;
      console.log('玩家准备:', roomId, userId);

      const result = roomService.togglePlayerReady(roomId, userId);

      if (result) {
        // 获取房间信息
        const room = roomService.getRoom(roomId);
        
        // 通知所有玩家（包括自己），发送完整的玩家列表
        this.io.to(`room_${roomId}`).emit('player_ready', { 
          playerId: userId,
          playerName: userId,
          players: room?.players || [] // 发送完整的玩家列表
        });

        // 广播房间更新给所有客户端
        this.broadcastRoomsUpdate('player_ready', roomId, {
          playerId: userId
        });

        console.log('准备成功:', roomId, userId);
        
        // 检查是否所有玩家都准备好
        if (room && room.players) {
          const isQuickRoom = typeof roomId === 'string' && String(roomId).startsWith('K');
          const botDelayRaw = (data as any)?.botDelayMs;
          const botDelayMs = typeof botDelayRaw === 'number' && botDelayRaw >= 0 ? botDelayRaw : 0;

          const allReadyNow = room.players.every((p: any) => p.ready);
          const hasEnoughPlayersNow = room.players.length === 3;

          if (allReadyNow && hasEnoughPlayersNow) {
            console.log(`🎮 房间${roomId}所有玩家准备完毕，开始游戏！（全真人或已满员）`);
            setTimeout(() => {
              gameFlowHandler.startGame(roomId);
            }, 1000);
            return;
          }

          const ensureBotsReadyAndMaybeStart = (targetRoom: any) => {
            targetRoom.players.forEach((p: any) => {
              if (p.isBot) {
                p.ready = true;
              }
            });

            const allReady = targetRoom.players.every((p: any) => p.ready);
            const hasEnoughPlayers = targetRoom.players.length === 3;

            console.log(`房间${roomId}状态: 玩家数=${targetRoom.players.length}, 全部准备=${allReady}`);

            if (allReady && hasEnoughPlayers) {
              console.log(`🎮 房间${roomId}所有玩家准备完毕，开始游戏！`);
              setTimeout(() => {
                gameFlowHandler.startGame(roomId);
              }, 1000);
            }
          };

          if (!isQuickRoom || botDelayMs <= 0) {
            if (room.status === 'waiting' && room.players.length < 3) {
              const maxPlayers = 3;
              while (room.players.length < maxPlayers) {
                try {
                  roomService.addBotPlayer(roomId);
                } catch (e) {
                  console.warn('添加机器人玩家失败:', e);
                  break;
                }
              }
            }
            ensureBotsReadyAndMaybeStart(room);
          } else {
            if (!this.quickRoomBotTimers.has(roomId)) {
              console.log(`⏳ [QuickRoomBot] 计划在 ${botDelayMs}ms 后为快速房间补齐机器人`, {
                roomId,
                botDelayMs,
              });
              const timer = setTimeout(() => {
                this.quickRoomBotTimers.delete(roomId);
                const latestRoom = roomService.getRoom(roomId);
                if (!latestRoom || !latestRoom.players) {
                  return;
                }
                if (latestRoom.status !== 'waiting') {
                  return;
                }

                if (latestRoom.players.length < 3) {
                  const maxPlayers = 3;
                  while (latestRoom.players.length < maxPlayers) {
                    try {
                      roomService.addBotPlayer(roomId);
                    } catch (e) {
                      console.warn('添加机器人玩家失败:', e);
                      break;
                    }
                  }
                }

                ensureBotsReadyAndMaybeStart(latestRoom);
              }, botDelayMs);
              this.quickRoomBotTimers.set(roomId, timer);
            }
          }
        }
      } else {
        socket.emit('error', { message: '准备失败' });
      }

    } catch (error) {
      console.error('准备错误:', error);
      socket.emit('error', {
        message: error instanceof Error ? error.message : '准备过程中发生错误'
      });
    }
  }

  /**
   * 处理抢地主事件
   */
  public async handleBidLandlord(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      const { roomId, userId, bid } = data;
      console.log('🎲 收到抢地主请求:', { roomId, userId, bid });

      // 调用GameFlowHandler处理抢地主
      gameFlowHandler.handleBidLandlord(roomId, userId, bid);

    } catch (error) {
      console.error('抢地主错误:', error);
      socket.emit('error', {
        message: error instanceof Error ? error.message : '抢地主过程中发生错误'
      });
    }
  }

  /**
   * 处理出牌事件
   */
  public async handlePlayCards(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      const { roomId, userId, cards } = data;
      console.log('🎴 收到出牌请求:', { roomId, userId, cards });

      // 使用CardPlayHandler处理出牌
      const cardPlayHandler = gameFlowHandler.getCardPlayHandler();
      if (!cardPlayHandler) {
        console.error('❌ CardPlayHandler未初始化');
        socket.emit('error', { message: '游戏系统错误' });
        return;
      }

      cardPlayHandler.handlePlayCards(roomId, userId, cards, socket.id);

    } catch (error) {
      console.error('出牌错误:', error);
      socket.emit('error', {
        message: error instanceof Error ? error.message : '出牌过程中发生错误'
      });
    }
  }

  /**
   * 处理跳过回合事件（不出）
   */
  public async handlePassTurn(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      const { roomId, userId } = data;
      console.log('🚫 收到不出请求:', { roomId, userId });

      // 使用CardPlayHandler处理不出
      const cardPlayHandler = gameFlowHandler.getCardPlayHandler();
      if (!cardPlayHandler) {
        console.error('❌ CardPlayHandler未初始化');
        socket.emit('error', { message: '游戏系统错误' });
        return;
      }

      cardPlayHandler.handlePass(roomId, userId, socket.id);

    } catch (error) {
      console.error('不出错误:', error);
      socket.emit('error', {
        message: error instanceof Error ? error.message : '不出过程中发生错误'
      });
    }
  }

  /**
   * 处理出牌提示请求（大模型提示）
   */
  public async handleRequestHint(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      const { roomId, userId, llmConfig } = data || {};
      console.log('💡 收到出牌提示请求:', { roomId, userId, llmConfig });

      if (!roomId || !userId) {
        socket.emit('hint_result', {
          success: false,
          error: '参数错误：缺少 roomId 或 userId',
          roomId,
          userId,
        });
        return;
      }

      const selectedModel =
        llmConfig && llmConfig.provider === 'custom'
          ? (typeof llmConfig.customModel === 'string' ? llmConfig.customModel : undefined)
          : (typeof llmConfig?.model === 'string' ? llmConfig.model : undefined);

      const result = await playHintService.getPlayHint(roomId, userId, {
        model: selectedModel,
        customPrompt: typeof llmConfig?.customPrompt === 'string' ? llmConfig.customPrompt : undefined,
        llmConfig: llmConfig
          ? {
              provider: llmConfig.provider,
              model: llmConfig.model,
              apiKey: llmConfig.apiKey,
              customBaseUrl: llmConfig.customBaseUrl,
              customModel: llmConfig.customModel,
            }
          : undefined,
      });

      socket.emit('hint_result', {
        roomId,
        userId,
        ...result,
      });
    } catch (error) {
      console.error('出牌提示错误:', error);
      const message = error instanceof Error ? error.message : '出牌提示过程中发生错误';
      socket.emit('hint_result', {
        success: false,
        error: message,
        roomId: data?.roomId,
        userId: data?.userId,
      });
    }
  }

  /**
   * 处理聊天消息事件 - 简化版
   */
  public async handleSendMessage(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      // 注释掉认证检查
      // if (!socket.authenticated || !socket.userId) {
      //   socket.emit('error', { message: '用户未认证' });
      //   return;
      // }

      const { roomId, message } = data;

      // 确保Socket有用户名
      if (!socket.userName) {
        socket.userName = data.userName || '玩家';
        socket.userId = data.userId || socket.userName;
      }

      // 广播聊天消息给房间内所有玩家（包括自己）
      this.io?.to(`room_${roomId}`).emit('message_received', {
        playerName: socket.userName,
        message: message,
        timestamp: new Date()
      });

      console.log('聊天消息发送:', roomId, socket.userName, message);

    } catch (error) {
      console.error('发送消息错误:', error);
      socket.emit('error', {
        message: error instanceof Error ? error.message : '发送消息过程中发生错误'
      });
    }
  }

  /**
   * 验证用户认证状态 - 注释掉
   */
  private validateAuthentication(socket: AuthenticatedSocket, userId: string): boolean {
    // 注释掉认证检查
    // const isValid = socket.authenticated === true && socket.userId === userId;

    // console.log('🔐 认证检查详情:', {
    //   socketAuthenticated: socket.authenticated,
    //   socketUserId: socket.userId,
    //   socketUserName: socket.userName,
    //   socketSessionId: socket.sessionId,
    //   requestUserId: userId,
    //   isValid: isValid,
    //   socketId: socket.id
    // });

    // if (!isValid) {
    //   console.error('❌ 认证检查失败:', {
    //     reason: !socket.authenticated ? 'socket.authenticated不为true' :
    //             socket.userId !== userId ? `socket.userId(${socket.userId}) !== userId(${userId})` : '未知原因',
    //     socketId: socket.id
    //   });
    // }

    // return isValid;

    // 简化认证检查，总是通过
    return true;
  }

  /**
   * 获取下一个出牌玩家
   */
  private getNextPlayer(room: any, currentPlayerId: string): string {
    if (!room.players || room.players.length === 0) return '';

    const currentIndex = room.players.findIndex((p: any) => p.id === currentPlayerId);
    if (currentIndex === -1) return room.players[0].id;

    const nextIndex = (currentIndex + 1) % room.players.length;
    return room.players[nextIndex].id;
  }

  /**
   * 确保快速游戏区房间存在，并在全部占用时按顺序创建新的 Kxx 房间
   */
  private ensureQuickRooms(): void {
    const QUICK_PREFIX = 'K';
    const BASE_QUICK_COUNT = 6;

    // 1. 确保 K01~K06 存在
    for (let i = 1; i <= BASE_QUICK_COUNT; i++) {
      const roomId = `${QUICK_PREFIX}${String(i).padStart(2, '0')}`;
      const existing = roomService.getRoom(roomId);
      if (!existing) {
        const name = `快速房间 ${roomId}`;
        roomService.ensureRoom(roomId, name);
        console.log(`✅ 初始化快速游戏区房间: ${roomId}`);
      }
    }

    const allRooms = roomService.getAllRooms();
    const quickRooms = allRooms.filter((room: any) =>
      typeof room.id === 'string' && String(room.id).startsWith(QUICK_PREFIX)
    );

    if (quickRooms.length === 0) {
      return;
    }

    const quickWaitingRooms = quickRooms.filter((room: any) => {
      const status = (room as any).status as string | undefined;
      const waiting = !status || status === 'waiting';
      const players = Array.isArray(room.players) ? room.players.length : 0;
      const maxPlayers = typeof room.maxPlayers === 'number' ? room.maxPlayers : 3;
      return waiting && players < maxPlayers;
    });

    // 如果所有快速房间都已满或不在等待状态，则创建一个新的 Kxx 房间（K07 及以后）
    if (quickWaitingRooms.length === 0) {
      const indices = quickRooms
        .map((room: any) => {
          const id = String(room.id);
          const numStr = id.slice(1);
          const n = parseInt(numStr, 10);
          return Number.isNaN(n) ? null : n;
        })
        .filter((n: number | null): n is number => n !== null);

      const maxIndex = indices.length > 0 ? Math.max(...indices) : BASE_QUICK_COUNT;
      const nextIndex = Math.max(maxIndex + 1, BASE_QUICK_COUNT + 1);
      const nextRoomId = `${QUICK_PREFIX}${String(nextIndex).padStart(2, '0')}`;

      if (!roomService.getRoom(nextRoomId)) {
        const name = `快速房间 ${nextRoomId}`;
        roomService.ensureRoom(nextRoomId, name);
        console.log(`✅ 自动创建额外快速游戏区房间: ${nextRoomId}`);
      }
    }
  }

  /**
   * 广播房间列表更新
   */
  public broadcastRoomsUpdate(eventType: string, roomId: string, data?: any): void {
    try {
      // 获取更新后的房间列表
      const rooms = roomService.getAllRooms();

      // 广播给所有连接的客户端
      this.io?.emit('rooms_updated', {
        eventType: eventType,
        roomId: roomId,
        rooms: rooms,
        data: data,
        timestamp: new Date()
      });

      console.log(`广播房间更新: ${eventType}, 房间: ${roomId}, 客户端数量: ${this.io?.sockets?.sockets?.size || 0}`);
    } catch (error) {
      console.error('广播房间更新失败:', error);
    }
  }
}

// 导出单例实例
export const socketEventHandler = SocketEventHandler.getInstance();
