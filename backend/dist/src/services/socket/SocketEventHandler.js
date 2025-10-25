"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketEventHandler = exports.SocketEventHandler = void 0;
const EventBus_1 = require("../../core/EventBus");
const gameRoomsService_1 = require("../game/gameRoomsService");
const roomService_1 = require("../room/roomService");
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
    async handleJoinGame(socket, data) {
        try {
            console.log('🔄 收到join_game请求:', {
                socketId: socket.id,
                requestData: data,
                handshakeAuth: socket.handshake.auth
            });
            console.log('✅ 跳过认证检查，开始处理房间逻辑');
            const { roomId, userId } = data;
            console.log('玩家加入游戏:', roomId, userId);
            const user = { name: userId };
            const result = roomService_1.roomService.joinRoom(roomId, user.name);
            if (result) {
                socket.join(`room_${roomId}`);
                const room = roomService_1.roomService.getRoom(roomId);
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
                socket.to(`room_${roomId}`).emit('player_joined', {
                    playerId: userId,
                    playerName: user.name
                });
                this.broadcastRoomsUpdate('player_joined', roomId, {
                    playerName: user.name
                });
                console.log('加入游戏成功:', roomId, userId);
            }
            else {
                socket.emit('error', { message: '加入游戏失败' });
            }
        }
        catch (error) {
            console.error('加入游戏错误:', error);
            socket.emit('error', {
                message: error instanceof Error ? error.message : '加入游戏过程中发生错误'
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
                socket.to(`room_${roomId}`).emit('player_left', { playerId: userId });
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
                socket.to(`room_${roomId}`).emit('player_ready', { playerId: userId });
                this.broadcastRoomsUpdate('player_ready', roomId, {
                    playerId: userId
                });
                console.log('准备成功:', roomId, userId);
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
    async handlePlayCards(socket, data) {
        try {
            const { roomId, userId, cards } = data;
            console.log('玩家出牌:', roomId, userId, cards?.length);
            const room = roomService_1.roomService.getRoom(roomId);
            if (!room) {
                socket.emit('error', { message: '房间不存在' });
                return;
            }
            const player = room.players?.find((p) => p.id === userId);
            if (!player) {
                socket.emit('error', { message: '玩家不在房间中' });
                return;
            }
            if (!cards || !Array.isArray(cards) || cards.length === 0) {
                socket.emit('play_result', {
                    success: false,
                    error: '无效的出牌'
                });
                return;
            }
            const hasAllCards = cards.every((card) => player.cards && player.cards.includes(card));
            if (!hasAllCards) {
                socket.emit('play_result', {
                    success: false,
                    error: '您没有这些牌'
                });
                return;
            }
            socket.emit('play_result', { success: true });
            socket.to(`room_${roomId}`).emit('cards_played', {
                playerId: userId,
                playerName: player.name,
                cards: cards,
                nextPlayerId: this.getNextPlayer(room, userId)
            });
            console.log('出牌成功:', roomId, userId);
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
            console.log('玩家跳过回合:', roomId, userId);
            const room = roomService_1.roomService.getRoom(roomId);
            if (!room) {
                socket.emit('error', { message: '房间不存在' });
                return;
            }
            const nextPlayerId = this.getNextPlayer(room, userId);
            socket.to(`room_${roomId}`).emit('turn_changed', {
                nextPlayerId: nextPlayerId,
                lastPlayedCards: null
            });
            console.log('跳过回合成功:', roomId, userId, nextPlayerId);
        }
        catch (error) {
            console.error('跳过回合错误:', error);
            socket.emit('error', {
                message: error instanceof Error ? error.message : '跳过回合过程中发生错误'
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