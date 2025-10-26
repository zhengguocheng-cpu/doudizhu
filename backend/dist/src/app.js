"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Application = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const config_1 = require("./config");
const routes_1 = __importDefault(require("./routes"));
const gameRoutes_1 = __importDefault(require("./routes/gameRoutes"));
const stateRecovery_1 = require("./services/state/stateRecovery");
const gameRoomsService_1 = require("./services/game/gameRoomsService");
const roomService_1 = require("./services/room/roomService");
const SocketEventHandler_1 = require("./services/socket/SocketEventHandler");
const ServiceRegistry_1 = require("./core/ServiceRegistry");
const container_1 = require("./core/container");
class Application {
    constructor() {
        this.app = (0, express_1.default)();
        this.container = container_1.DependencyContainer.getInstance();
        this.initializeServices().then(() => {
            this.sessionManager = this.container.resolve('SessionManager');
            this.userManager = this.container.resolve('UserManager');
            this.authMiddleware = this.container.resolve('AuthMiddleware');
            this.stateRecovery = new stateRecovery_1.StateRecoveryService();
            this.setupMiddleware();
            this.setupRoutes();
            this.setupCleanupTasks();
        }).catch(error => {
            console.error('Application初始化失败:', error);
            process.exit(1);
        });
    }
    setupMiddleware() {
        this.app.use((0, cors_1.default)(config_1.config.legacy.cors));
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use((req, res, next) => {
            res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss:; img-src 'self' data:;");
            next();
        });
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }
    setupRoutes() {
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
        this.app.use('/api/games', gameRoutes_1.default);
        this.app.use(routes_1.default);
        this.app.use(express_1.default.static(__dirname + '/../../frontend/public'));
    }
    setupSocketIO() {
        this.server = (0, http_1.createServer)(this.app);
        this.io = new socket_io_1.Server(this.server, {
            cors: {
                origin: config_1.config.legacy.cors.origin,
                methods: ["GET", "POST"]
            }
        });
        this.eventHandler = SocketEventHandler_1.socketEventHandler;
        this.eventHandler.initialize(this.io);
        this.io.on('connection', (socket) => {
            console.log(`用户连接: ${socket.id}`);
            if (this.authMiddleware) {
                this.authMiddleware.authenticateSocket(socket, (err) => {
                    if (err) {
                        console.error('认证中间件错误:', err);
                        return;
                    }
                    this.setupSocketEventHandlers(socket);
                });
            }
            else {
                console.warn('认证中间件未初始化，直接设置Socket事件处理器');
                this.setupSocketEventHandlers(socket);
            }
        });
    }
    setupSocketEventHandlers(socket) {
        socket.on('join_game', (data) => {
            this.eventHandler.handleJoinGame(socket, data);
        });
        socket.on('leave_game', (data) => {
            this.eventHandler.handleLeaveGame(socket, data);
        });
        socket.on('player_ready', (data) => {
            this.eventHandler.handlePlayerReady(socket, data);
        });
        socket.on('play_cards', (data) => {
            this.eventHandler.handlePlayCards(socket, data);
        });
        socket.on('pass_turn', (data) => {
            this.eventHandler.handlePassTurn(socket, data);
        });
        socket.on('send_message', (data) => {
            this.eventHandler.handleSendMessage(socket, data);
        });
        socket.on('get_rooms_list', (data) => {
            this.eventHandler.handleGetRoomsList(socket, data);
        });
        socket.on('start_game', (data) => {
            this.handleStartGame(socket, data);
        });
    }
    async handleStartGame(socket, data) {
        try {
            const { roomId, userId } = data;
            console.log(`🎮 收到开始游戏请求: 房间 ${roomId}, 玩家 ${userId}`);
            const gameEngine = this.container.resolve('GameEngine');
            const result = gameEngine.startGame(roomId);
            if (result.success) {
                console.log(`✅ 游戏开始成功，房间 ${roomId}`);
                const room = roomService_1.roomService.getRoom(roomId);
                if (room) {
                    room.players.forEach((player) => {
                        this.io.to(player.id).emit('cards_dealt', {
                            playerId: player.id,
                            cards: player.cards || []
                        });
                    });
                    this.io.to(`room_${roomId}`).emit('game_state_updated', {
                        gameState: {
                            currentPlayer: room.players[0].id,
                            bottomCards: room.cards?.remaining || [],
                            players: room.players.map((p) => ({
                                id: p.id,
                                name: p.name,
                                cardCount: p.cardCount
                            }))
                        }
                    });
                    this.broadcastRoomsUpdate('game_started', roomId);
                }
            }
            else {
                console.error(`❌ 游戏开始失败: ${result.error}`);
                socket.emit('error', { message: result.error || '开始游戏失败' });
            }
        }
        catch (error) {
            console.error('处理开始游戏请求失败:', error);
            socket.emit('error', {
                message: error instanceof Error ? error.message : '开始游戏过程中发生错误'
            });
        }
    }
    broadcastRoomsUpdate(eventType, roomId, data) {
        try {
            const rooms = roomService_1.roomService.getAllRooms();
            this.io?.emit('rooms_updated', {
                eventType: eventType,
                roomId: roomId,
                rooms: rooms,
                data: data,
                timestamp: new Date()
            });
            console.log(`广播房间更新: ${eventType}, 房间: ${roomId}, 客户端数量: ${this.io?.sockets?.sockets?.size || 0}`);
        }
        catch (error) {
            console.error('广播房间更新失败:', error);
        }
    }
    startGame(roomId) {
        if (!gameRoomsService_1.gameRoomsService.getGameRoom(roomId))
            return;
        const room = gameRoomsService_1.gameRoomsService.getGameRoom(roomId);
        if (!room || room.gameStarted)
            return;
        room.gameStarted = true;
        const deck = this.createDeck();
        const shuffledDeck = this.shuffleDeck(deck);
        const cardsPerPlayer = 17;
        const remainingCards = 3;
        for (let i = 0; i < room.players.length; i++) {
            const player = room.players[i];
            const startIndex = i * cardsPerPlayer;
            const endIndex = startIndex + cardsPerPlayer;
            player.cards = shuffledDeck.slice(startIndex, endIndex);
            player.cardCount = cardsPerPlayer;
        }
        room.bottomCards = shuffledDeck.slice(-remainingCards);
        room.players.forEach((player) => {
            this.io.to(player.id).emit('cards_dealt', {
                playerId: player.id,
                cards: player.cards || []
            });
        });
        this.io.to(`room_${roomId}`).emit('game_state_updated', {
            gameState: {
                currentPlayer: room.players[0].id,
                bottomCards: room.bottomCards,
                players: room.players.map((p) => ({
                    id: p.id,
                    name: p.name,
                    cardCount: p.cardCount
                }))
            }
        });
        gameRoomsService_1.gameRoomsService.setGameRoom(roomId, room);
        console.log(`游戏开始，房间 ${roomId} 发牌完成`);
    }
    createDeck() {
        const suits = ['♠', '♥', '♣', '♦'];
        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const deck = [];
        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push(suit + rank);
            }
        }
        deck.push('🃏');
        deck.push('🂠');
        return deck;
    }
    shuffleDeck(deck) {
        const shuffled = [...deck];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    startPlaying(roomId) {
        if (!gameRoomsService_1.gameRoomsService.getGameRoom(roomId))
            return;
        const room = gameRoomsService_1.gameRoomsService.getGameRoom(roomId);
        if (!room || !room.landlord)
            return;
        room.currentPlayer = room.landlord.id;
        this.io.to(`room_${roomId}`).emit('turn_changed', {
            nextPlayerId: room.currentPlayer,
            lastPlayedCards: null
        });
        gameRoomsService_1.gameRoomsService.setGameRoom(roomId, room);
    }
    validateCards(cards, playerCards) {
        for (const card of cards) {
            if (!playerCards.includes(card)) {
                return false;
            }
        }
        return true;
    }
    getNextPlayer(room, currentPlayerId) {
        if (!room.players || room.players.length === 0)
            return '';
        const currentIndex = room.players.findIndex((p) => p.id === currentPlayerId);
        if (currentIndex === -1)
            return room.players[0].id;
        const nextIndex = (currentIndex + 1) % room.players.length;
        return room.players[nextIndex].id;
    }
    updateGameState(room, playerId, playedCards) {
        room.lastPlayedCards = playedCards;
        room.currentPlayer = this.getNextPlayer(room, playerId);
        const player = room.players.find((p) => p.id === playerId);
        if (player && player.cards) {
            player.cards = player.cards.filter((card) => !playedCards.includes(card));
            player.cardCount = player.cards.length;
        }
        if (player && player.cardCount === 0) {
            this.endGame(room, player);
        }
    }
    endGame(room, winner) {
        room.gameStarted = false;
        this.io.to(`room_${room.id}`).emit('game_ended', {
            winner: winner,
            reason: '玩家出完所有牌'
        });
    }
    initializeServices() {
        return new Promise((resolve, reject) => {
            try {
                const serviceRegistry = new ServiceRegistry_1.ServiceRegistry();
                serviceRegistry.registerAllServices();
                const tokens = this.container.getRegisteredTokens();
                for (const token of tokens) {
                    this.container.resolve(token);
                }
                console.log('Socket事件处理器设置完成');
            }
            catch (error) {
                console.error('❌ 服务注册或初始化失败:', error);
                reject(error);
            }
        });
    }
    setupCleanupTasks() {
        setInterval(() => {
            try {
                const cleanedSessions = this.sessionManager.cleanupOfflineSessions();
                const cleanedStates = this.stateRecovery.cleanupExpiredStates(30);
                const cleanedUsers = this.userManager.cleanupOfflineUsers(60);
                if (cleanedSessions > 0 || cleanedStates > 0 || cleanedUsers > 0) {
                    console.log(`🧹 清理过期资源: 会话 ${cleanedSessions} 个, 状态 ${cleanedStates} 个, 用户 ${cleanedUsers} 个`);
                }
            }
            catch (error) {
                console.error('清理任务执行失败:', error);
            }
        }, 5 * 60 * 1000);
        setInterval(() => {
            try {
                const sessionStats = this.sessionManager.getSessionStats();
                const userStats = this.userManager.getUserStats();
                const stateStats = this.stateRecovery.getStateStats();
                console.log(`📊 系统状态: 用户(${userStats.online}/${userStats.total}), 会话(${sessionStats.online}/${sessionStats.total}), 状态(${stateStats.inRooms}/${stateStats.total})`);
            }
            catch (error) {
                console.error('状态统计失败:', error);
            }
        }, 60 * 60 * 1000);
    }
    start() {
        this.setupSocketIO();
        this.server.listen(config_1.config.server.port, () => {
            console.log(`🚀 斗地主游戏服务器启动成功`);
            console.log(`📍 服务器地址: http://localhost:${config_1.config.server.port}`);
            console.log(`🔧 环境: ${config_1.config.legacy.nodeEnv}`);
            console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`);
            console.log(`📚 API文档: http://localhost:${config_1.config.server.port}/api`);
        });
    }
    getApp() {
        return this.app;
    }
    getServer() {
        return this.server;
    }
    getIO() {
        return this.io;
    }
}
exports.Application = Application;
exports.default = Application;
//# sourceMappingURL=app.js.map