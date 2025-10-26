"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
const uuid_1 = require("uuid");
const defaultRooms_1 = require("./defaultRooms");
const roomValidator_1 = require("./roomValidator");
class RoomManager {
    constructor() {
        this.rooms = new Map();
        this.initializeDefaultRooms();
    }
    createRoom(name, maxPlayers = 3) {
        const validation = roomValidator_1.RoomValidator.validateRoomParams(name, maxPlayers);
        if (!validation.valid) {
            throw new Error(validation.error);
        }
        const roomId = (0, uuid_1.v4)();
        const roomConfig = defaultRooms_1.DefaultRoomConfig.getRoomConfig(roomId, {
            name,
            maxPlayers,
            players: []
        });
        const room = {
            ...roomConfig,
            players: []
        };
        this.rooms.set(roomId, room);
        return room;
    }
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    getAllRooms() {
        return Array.from(this.rooms.values());
    }
    joinRoom(roomId, playerName) {
        const room = this.rooms.get(roomId);
        if (!room) {
            throw new Error('房间不存在');
        }
        const existingPlayer = room.players.find(p => p.id === playerName || p.name === playerName);
        if (existingPlayer) {
            console.log(`玩家 ${playerName} 已在房间 ${roomId} 中，返回现有玩家信息`);
            return existingPlayer;
        }
        const joinValidation = roomValidator_1.RoomValidator.validateRoomJoinable(room);
        if (!joinValidation.valid) {
            throw new Error(joinValidation.error);
        }
        const player = {
            id: playerName,
            name: playerName,
            ready: false,
            cards: [],
            cardCount: 0
        };
        room.players.push(player);
        room.updatedAt = new Date();
        console.log(`玩家 ${playerName} 加入房间 ${roomId}，当前人数: ${room.players.length}/${room.maxPlayers}`);
        return player;
    }
    addExistingUserToRoom(roomId, user) {
        const room = this.rooms.get(roomId);
        if (!room) {
            throw new Error('房间不存在');
        }
        const joinValidation = roomValidator_1.RoomValidator.validateRoomJoinable(room);
        if (!joinValidation.valid) {
            throw new Error(joinValidation.error);
        }
        const existingPlayer = room.players.find(p => p.id === user.id);
        if (existingPlayer) {
            return existingPlayer;
        }
        room.players.push(user);
        room.updatedAt = new Date();
        return user;
    }
    leaveRoom(roomId, playerId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return false;
        }
        const leaveValidation = roomValidator_1.RoomValidator.validatePlayerLeave(room, playerId);
        if (!leaveValidation.valid) {
            throw new Error(leaveValidation.error);
        }
        const playerIndex = room.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) {
            return false;
        }
        const player = room.players[playerIndex];
        player.ready = false;
        player.cards = [];
        player.cardCount = 0;
        if (room.status === 'playing' && room.landlord?.id === playerId) {
            room.status = 'finished';
        }
        room.players.splice(playerIndex, 1);
        room.updatedAt = new Date();
        if (roomValidator_1.RoomValidator.isRoomEmpty(room) && !defaultRooms_1.DefaultRoomConfig.isDefaultRoom(roomId)) {
            this.rooms.delete(roomId);
        }
        return true;
    }
    togglePlayerReady(roomId, playerId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return false;
        }
        const readyValidation = roomValidator_1.RoomValidator.validatePlayerReady(room, playerId);
        if (!readyValidation.valid) {
            throw new Error(readyValidation.error);
        }
        const player = room.players.find(p => p.id === playerId);
        if (player) {
            player.ready = !player.ready;
            room.updatedAt = new Date();
            return true;
        }
        return false;
    }
    canStartGame(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return false;
        }
        const validation = roomValidator_1.RoomValidator.validateGameStartConditions(room);
        return validation.valid;
    }
    startGame(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return false;
        }
        const validation = roomValidator_1.RoomValidator.validateGameStartConditions(room);
        if (!validation.valid) {
            throw new Error(validation.error);
        }
        room.status = 'playing';
        room.currentPlayerIndex = 0;
        room.updatedAt = new Date();
        return true;
    }
    endGame(roomId, winner) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return false;
        }
        room.status = 'finished';
        if (winner) {
            console.log(`游戏结束，获胜者: ${winner.name}`);
        }
        room.updatedAt = new Date();
        return true;
    }
    resetRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return false;
        }
        room.players.forEach(player => {
            player.ready = false;
            player.cards = [];
            player.cardCount = 0;
        });
        room.status = 'waiting';
        room.currentPlayerIndex = 0;
        room.landlord = null;
        room.cards = {
            remaining: [],
            played: []
        };
        room.updatedAt = new Date();
        return true;
    }
    deleteRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return false;
        }
        if (room.players.length > 0) {
            throw new Error('不能删除有玩家的房间');
        }
        if (defaultRooms_1.DefaultRoomConfig.isDefaultRoom(roomId)) {
            throw new Error('不能删除默认房间');
        }
        return this.rooms.delete(roomId);
    }
    initializeDefaultRooms() {
        const defaultConfigs = defaultRooms_1.DefaultRoomConfig.getDefaultRoomConfigs();
        defaultConfigs.forEach(({ id, config }) => {
            const room = defaultRooms_1.DefaultRoomConfig.getRoomConfig(id, config);
            this.rooms.set(id, room);
        });
        console.log(`✅ 初始化 ${defaultConfigs.length} 个默认房间`);
    }
    getRoomStats() {
        const rooms = this.getAllRooms();
        const stats = {
            total: rooms.length,
            waiting: 0,
            playing: 0,
            finished: 0,
            empty: 0,
            full: 0
        };
        rooms.forEach(room => {
            if (room.status === 'waiting')
                stats.waiting++;
            else if (room.status === 'playing')
                stats.playing++;
            else if (room.status === 'finished')
                stats.finished++;
            if (roomValidator_1.RoomValidator.isRoomEmpty(room))
                stats.empty++;
            if (roomValidator_1.RoomValidator.isRoomFull(room))
                stats.full++;
        });
        return stats;
    }
}
exports.RoomManager = RoomManager;
//# sourceMappingURL=roomManager.js.map