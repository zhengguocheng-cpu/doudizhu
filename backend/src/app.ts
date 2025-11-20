import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config';
import indexRoutes from './routes';
import gameRoutes from './routes/gameRoutes';
import scoreRoutes from './routes/scoreRoutes';
import { createUserManager, UserManager } from './services/user/userManager';
import { PlayerSession } from './services/player/playerSession';
import { StateRecoveryService } from './services/state/stateRecovery';
import { GameRoom } from './types/room';
import { Player } from './types/player';
import { gameRoomsService } from './services/game/gameRoomsService';
import { roomService } from './services/room/roomService';
import { AuthMiddleware } from './middleware/AuthMiddleware';
import { socketEventHandler } from './services/socket/SocketEventHandler';
import { ServiceRegistry } from './core/ServiceRegistry';
import { DependencyContainer } from './core/container';

export class Application {
  private app: express.Application;
  private server: any;
  private io!: SocketIOServer;
  private userManager: any;
  private sessionManager!: PlayerSession;
  private stateRecovery!: StateRecoveryService;
  private authMiddleware!: AuthMiddleware;
  private eventHandler = socketEventHandler;
  private container: DependencyContainer;
  private initialized: boolean = false;

  constructor() {
    this.app = express();
    this.container = DependencyContainer.getInstance();
  }

