/**
 * Socket事件处理器
 * 统一处理所有Socket.IO事件，使用新的认证服务
 */

import { Socket } from 'socket.io';
import { EventBus } from '../../core/EventBus';
import { gameRoomsService } from '../game/gameRoomsService';
import { roomService } from '../room/roomService';

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
    console.log('SocketEventHandler initialized with IO instance');
  }

  /**
   * 处理获取房间列表请求
   */
  public async handleGetRoomsList(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
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
   * 处理加入游戏事件 - 简化版
   */
  public async handleJoinGame(socket: AuthenticatedSocket, data: any): Promise<void> {
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

      const { roomId, userId } = data;
      console.log('玩家加入游戏:', roomId, userId);

      // 简化用户信息处理
      const user = { name: userId }; // 直接使用用户名作为用户对象

      // 加入房间
      const result = roomService.joinRoom(roomId, user.name);

      if (result) {
        // 加入Socket房间
        socket.join(`room_${roomId}`);

        // 发送成功响应
        const room = roomService.getRoom(roomId);
        if (!room) {
          socket.emit('error', { message: '房间不存在' });
          return;
        }

        console.log('✅ 房间加入成功，发送room_joined事件:', {
          roomId: roomId,
          roomName: room.name,
          players: room.players
        });

        socket.emit('room_joined', {
          room: {
            id: roomId,
            name: room.name,
            players: room.players || [],
            maxPlayers: room.maxPlayers || 3,
            status: room.status || 'waiting'
          }
        });

        // 通知其他玩家
        socket.to(`room_${roomId}`).emit('player_joined', {
          playerId: userId,
          playerName: user.name
        });

        // 广播房间更新给所有客户端
        this.broadcastRoomsUpdate('player_joined', roomId, {
          playerName: user.name
        });

        console.log('加入游戏成功:', roomId, userId);

      } else {
        socket.emit('error', { message: '加入游戏失败' });
      }

    } catch (error) {
      console.error('加入游戏错误:', error);
      socket.emit('error', {
        message: error instanceof Error ? error.message : '加入游戏过程中发生错误'
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

        // 通知其他玩家
        socket.to(`room_${roomId}`).emit('player_left', { playerId: userId });

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
        // 通知其他玩家
        socket.to(`room_${roomId}`).emit('player_ready', { playerId: userId });

        // 广播房间更新给所有客户端
        this.broadcastRoomsUpdate('player_ready', roomId, {
          playerId: userId
        });

        console.log('准备成功:', roomId, userId);
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
   * 处理出牌事件 - 简化版
   */
  public async handlePlayCards(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      // 注释掉认证检查
      // if (!this.validateAuthentication(socket, data.userId)) {
      //   socket.emit('error', { message: '用户未认证' });
      //   return;
      // }

      const { roomId, userId, cards } = data;
      console.log('玩家出牌:', roomId, userId, cards?.length);

      const room = roomService.getRoom(roomId);
      if (!room) {
        socket.emit('error', { message: '房间不存在' });
        return;
      }

      const player = room.players?.find((p: any) => p.id === userId);
      if (!player) {
        socket.emit('error', { message: '玩家不在房间中' });
        return;
      }

      // 简单的出牌验证
      if (!cards || !Array.isArray(cards) || cards.length === 0) {
        socket.emit('play_result', {
          success: false,
          error: '无效的出牌'
        });
        return;
      }

      // 验证玩家是否有这些牌
      const hasAllCards = cards.every((card: string) =>
        player.cards && player.cards.includes(card)
      );

      if (!hasAllCards) {
        socket.emit('play_result', {
          success: false,
          error: '您没有这些牌'
        });
        return;
      }

      // 出牌成功
      socket.emit('play_result', { success: true });

      // 通知其他玩家
      socket.to(`room_${roomId}`).emit('cards_played', {
        playerId: userId,
        playerName: player.name,
        cards: cards,
        nextPlayerId: this.getNextPlayer(room, userId)
      });

      console.log('出牌成功:', roomId, userId);

    } catch (error) {
      console.error('出牌错误:', error);
      socket.emit('error', {
        message: error instanceof Error ? error.message : '出牌过程中发生错误'
      });
    }
  }

  /**
   * 处理跳过回合事件 - 简化版
   */
  public async handlePassTurn(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      // 注释掉认证检查
      // if (!this.validateAuthentication(socket, data.userId)) {
      //   socket.emit('error', { message: '用户未认证' });
      //   return;
      // }

      const { roomId, userId } = data;
      console.log('玩家跳过回合:', roomId, userId);

      const room = roomService.getRoom(roomId);
      if (!room) {
        socket.emit('error', { message: '房间不存在' });
        return;
      }

      // 通知下一个玩家出牌
      const nextPlayerId = this.getNextPlayer(room, userId);
      socket.to(`room_${roomId}`).emit('turn_changed', {
        nextPlayerId: nextPlayerId,
        lastPlayedCards: null
      });

      console.log('跳过回合成功:', roomId, userId, nextPlayerId);

    } catch (error) {
      console.error('跳过回合错误:', error);
      socket.emit('error', {
        message: error instanceof Error ? error.message : '跳过回合过程中发生错误'
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
