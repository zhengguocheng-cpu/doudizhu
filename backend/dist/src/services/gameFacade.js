"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameFacade = exports.GameFacade = void 0;
const gameService_1 = require("./game/gameService");
const roomService_1 = require("./room/roomService");
const playerService_1 = require("./player/playerService");
class GameFacade {
    createGameRoom(name, maxPlayers = 3) {
        const room = roomService_1.roomService.createRoom(name, maxPlayers);
        console.log(`🏠 创建游戏房间: ${room.name} (${room.id})`);
        return room;
    }
    quickJoinGame(roomId, userName) {
        try {
            const player = roomService_1.roomService.joinRoom(roomId, userName);
            console.log(`👤 玩家 ${player.name} 加入房间 ${roomId}`);
            return { success: true, player };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    quickStartGame(roomId) {
        const room = roomService_1.roomService.getRoom(roomId);
        if (!room) {
            return { success: false, error: '房间不存在' };
        }
        if (!(0, playerService_1.getPlayerService)().areAllPlayersReady(room)) {
            return { success: false, error: '不是所有玩家都已准备' };
        }
        const result = (0, gameService_1.getGameService)().startGame(roomId);
        if (result.success) {
            console.log(`🎮 游戏开始: ${room.name}`);
        }
        return result;
    }
    executeGameAction(roomId, action, playerId, data = {}) {
        try {
            switch (action) {
                case 'join':
                    return this.quickJoinGame(roomId, data.playerName);
                case 'ready':
                    const readyResult = roomService_1.roomService.togglePlayerReady(roomId, playerId);
                    return { success: readyResult };
                case 'start':
                    return this.quickStartGame(roomId);
                case 'grab_landlord':
                    return (0, gameService_1.getGameService)().handleGrabLandlord(roomId, playerId, data.isGrab || false);
                case 'play_cards':
                    return (0, gameService_1.getGameService)().handlePlayCards(roomId, playerId, data.cards || []);
                case 'pass_turn':
                    return (0, gameService_1.getGameService)().handlePassTurn(roomId, playerId);
                case 'restart':
                    return (0, gameService_1.getGameService)().restartGame(roomId);
                default:
                    return { success: false, error: `未知操作: ${action}` };
            }
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    getGameSnapshot(roomId) {
        const room = roomService_1.roomService.getRoom(roomId);
        if (!room) {
            return { success: false, error: '房间不存在' };
        }
        const gameState = (0, gameService_1.getGameService)().getGameState(roomId);
        const roomStats = roomService_1.roomService.getRoomStats();
        if (!gameState.success) {
            return { success: false, error: gameState.error };
        }
        return {
            success: true,
            snapshot: {
                room: {
                    id: room.id,
                    name: room.name,
                    status: room.status,
                    maxPlayers: room.maxPlayers,
                    createdAt: room.createdAt,
                    updatedAt: room.updatedAt
                },
                game: gameState.data,
                system: {
                    roomStats,
                    timestamp: new Date().toISOString()
                }
            }
        };
    }
    getSystemStats() {
        return {
            rooms: roomService_1.roomService.getRoomStats(),
            players: (0, playerService_1.getPlayerService)().getPlayerStats(),
            games: {
                activeGames: roomService_1.roomService.getAllRooms().filter(r => r.status === 'playing').length,
                waitingGames: roomService_1.roomService.getAllRooms().filter(r => r.status === 'waiting').length,
                finishedGames: roomService_1.roomService.getAllRooms().filter(r => r.status === 'finished').length
            }
        };
    }
    cleanup() {
        const cleanedPlayers = (0, playerService_1.getPlayerService)().cleanupOfflineSessions();
        console.log(`🧹 清理离线玩家会话: ${cleanedPlayers} 个`);
        return {
            cleanedPlayers,
            cleanedRooms: 0
        };
    }
    healthCheck() {
        const services = {
            cardService: true,
            roomService: true,
            playerService: true,
            gameEngine: true
        };
        const details = {
            timestamp: new Date().toISOString(),
            systemStats: this.getSystemStats(),
            services: Object.keys(services)
        };
        return {
            healthy: Object.values(services).every(status => status),
            services,
            details
        };
    }
}
exports.GameFacade = GameFacade;
exports.gameFacade = new GameFacade();
//# sourceMappingURL=gameFacade.js.map