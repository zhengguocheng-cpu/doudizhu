"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameRoomsService = exports.GameRoomsService = void 0;
const config_1 = require("../../config");
class GameRoomsService {
    constructor() {
        this.gameRooms = new Map();
    }
    static getInstance() {
        if (!GameRoomsService.instance) {
            GameRoomsService.instance = new GameRoomsService();
        }
        return GameRoomsService.instance;
    }
    async createRoom(roomId, createdBy) {
        try {
            if (this.gameRooms.has(roomId)) {
                return { success: false, error: '房间已存在' };
            }
            const room = {
                id: roomId,
                name: roomId,
                players: [createdBy],
                maxPlayers: config_1.gameConfig.maxPlayers,
                status: 'waiting',
                readyPlayers: [],
                gameStarted: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            this.gameRooms.set(roomId, room);
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '创建房间失败'
            };
        }
    }
    async joinRoom(roomId, player) {
        try {
            const room = this.getGameRoom(roomId);
            if (!room) {
                return { success: false, error: '房间不存在' };
            }
            if (room.players.length >= room.maxPlayers) {
                return { success: false, error: '房间已满' };
            }
            if (room.gameStarted) {
                return { success: false, error: '游戏进行中，无法加入' };
            }
            const existingPlayer = room.players.find((p) => p.id === player.id);
            if (existingPlayer) {
                return { success: false, error: '您已在房间中' };
            }
            room.players.push(player);
            room.updatedAt = new Date();
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '加入房间失败'
            };
        }
    }
    async leaveRoom(roomId, playerId) {
        try {
            const room = this.getGameRoom(roomId);
            if (!room) {
                return { success: false, error: '房间不存在' };
            }
            const playerIndex = room.players.findIndex((p) => p.id === playerId);
            if (playerIndex === -1) {
                return { success: false, error: '您不在此房间中' };
            }
            if (room.gameStarted) {
                return { success: false, error: '游戏进行中，无法离开房间' };
            }
            room.players.splice(playerIndex, 1);
            room.updatedAt = new Date();
            if (room.players.length === 0) {
                this.deleteGameRoom(roomId);
            }
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '离开房间失败'
            };
        }
    }
    async playerReady(roomId, playerId) {
        try {
            const room = this.getGameRoom(roomId);
            if (!room) {
                return { success: false, error: '房间不存在' };
            }
            if (!room.readyPlayers.includes(playerId)) {
                room.readyPlayers.push(playerId);
            }
            if (room.readyPlayers.length === room.players.length && room.players.length >= config_1.gameConfig.minPlayers) {
                console.log(`游戏可以开始: 房间 ${roomId}, 玩家 ${room.players.map((p) => p.id)}`);
            }
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '设置准备状态失败'
            };
        }
    }
    setGameRoom(roomId, roomData) {
        this.gameRooms.set(roomId, roomData);
    }
    getGameRoom(roomId) {
        return this.gameRooms.get(roomId);
    }
    deleteGameRoom(roomId) {
        this.gameRooms.delete(roomId);
    }
    getGameRoomsForAPI() {
        return Array.from(this.gameRooms.values()).map(room => ({
            id: room.id,
            name: room.id,
            players: room.players || [],
            maxPlayers: room.maxPlayers || 3,
            status: room.gameStarted ? 'playing' : 'waiting',
            currentPlayerIndex: 0,
            landlord: room.landlord || null,
            cards: {
                remaining: [],
                played: []
            },
            createdAt: room.createdAt || new Date(),
            updatedAt: new Date()
        }));
    }
    getRoomCount() {
        return this.gameRooms.size;
    }
    getRoomStats() {
        const rooms = Array.from(this.gameRooms.values());
        return {
            total: rooms.length,
            active: rooms.filter((r) => !r.gameStarted).length,
            playing: rooms.filter((r) => r.gameStarted).length,
            averagePlayers: rooms.length > 0
                ? rooms.reduce((sum, room) => sum + (room.players?.length || 0), 0) / rooms.length
                : 0
        };
    }
}
exports.GameRoomsService = GameRoomsService;
exports.gameRoomsService = GameRoomsService.getInstance();
//# sourceMappingURL=gameRoomsService.js.map