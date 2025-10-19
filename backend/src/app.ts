import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import config from './config';
import indexRoutes from './routes';
import gameRoutes from './routes/gameRoutes';

// 类型定义
interface Player {
  id: string;
  name: string;
  ready: boolean;
  cards?: string[];
  cardCount?: number;
}

interface GameRoom {
  id: string;
  players: Player[];
  readyPlayers: string[];
  gameStarted: boolean;
  bottomCards?: string[];
  landlord?: Player | null;
  currentPlayer?: string;
  lastPlayedCards?: string[];
}

export class Application {
  private app: express.Application;
  private server: any;
  private io!: SocketIOServer;
  private gameRooms: Map<string, GameRoom> = new Map(); // 存储游戏房间状态

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
  }

  private setupMiddleware(): void {
    // CORS配置
    this.app.use(cors(config.cors));

    // JSON解析中间件
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 请求日志中间件
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // 静态文件服务 - 服务前端页面，必须在路由之前设置
    this.app.use(express.static(__dirname + '/../../frontend/public'));

    // 基础路由
    this.app.use('/', indexRoutes);

    // 游戏相关路由
    this.app.use('/api/games', gameRoutes);

    // API文档路由
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
          'POST /api/games/rooms/:roomId/ready': '玩家准备'
        }
      });
    });
  }

  private setupSocketIO(): void {
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.cors.origin,
        methods: ["GET", "POST"]
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`用户连接: ${socket.id}`);

      // 处理游戏相关Socket事件
      socket.on('join_game', (data) => {
        console.log('玩家加入游戏:', data);
        socket.join(`room_${data.roomId}`);

        // 初始化房间状态
        if (!this.gameRooms.has(data.roomId)) {
          this.gameRooms.set(data.roomId, {
            id: data.roomId,
            players: [],
            readyPlayers: [],
            gameStarted: false
          });
        }

        const room = this.gameRooms.get(data.roomId);
        if (room && !room.players.find((p: Player) => p.id === socket.id)) {
          room.players.push({
            id: socket.id,
            name: data.playerName,
            ready: false
          });
        }

        socket.to(`room_${data.roomId}`).emit('player_joined', { playerId: socket.id });
      });

      socket.on('leave_game', (data) => {
        console.log('玩家离开游戏:', socket.id);
        socket.leave(`room_${data.roomId}`);

        // 从房间中移除玩家
        if (this.gameRooms.has(data.roomId)) {
          const room = this.gameRooms.get(data.roomId);
          if (room) {
            room.players = room.players.filter((p: Player) => p.id !== socket.id);
            room.readyPlayers = room.readyPlayers.filter((id: string) => id !== socket.id);

            // 如果房间为空，删除房间
            if (room.players.length === 0) {
              this.gameRooms.delete(data.roomId);
            }
          }
        }

        socket.to(`room_${data.roomId}`).emit('player_left', { playerId: socket.id });
      });

      socket.on('player_ready', (data) => {
        console.log('玩家准备:', data);

        if (this.gameRooms.has(data.roomId)) {
          const room = this.gameRooms.get(data.roomId);
          if (room && !room.readyPlayers.includes(socket.id)) {
            room.readyPlayers.push(socket.id);

            // 检查是否所有玩家都准备好了
            if (room.readyPlayers.length === room.players.length && room.players.length >= 3) {
              this.startGame(data.roomId);
            }
          }
        }

        socket.to(`room_${data.roomId}`).emit('player_ready', { playerId: socket.id });
      });

      socket.on('grab_landlord', (data) => {
        console.log('玩家抢地主:', data);

        if (this.gameRooms.has(data.roomId)) {
          const room = this.gameRooms.get(data.roomId);
          if (room && room.gameStarted && !room.landlord) {
            // 这里应该实现抢地主逻辑
            // 暂时简化：第一个抢地主的玩家成为地主
            if (data.isGrab) {
              room.landlord = room.players.find(p => p.id === socket.id);
              if (room.landlord) {
                // 通知所有玩家地主确定
                this.io.to(`room_${data.roomId}`).emit('landlord_selected', {
                  playerId: room.landlord.id,
                  playerName: room.landlord.name,
                  bottomCards: room.bottomCards
                });

                // 只把底牌发给地主
                this.io.to(room.landlord.id).emit('cards_dealt', {
                  playerId: room.landlord.id,
                  cards: room.bottomCards,
                  isBottomCards: true
                });

                // 开始游戏出牌
                this.startPlaying(data.roomId);
              }
            }
          }
        }
      });

      socket.on('play_cards', (data) => {
        console.log('玩家出牌:', data);

        if (this.gameRooms.has(data.roomId)) {
          const room = this.gameRooms.get(data.roomId);
          if (room && room.gameStarted && room.landlord) {
            const player = room.players.find(p => p.id === socket.id);

            // 验证出牌合法性（这里应该有完整的牌型验证逻辑）
            if (player && this.validateCards(data.cards, player.cards)) {
              // 出牌成功
              socket.emit('play_result', { success: true });

              // 通知其他玩家
              socket.to(`room_${data.roomId}`).emit('cards_played', {
                playerId: socket.id,
                playerName: player.name,
                cards: data.cards,
                nextPlayerId: this.getNextPlayer(room, socket.id)
              });

              // 更新游戏状态
              this.updateGameState(room, socket.id, data.cards);
            } else {
              // 出牌失败
              socket.emit('play_result', {
                success: false,
                error: '出牌不符合规则'
              });
            }
          }
        }
      });

      socket.on('pass_turn', (data) => {
        console.log('玩家跳过回合:', data);

        if (this.gameRooms.has(data.roomId)) {
          const room = this.gameRooms.get(data.roomId);
          if (room && room.gameStarted) {
            // 通知下一个玩家出牌
            const nextPlayerId = this.getNextPlayer(room, socket.id);
            this.io.to(`room_${data.roomId}`).emit('turn_changed', {
              nextPlayerId: nextPlayerId,
              lastPlayedCards: room.lastPlayedCards
            });
          }
        }
      });

      socket.on('send_message', (data) => {
        console.log('玩家发送消息:', data);

        // 广播聊天消息给房间内所有玩家
        socket.to(`room_${data.roomId}`).emit('message_received', {
          playerName: data.playerName,
          message: data.message
        });
      });
    });
  }

  // 开始游戏并发牌
  private startGame(roomId: string) {
    if (!this.gameRooms.has(roomId)) return;

    const room = this.gameRooms.get(roomId);
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
        cards: player.cards
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
    if (!this.gameRooms.has(roomId)) return;

    const room = this.gameRooms.get(roomId);
    if (!room || !room.landlord) return;

    // 设置第一个出牌玩家为地主
    room.currentPlayer = room.landlord.id;

    // 通知所有玩家游戏开始出牌
    this.io.to(`room_${roomId}`).emit('turn_changed', {
      nextPlayerId: room.currentPlayer,
      lastPlayedCards: null
    });
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
  private getNextPlayer(room: GameRoom, currentPlayerId: string): string {
    if (!room.players || room.players.length === 0) return '';

    const currentIndex = room.players.findIndex(p => p.id === currentPlayerId);
    if (currentIndex === -1) return room.players[0].id;

    const nextIndex = (currentIndex + 1) % room.players.length;
    return room.players[nextIndex].id;
  }

  // 更新游戏状态
  private updateGameState(room: GameRoom, playerId: string, playedCards: string[]) {
    // 更新最后出牌信息
    room.lastPlayedCards = playedCards;
    room.currentPlayer = this.getNextPlayer(room, playerId);

    // 从玩家手牌中移除出的牌
    const player = room.players.find(p => p.id === playerId);
    if (player && player.cards) {
      player.cards = player.cards.filter(card => !playedCards.includes(card));
      player.cardCount = player.cards.length;
    }

    // 检查游戏是否结束
    if (player && player.cardCount === 0) {
      // 游戏结束
      this.endGame(room, player);
    }
  }

  // 结束游戏
  private endGame(room: GameRoom, winner: Player) {
    room.gameStarted = false;

    // 通知所有玩家游戏结束
    this.io.to(`room_${room.id}`).emit('game_ended', {
      winner: winner,
      reason: '玩家出完所有牌'
    });
  }

  public start(): void {
    this.server.listen(config.server.port, () => {
      console.log(`🚀 斗地主游戏服务器启动成功`);
      console.log(`📍 服务器地址: http://localhost:${config.server.port}`);
      console.log(`🔧 环境: ${config.server.nodeEnv}`);
      console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`);
      console.log(`📚 API文档: http://localhost:${config.server.port}/api`);
    });
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
