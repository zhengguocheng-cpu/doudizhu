"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultRoomConfig = void 0;
class DefaultRoomConfig {
    static getDefaultRoomCount() {
        return this.DEFAULT_ROOM_COUNT;
    }
    static getDefaultMaxPlayers() {
        return this.DEFAULT_MAX_PLAYERS;
    }
    static generateRoomId(index) {
        return `${this.ROOM_ID_PREFIX}${String(index).padStart(2, '0')}`;
    }
    static generateRoomName(roomId) {
        return `房间 ${roomId}`;
    }
    static createDefaultRoomTemplate(roomId) {
        return {
            id: roomId,
            name: this.generateRoomName(roomId),
            maxPlayers: this.DEFAULT_MAX_PLAYERS,
            status: 'waiting',
            currentPlayerIndex: 0,
            landlord: null,
            cards: {
                remaining: [],
                played: []
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    static getDefaultRoomConfigs() {
        const configs = [];
        for (let i = 1; i <= this.DEFAULT_ROOM_COUNT; i++) {
            const roomId = this.generateRoomId(i);
            configs.push({
                id: roomId,
                config: this.createDefaultRoomTemplate(roomId)
            });
        }
        return configs;
    }
    static isDefaultRoom(roomId) {
        return roomId.startsWith(this.ROOM_ID_PREFIX) &&
            roomId.length === 3 &&
            /^\d{2}$/.test(roomId.slice(1));
    }
    static parseRoomNumber(roomId) {
        if (!this.isDefaultRoom(roomId))
            return null;
        return parseInt(roomId.slice(1), 10);
    }
    static getRoomConfig(roomId, overrides = {}) {
        const template = this.createDefaultRoomTemplate(roomId);
        return {
            players: [],
            ...template,
            ...overrides
        };
    }
}
exports.DefaultRoomConfig = DefaultRoomConfig;
DefaultRoomConfig.DEFAULT_ROOM_COUNT = 6;
DefaultRoomConfig.DEFAULT_MAX_PLAYERS = 3;
DefaultRoomConfig.ROOM_ID_PREFIX = 'A';
//# sourceMappingURL=defaultRooms.js.map