  private async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('⏭️ 已初始化，跳过');
      return;
    }
    
    console.log('1️⃣ 初始化服务...');
    await this.initializeServices();
    
    console.log('2️⃣ 解析依赖...');
    this.sessionManager = this.container.resolve('SessionManager');
    this.userManager = this.container.resolve('UserManager');
    this.authMiddleware = this.container.resolve('AuthMiddleware');
    this.stateRecovery = new StateRecoveryService();

    console.log('3️⃣ 设置中间件...');
    this.setupMiddleware();
    
    console.log('4️⃣ 设置路由...');
    this.setupRoutes();
    
    console.log('5️⃣ 设置清理任务...');
    this.setupCleanupTasks();
    
    this.initialized = true;
    console.log('✅ 所有初始化步骤完成');
  }

  private setupMiddleware(): void {
    // CORS配置
    this.app.use(cors(config.legacy.cors));

    // JSON解析中间件
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // CSP头 - 允许内联脚本和样式
    this.app.use((req, res, next) => {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss:; img-src 'self' data:;"
      );
      next();
    });

    // 请求日志中间件
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // 1. API路由 - 最具体的路径优先
    this.app.get('/api', (req, res) => {
      res.json({
        title: '斗地主游戏API文档',
        version: '1.0.0',
        endpoints: {
          'GET /': '服务器状态',
          'GET /health': '健康检查',
          'GET /info': '服务器信息',
          'GET /api/games/rooms': '获取所有房间',
          'POST /api/games/rooms': '创建房间',
          'GET /api/games/rooms/:roomId': '获取房间详情',
          'POST /api/games/rooms/:roomId/join': '加入房间',
          'POST /api/games/rooms/:roomId/ready': '玩家准备',
          'GET /api/score/:userId': '获取玩家积分',
          'GET /api/score/:userId/stats': '获取玩家统计',
          'GET /api/score/leaderboard/:type': '获取排行榜'
        }
      });
    });

    // 2. 积分API路由 - 前缀匹配 /api/score/*
    this.app.use('/api/score', scoreRoutes);

    // 3. 游戏API路由 - 前缀匹配 /api/games/*
    this.app.use('/api/games', gameRoutes);

    // 3. 页面路由 - 直接挂载，不使用前缀
    this.app.use(indexRoutes);

    // 4. 静态文件服务 - 最后作为fallback
    // 使用 process.cwd() 而不是 __dirname，因为编译后 __dirname 会指向 dist 目录
    const frontendPath = path.join(process.cwd(), '..', 'frontend', 'public');
    console.log('📁 静态文件路径:', frontendPath);
    this.app.use(express.static(frontendPath));
  }

  private setupSocketIO(): void {
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      path: '/api/socket.io',
      cors: {
        origin: config.legacy.cors.origin,
        methods: ["GET", "POST"]
      }
    });

    // 在这里初始化eventHandler，确保在设置事件监听器之前可用
    this.eventHandler = socketEventHandler;
    this.eventHandler.initialize(this.io);

    // this.io.on('connection', (socket) => {
    //   console.log(`用户连接: ${socket.id}`);

    //   // 使用认证中间件处理认证（如果可用）
    //   if (this.authMiddleware) {
    //     this.authMiddleware.authenticateSocket(socket, (err?: any) => {
    //       if (err) {
    //         console.error('认证中间件错误:', err);
    //         return;
    //       }
    //     });
    //   } else {
    //     console.warn('认证中间件未初始化，直接设置Socket事件处理器');
    //   }
    //   // 设置Socket事件处理器
    //   this.setupSocketEventHandlers(socket);
    // });
    
    this.setupSocketConnection();

    // 监听用户断开连接事件，清理房间状态
    this.setupDisconnectionHandler();
  }
  
  private setupSocketConnection():void {

    this.io.on('connection', (socket) => {
      console.log(`用户连接: ${socket.id}`);

    // 使用认证中间件处理认证（如果可用）
    if (this.authMiddleware) {
      this.authMiddleware.authenticateSocket(socket, (err?: any) => {
        if (err) {
          console.error('认证中间件错误:', err);
          return;
        }
      });
    } else {
      console.warn('认证中间件未初始化，直接设置Socket事件处理器');
    }
    this.setupSocketEventHandlers(socket);
    });
  }

  /**
   * 设置断开连接处理器
   * 当用户断开连接时，自动从所有房间中移除该玩家
   */
  private setupDisconnectionHandler(): void {
    try {
      // EventBus是单例，直接获取实例
      const { EventBus } = require('./core/EventBus');
      const eventBus = EventBus.getInstance();
      eventBus.subscribe('user:disconnected', (event: any) => {
        const userId = event?.userId || event?.data?.userId;

        console.log('🛰 [EventBus] 收到 user:disconnected 事件:', {
          rawUserId: event?.userId,
          dataUserId: event?.data?.userId,
        });

        if (!userId) {
          console.warn('⚠️ user:disconnected 事件中缺少 userId，跳过房间清理');
          return;
        }

        console.log(`🔄 [清理] 用户断开连接，清理房间状态: ${userId}`);

        // 遍历所有房间，处理该玩家的断线
        const rooms = roomService.getAllRooms();
        rooms.forEach(room => {
          const player = room.players.find(p => p.id === userId || p.userId === userId);
          if (!player) {
            return;
          }

          // 如果游戏还在进行中，标记玩家离线，保留其座位，供后续重连
          if (room.status === 'bidding' || room.status === 'playing') {
            console.log(`   房间 ${room.id} 游戏进行中，仅标记玩家 ${userId} 为离线`);
            player.isOnline = false;
            room.updatedAt = new Date();
            return;
          }

          // 否则（未开始或已结束），执行原有离开逻辑
          console.log(`   从房间 ${room.id} 移除玩家 ${userId}`);
          roomService.leaveRoom(room.id, userId);
          
          // 通知房间内其他玩家
          this.io.to(`room_${room.id}`).emit('player_left', {
            playerId: userId,
            playerName: userId,
            roomId: room.id,
            currentPlayers: room.players.length,
            players: room.players || []
          });

          // 同步广播房间列表更新（供大厅房间列表使用）
          // 这样旧版大厅页面监听的 rooms_updated 事件也能实时看到人数变化
          this.broadcastRoomsUpdate('player_left', room.id, {
            playerId: userId
          });
        });
      });
      console.log('✅ 断开连接处理器已设置');
    } catch (error) {
      console.warn('⚠️ 无法设置断开连接处理器:', error);
    }
  }

  private setupSocketEventHandlers(socket: any): void {
    // 使用事件处理器服务处理所有Socket事件
    socket.on('join_game', (data: any) => {
      this.eventHandler.handleJoinGame(socket, data);
    });

    socket.on('leave_game', (data: any) => {
      this.eventHandler.handleLeaveGame(socket, data);
    });

    socket.on('player_ready', (data: any) => {
      this.eventHandler.handlePlayerReady(socket, data);
    });

    
    // 添加开始游戏事件
    socket.on('start_game', (data: any) => {
      this.handleStartGame(socket, data);
    });

    // 添加抢地主事件
    socket.on('bid', (data: any) => {
      console.log('🎲 [Socket] 收到bid事件:', data);
      this.eventHandler.handleBidLandlord(socket, data);
    });
    socket.on('play_cards', (data: any) => {
      this.eventHandler.handlePlayCards(socket, data);
    });

    socket.on('pass_turn', (data: any) => {
      this.eventHandler.handlePassTurn(socket, data);
    });

    socket.on('send_message', (data: any) => {
      this.eventHandler.handleSendMessage(socket, data);
    });

    // 添加房间列表相关事件
    socket.on('get_rooms_list', (data: any) => {
      this.eventHandler.handleGetRoomsList(socket, data);
    });

    // 添加获取房间状态事件
    socket.on('get_room_state', (data: any) => {
      this.eventHandler.handleGetRoomState(socket, data);
    });


    // // 添加出牌事件
    // socket.on('play_cards', (data: any) => {
    //   this.eventHandler.handlePlayCards(socket, data);
    // });

    // // 添加不出事件
    // socket.on('pass_turn', (data: any) => {
    //   this.eventHandler.handlePassTurn(socket, data);
    // });
  }

  /**
   * 处理开始游戏请求
   * 注意：游戏实际上在所有玩家准备后通过GameFlowHandler自动开始
   * 这个方法主要用于记录日志和处理手动开始游戏的请求
   */
  private async handleStartGame(socket: any, data: any): Promise<void> {
    try {
      const { roomId, userId } = data;
      console.log(`🎮 收到开始游戏请求: 房间 ${roomId}, 玩家 ${userId}`);

      // 检查房间是否存在
      const room = roomService.getRoom(roomId);
      if (!room) {
        console.error(`❌ 房间 ${roomId} 不存在`);
        socket.emit('error', { message: '房间不存在' });
        return;
      }

      // 检查玩家数量
      if (!room.players || room.players.length < 3) {
        console.error(`❌ 房间 ${roomId} 玩家数量不足`);
        socket.emit('error', { message: '玩家数量不足，需要3名玩家' });
        return;
      }

      // 检查是否所有玩家都准备
      const allReady = room.players.every((p: any) => p.ready);
      if (!allReady) {
        console.error(`❌ 房间 ${roomId} 并非所有玩家都准备好`);
        socket.emit('error', { message: '请等待所有玩家准备' });
        return;
      }

      // 游戏会在所有玩家准备后自动开始（通过GameFlowHandler）
      console.log(`✅ 房间 ${roomId} 满足开始条件，游戏将自动开始`);
      
    } catch (error) {
      console.error('处理开始游戏请求失败:', error);
      socket.emit('error', {
        message: error instanceof Error ? error.message : '开始游戏过程中发生错误'
      });
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

  // 开始游戏并发牌
  private startGame(roomId: string) {
    if (!gameRoomsService.getGameRoom(roomId)) return;

    const room = gameRoomsService.getGameRoom(roomId);
    if (!room || room.gameStarted) return;

    room.gameStarted = true;

    // 创建一副牌
    const deck = this.createDeck();
    const shuffledDeck = this.shuffleDeck(deck);

    // 斗地主规则：3人游戏，每人17张，剩3张底牌
    const cardsPerPlayer = 17;
    const remainingCards = 3;

    // 发牌给玩家
    for (let i = 0; i < room.players.length; i++) {
      const player = room.players[i];
      const startIndex = i * cardsPerPlayer;
      const endIndex = startIndex + cardsPerPlayer;
      player.cards = shuffledDeck.slice(startIndex, endIndex);
      player.cardCount = cardsPerPlayer;
    }

    // 底牌
    room.bottomCards = shuffledDeck.slice(-remainingCards);

    // 通知所有玩家游戏开始并发送手牌
    room.players.forEach((player: Player) => {
      this.io.to(player.id).emit('cards_dealt', {
        playerId: player.id,
        cards: player.cards || []
      });
    });

    // 广播游戏状态更新
    this.io.to(`room_${roomId}`).emit('game_state_updated', {
      gameState: {
        currentPlayer: room.players[0].id, // 第一个玩家先出牌
        bottomCards: room.bottomCards,
        players: room.players.map((p: Player) => ({
          id: p.id,
          name: p.name,
          cardCount: p.cardCount
        }))
      }
    });

    // 更新房间数据
    gameRoomsService.setGameRoom(roomId, room);

    console.log(`游戏开始，房间 ${roomId} 发牌完成`);
  }

  // 创建一副牌
  private createDeck(): string[] {
    const suits = ['♠', '♥', '♣', '♦'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck: string[] = [];

    // 添加普通牌
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push(suit + rank);
      }
    }

    // 添加大小王
    deck.push('🃏'); // 小王
    deck.push('🂠'); // 大王

    return deck;
  }

  // 洗牌算法
  private shuffleDeck(deck: string[]): string[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // 开始游戏出牌阶段
  private startPlaying(roomId: string) {
    if (!gameRoomsService.getGameRoom(roomId)) return;

    const room = gameRoomsService.getGameRoom(roomId);
    if (!room || !room.landlord) return;

    // 设置第一个出牌玩家为地主
    room.currentPlayer = room.landlord.id;

    // 通知所有玩家游戏开始出牌
    this.io.to(`room_${roomId}`).emit('turn_changed', {
      nextPlayerId: room.currentPlayer,
      lastPlayedCards: null
    });

    // 更新房间数据
    gameRoomsService.setGameRoom(roomId, room);
  }

  // 验证出牌合法性
  private validateCards(cards: string[], playerCards: string[]): boolean {
    // 简单的验证：玩家必须有这些牌
    for (const card of cards) {
      if (!playerCards.includes(card)) {
        return false;
      }
    }
    return true;
  }

  // 获取下一个出牌玩家
  private getNextPlayer(room: any, currentPlayerId: string): string {
    if (!room.players || room.players.length === 0) return '';

    const currentIndex = room.players.findIndex((p: any) => p.id === currentPlayerId);
    if (currentIndex === -1) return room.players[0].id;

    const nextIndex = (currentIndex + 1) % room.players.length;
    return room.players[nextIndex].id;
  }

  // 更新游戏状态
  private updateGameState(room: any, playerId: string, playedCards: string[]) {
    // 更新最后出牌信息
    room.lastPlayedCards = playedCards;
    room.currentPlayer = this.getNextPlayer(room, playerId);

    // 从玩家手牌中移除出的牌
    const player = room.players.find((p: any) => p.id === playerId);
    if (player && player.cards) {
      player.cards = player.cards.filter((card: string) => !playedCards.includes(card));
      player.cardCount = player.cards.length;
    }

    // 检查游戏是否结束
    if (player && player.cardCount === 0) {
      // 游戏结束
      this.endGame(room, player);
    }
  }

  // 结束游戏
  private endGame(room: any, winner: any) {
    room.gameStarted = false;

    // 通知所有玩家游戏结束
    this.io.to(`room_${room.id}`).emit('game_ended', {
      winner: winner,
      reason: '玩家出完所有牌'
    });
  }

  /**
   * 初始化服务注册器
   */
  private initializeServices(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const serviceRegistry = new ServiceRegistry();
        serviceRegistry.registerAllServices();

        // 注意：现在container.resolve()会自动调用initialize()，所以这里不需要重复调用
        // 但是我们仍然需要resolve主要的服务来确保它们被初始化
        const tokens = this.container.getRegisteredTokens();
        for (const token of tokens) {
          // 解析服务但不重复调用initialize，因为resolve()已经调用了
          this.container.resolve(token);
        }

        console.log('Socket事件处理器设置完成');
        resolve(); // ✅ 关键：必须调用resolve()
      } catch (error) {
        console.error('❌ 服务注册或初始化失败:', error);
        reject(error);
      }
    });
  }

  /**
   * 设置定时清理任务
   */
  private setupCleanupTasks(): void {
    // 每5分钟清理一次过期会话和状态
    setInterval(() => {
      try {
        const cleanedSessions = this.sessionManager.cleanupOfflineSessions();
        const cleanedStates = this.stateRecovery.cleanupExpiredStates(30);
        const cleanedUsers = this.userManager.cleanupOfflineUsers(60);

        if (cleanedSessions > 0 || cleanedStates > 0 || cleanedUsers > 0) {
          console.log(`🧹 清理过期资源: 会话 ${cleanedSessions} 个, 状态 ${cleanedStates} 个, 用户 ${cleanedUsers} 个`);
        }
      } catch (error) {
        console.error('清理任务执行失败:', error);
      }
    }, 5 * 60 * 1000); // 5分钟
    
    // 每2分钟清理一次长时间未准备的僵尸玩家
    setInterval(() => {
      try {
        const rooms = roomService.getAllRooms();
        const now = Date.now();
        const MAX_WAIT_MS = 5 * 60 * 1000; // 5分钟未准备就踢出
        let kickedCount = 0;
        
        rooms.forEach(room => {
          if (room.status === 'waiting') {
            // 找出进房超过5分钟仍未准备的玩家
            const playersToKick = room.players.filter((p: any) => {
              if (p.ready) return false; // 已准备的不踢
              // 检查玩家进房时间（如果有）
              const joinTime = (p as any).joinedAt ? new Date((p as any).joinedAt).getTime() : now;
              return (now - joinTime) > MAX_WAIT_MS;
            });
            
            playersToKick.forEach((p: any) => {
              console.log(`🧹 [僵尸玩家] 踢出超时未准备玩家: ${p.name} (房间: ${room.id})`);
              roomService.leaveRoom(room.id, p.id);
              kickedCount++;
              
              // 通知房间内其他玩家
              this.io.to(`room_${room.id}`).emit('player_left', {
                playerId: p.id,
                playerName: p.name,
                roomId: room.id,
                reason: 'timeout',
                currentPlayers: room.players.length
              });
            });
          }
        });
        
        if (kickedCount > 0) {
          console.log(`🧹 [僵尸玩家] 本次清理: ${kickedCount} 个超时未准备玩家`);
        }
      } catch (error) {
        console.error('清理僵尸玩家任务失败:', error);
      }
    }, 2 * 60 * 1000); // 2分钟

    // 每小时输出系统状态
    setInterval(() => {
      try {
        const sessionStats = this.sessionManager.getSessionStats();
        const userStats = this.userManager.getUserStats();
        const stateStats = this.stateRecovery.getStateStats();

        console.log(`📊 系统状态: 用户(${userStats.online}/${userStats.total}), 会话(${sessionStats.online}/${sessionStats.total}), 状态(${stateStats.inRooms}/${stateStats.total})`);
      } catch (error) {
        console.error('状态统计失败:', error);
      }
    }, 60 * 60 * 1000); // 1小时
  }

  public async start(): Promise<void> {
    try {
      console.log('🔄 开始初始化服务...');
      
      // 等待初始化完成
      await this.initialize();
      console.log('✅ 初始化完成');
      
      // 初始化Socket.IO服务器
      this.setupSocketIO();
      console.log('✅ Socket.IO初始化完成');

      // 启动HTTP服务器
      console.log('🔄 开始监听端口...');
      await new Promise<void>((resolve, reject) => {
        this.server.listen(config.server.port, () => {
          console.log(`🚀 斗地主游戏服务器启动成功`);
          console.log(`📍 服务器地址: http://localhost:${config.server.port}`);
          console.log(`🔧 环境: ${config.legacy.nodeEnv}`);
          console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`);
          console.log(`📚 API文档: http://localhost:${config.server.port}/api`);
          resolve();
        });
        
        this.server.on('error', (error: Error) => {
          console.error('❌ 服务器监听错误:', error);
          reject(error);
        });
      });
      
      console.log('✅ 服务器启动流程完成');
    } catch (error) {
      console.error('❌ 服务器启动失败:', error);
      process.exit(1);
    }
  }

  public getApp(): express.Application {
    return this.app;
  }

  public getServer(): any {
    return this.server;
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

export default Application;
