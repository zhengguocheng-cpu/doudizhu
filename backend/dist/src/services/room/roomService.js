"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomService = exports.RoomService = void 0;
const roomManager_1 = require("./roomManager");
const roomValidator_1 = require("./roomValidator");
const defaultRooms_1 = require("./defaultRooms");
const userManager_1 = require("../user/userManager");
class RoomService {
    constructor() {
        this.roomManager = new roomManager_1.RoomManager();
    }
    createRoom(name, maxPlayers) {
        return this.roomManager.createRoom(name, maxPlayers);
    }
    getRoom(roomId) {
        return this.roomManager.getRoom(roomId);
    }
    getAllRooms() {
        return this.roomManager.getAllRooms();
    }
    joinRoom(roomId, playerName) {
        return this.roomManager.joinRoom(roomId, playerName);
    }
    addExistingUserToRoom(roomId, user) {
        return this.roomManager.addExistingUserToRoom(roomId, user);
    }
    leaveRoom(roomId, playerId) {
        return this.roomManager.leaveRoom(roomId, playerId);
    }
    togglePlayerReady(roomId, playerId) {
        return this.roomManager.togglePlayerReady(roomId, playerId);
    }
    startGame(roomId) {
        return this.roomManager.startGame(roomId);
    }
    endGame(roomId, winner) {
        return this.roomManager.endGame(roomId, winner);
    }
    resetRoom(roomId) {
        return this.roomManager.resetRoom(roomId);
    }
    deleteRoom(roomId) {
        return this.roomManager.deleteRoom(roomId);
    }
    validateRoomOperation(roomId, operation) {
        const room = this.getRoom(roomId);
        if (!room) {
            return { valid: false, error: '房间不存在' };
        }
        switch (operation) {
            case 'join':
                return roomValidator_1.RoomValidator.validateRoomJoinable(room);
            case 'ready':
                return { valid: true };
            case 'start':
                return roomValidator_1.RoomValidator.validateGameStartConditions(room);
            case 'leave':
                return { valid: true };
            default:
                return { valid: false, error: '未知操作' };
        }
    }
    getRoomStats() {
        return this.roomManager.getRoomStats();
    }
    isDefaultRoom(roomId) {
        return defaultRooms_1.DefaultRoomConfig.isDefaultRoom(roomId);
    }
    findUserByName(userName) {
        const userManager = (0, userManager_1.getUserManager)();
        return userManager.findUserByName(userName);
    }
}
exports.RoomService = RoomService;
exports.roomService = new RoomService();
//# sourceMappingURL=roomService.js.map