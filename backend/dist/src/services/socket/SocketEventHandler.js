"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketEventHandler = exports.SocketEventHandler = void 0;
const EventBus_1 = require("../../core/EventBus");
const gameRoomsService_1 = require("../game/gameRoomsService");
const roomService_1 = require("../room/roomService");
const GameFlowHandler_1 = require("./GameFlowHandler");
class SocketEventHandler {
    constructor() {
        this.eventBus = EventBus_1.EventBus.getInstance();
        this.gameRoomsService = gameRoomsService_1.gameRoomsService;
    }
    static getInstance() {
        if (!SocketEventHandler.instance) {
            SocketEventHandler.instance = new SocketEventHandler();
        }
        return SocketEventHandler.instance;
    }
    initialize(io) {
        this.io = io;
        GameFlowHandler_1.gameFlowHandler.initialize(io);
        console.log('SocketEventHandler initialized with IO instance');
    }
    async handleGetRoomsList(socket, data) {
        try {
            const rooms = roomService_1.roomService.getAllRooms();
            socket.emit('rooms_list', {
                success: true,
                rooms: rooms,
                timestamp: new Date()
            });
            console.log(`发送房间列表给客户端 ${socket.id}，房间数量: ${rooms.length}`);
        }
        catch (error) {
            socket.emit('rooms_list', {
                success: false,
                error: error instanceof Error ? error.message : '获取房间列表失败'
            });
        }
    }
    async handleGetRoomState(socket, data) {
        try {
            const { roomId, userId } = data;
            console.log('🔍 收到获取房间状态请求:', { roomId, userId });
            const room = roomService_1.roomService.getRoom(roomId);
            if (!room) {
                socket.emit('room_state_error', { message: '房间不存在' });
                return;
            }
            const playerInRoom = room.players?.some((p) => p.id === userId);
            if (!playerInRoom) {
                socket.emit('room_state_error', { message: '您不在此房间中' });
                return;
            }
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
        }
        catch (error) {
            console.error('获取房间状态错误:', error);
            socket.emit('room_state_error', {
                message: error instanceof Error ? error.message : '获取房间状态失败'
            });
        }
    }
    async handleJoinGame(socket, data) {
        const { roomId, userId } = data;
        try {
            console.log('🔄 收到join_game请求:', {
                socketId: socket.id,
                requestData: data,
                handshakeAuth: socket.handshake.auth
            });
            console.log('✅ 跳过认证检查，开始处理房间逻辑');
            console.log('玩家加入游戏:', roomId, userId);
            const user = { name: userId };
            const result = roomService_1.roomService.joinRoom(roomId, userId);
            const room = roomService_1.roomService.getRoom(roomId);
            if (!room) {
                socket.emit('join_game_failed', { message: '房间不存在' });
                return;
            }
            await socket.join(`room_${roomId}`);
            console.log(`✅ Socket ${socket.id} 已加入房间 room_${roomId}`);
            console.log('✅ 房间加入成功，发送join_game_success事件:', {
                roomId: roomId,
                roomName: room.name,
            });
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
            console.log(`📢 向房间 room_${roomId} 的其他玩家广播 player_joined 事件`);
            console.log(`📢 当前房间内的所有socket:`, Array.from(this.io.sockets.adapter.rooms.get(`room_${roomId}`) || []));
            console.log(`📢 当前socket ID: ${socket.id}`);
            socket.to(`room_${roomId}`).emit('player_joined', {
                playerId: userId,
                playerName: user.name,
                players: room.players || []
            });
            console.log(`✅ player_joined 事件已发送`);
            this.broadcastRoomsUpdate('player_joined', roomId, {
                playerName: user.name
            });
            console.log('加入游戏成功:', roomId, userId);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : '加入游戏过程中发生错误';
            console.log(`⚠️ 玩家 ${userId} 加入房间 ${roomId} 失败: ${errorMessage}`);
            socket.emit('join_game_failed', {
                message: errorMessage
            });
        }
    }
    async handleLeaveGame(socket, data) {
        try {
            const { roomId, userId } = data;
            console.log('玩家离开游戏:', roomId, userId);
            const result = roomService_1.roomService.leaveRoom(roomId, userId);
            if (result) {
                socket.leave(`room_${roomId}`);
                const room = roomService_1.roomService.getRoom(roomId);
                socket.to(`room_${roomId}`).emit('player_left', {
                    playerId: userId,
                    playerName: userId,
                    players: room?.players || []
                });
                this.broadcastRoomsUpdate('player_left', roomId, {
                    playerId: userId
                });
                console.log('离开游戏成功:', roomId, userId);
            }
            else {
                socket.emit('error', { message: '离开游戏失败' });
            }
        }
        catch (error) {
            console.error('离开游戏错误:', error);
            socket.emit('error', {
                message: error instanceof Error ? error.message : '离开游戏过程中发生错误'
            });
        }
    }
    async handlePlayerReady(socket, data) {
        try {
            const { roomId, userId } = data;
            console.log('玩家准备:', roomId, userId);
            const result = roomService_1.roomService.togglePlayerReady(roomId, userId);
            if (result) {
                const room = roomService_1.roomService.getRoom(roomId);
                this.io.to(`room_${roomId}`).emit('player_ready', {
                    playerId: userId,
                    playerName: userId,
                    players: room?.players || []
                });
                this.broadcastRoomsUpdate('player_ready', roomId, {
                    playerId: userId
                });
                console.log('准备成功:', roomId, userId);
                if (room && room.players) {
                    const allReady = room.players.every((p) => p.ready);
                    const hasEnoughPlayers = room.players.length === 3;
                    console.log(`房间${roomId}状态: 玩家数=${room.players.length}, 全部准备=${allReady}`);
                    if (allReady && hasEnoughPlayers) {
                        console.log(`🎮 房间${roomId}所有玩家准备完毕，开始游戏！`);
                        setTimeout(() => {
                            GameFlowHandler_1.gameFlowHandler.startGame(roomId);
                        }, 1000);
                    }
                }
            }
            else {
                socket.emit('error', { message: '准备失败' });
            }
        }
        catch (error) {
            console.error('准备错误:', error);
            socket.emit('error', {
                message: error instanceof Error ? error.message : '准备过程中发生错误'
            });
        }
    }
    async handleBidLandlord(socket, data) {
        try {
            const { roomId, userId, bid } = data;
            console.log('🎲 收到抢地主请求:', { roomId, userId, bid });
            GameFlowHandler_1.gameFlowHandler.handleBidLandlord(roomId, userId, bid);
        }
        catch (error) {
            console.error('抢地主错误:', error);
            socket.emit('error', {
                message: error instanceof Error ? error.message : '抢地主过程中发生错误'
            });
        }
    }
    async handlePlayCards(socket, data) {
        try {
            const { roomId, userId, cards } = data;
            console.log('🎴 收到出牌请求:', { roomId, userId, cards });
            const cardPlayHandler = GameFlowHandler_1.gameFlowHandler.getCardPlayHandler();
            if (!cardPlayHandler) {
                console.error('❌ CardPlayHandler未初始化');
                socket.emit('error', { message: '游戏系统错误' });
                return;
            }
            cardPlayHandler.handlePlayCards(roomId, userId, cards);
        }
        catch (error) {
            console.error('出牌错误:', error);
            socket.emit('error', {
                message: error instanceof Error ? error.message : '出牌过程中发生错误'
            });
        }
    }
    async handlePassTurn(socket, data) {
        try {
            const { roomId, userId } = data;
            console.log('🚫 收到不出请求:', { roomId, userId });
            const cardPlayHandler = GameFlowHandler_1.gameFlowHandler.getCardPlayHandler();
            if (!cardPlayHandler) {
                console.error('❌ CardPlayHandler未初始化');
                socket.emit('error', { message: '游戏系统错误' });
                return;
            }
            cardPlayHandler.handlePass(roomId, userId);
        }
        catch (error) {
            console.error('不出错误:', error);
            socket.emit('error', {
                message: error instanceof Error ? error.message : '不出过程中发生错误'
            });
        }
    }
    async handleSendMessage(socket, data) {
        try {
            const { roomId, message } = data;
            if (!socket.userName) {
                socket.userName = data.userName || '玩家';
                socket.userId = data.userId || socket.userName;
            }
            this.io?.to(`room_${roomId}`).emit('message_received', {
                playerName: socket.userName,
                message: message,
                timestamp: new Date()
            });
            console.log('聊天消息发送:', roomId, socket.userName, message);
        }
        catch (error) {
            console.error('发送消息错误:', error);
            socket.emit('error', {
                message: error instanceof Error ? error.message : '发送消息过程中发生错误'
            });
        }
    }
    validateAuthentication(socket, userId) {
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
}
exports.SocketEventHandler = SocketEventHandler;
exports.socketEventHandler = SocketEventHandler.getInstance();
//# sourceMappingURL=SocketEventHandler.js.map