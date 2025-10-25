"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomValidator = void 0;
class RoomValidator {
    static validateRoomExists(room) {
        return room !== undefined;
    }
    static validateRoomJoinable(room) {
        if (!this.validateRoomExists(room)) {
            return { valid: false, error: '房间不存在' };
        }
        if (room.status !== 'waiting') {
            return { valid: false, error: '游戏已开始，不能加入' };
        }
        if (room.players.length >= room.maxPlayers) {
            return { valid: false, error: '房间已满' };
        }
        const socketIds = room.players.map(p => p.id);
        const hasDuplicates = socketIds.length !== new Set(socketIds).size;
        if (hasDuplicates) {
            return { valid: false, error: '房间中存在重复玩家' };
        }
        return { valid: true };
    }
    static validatePlayerReady(room, playerId) {
        if (room.status !== 'waiting') {
            return { valid: false, error: '游戏已开始，不能改变准备状态' };
        }
        const player = room.players.find(p => p.id === playerId);
        if (!player) {
            return { valid: false, error: '玩家不在房间中' };
        }
        return { valid: true };
    }
    static validateGameStartConditions(room) {
        if (room.status !== 'waiting') {
            return { valid: false, error: '游戏状态不正确' };
        }
        if (room.players.length < 3) {
            return { valid: false, error: '玩家数量不足，需要至少3名玩家' };
        }
        if (room.players.length > room.maxPlayers) {
            return { valid: false, error: '玩家数量超过房间容量' };
        }
        const allReady = room.players.every(player => player.ready === true);
        if (!allReady) {
            return { valid: false, error: '不是所有玩家都已准备' };
        }
        const hasInvalidPlayers = room.players.some(player => !player.id || !player.name);
        if (hasInvalidPlayers) {
            return { valid: false, error: '存在无效的玩家信息' };
        }
        return { valid: true };
    }
    static validatePlayerLeave(room, playerId) {
        const playerIndex = room.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) {
            return { valid: false, error: '玩家不在房间中' };
        }
        if (room.status === 'playing' && room.landlord?.id === playerId) {
            return { valid: false, error: '地主不能离开游戏' };
        }
        return { valid: true };
    }
    static validateRoomParams(name, maxPlayers) {
        if (!name || name.trim().length === 0) {
            return { valid: false, error: '房间名称不能为空' };
        }
        if (name.length > 50) {
            return { valid: false, error: '房间名称不能超过50个字符' };
        }
        if (maxPlayers < 3 || maxPlayers > 6) {
            return { valid: false, error: '房间最大玩家数必须在3-6之间' };
        }
        const isDefaultRoom = name.includes('房间 A');
        if (isDefaultRoom) {
            return { valid: false, error: '不能使用默认房间名称' };
        }
        return { valid: true };
    }
    static isRoomEmpty(room) {
        return room.players.length === 0;
    }
    static isRoomFull(room) {
        return room.players.length >= room.maxPlayers;
    }
    static getRoomStatusDescription(room) {
        const playerCount = room.players.length;
        const maxPlayers = room.maxPlayers;
        if (room.status === 'waiting') {
            return `等待中 (${playerCount}/${maxPlayers})`;
        }
        else if (room.status === 'playing') {
            return `游戏中 (${playerCount}人)`;
        }
        else if (room.status === 'finished') {
            return `已结束 (${playerCount}人)`;
        }
        return `未知状态 (${playerCount}/${maxPlayers})`;
    }
}
exports.RoomValidator = RoomValidator;
//# sourceMappingURL=roomValidator.js.map