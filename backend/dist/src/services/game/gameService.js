"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
exports.getGameService = getGameService;
const gameEngine_1 = require("./gameEngine");
const gameState_1 = require("./gameState");
const gameRules_1 = require("./gameRules");
class GameService {
    constructor() {
        this.gameEngine = new gameEngine_1.GameEngine();
    }
    startGame(roomId) {
        return this.gameEngine.startGame(roomId);
    }
    handleGrabLandlord(roomId, playerId, isGrab) {
        return this.gameEngine.handleGrabLandlord(roomId, playerId, isGrab);
    }
    handlePlayCards(roomId, playerId, cards) {
        return this.gameEngine.handlePlayCards(roomId, playerId, cards);
    }
    handlePassTurn(roomId, playerId) {
        return this.gameEngine.handlePassTurn(roomId, playerId);
    }
    endGame(roomId, winner, reason) {
        return this.gameEngine.endGame(roomId, winner, reason);
    }
    restartGame(roomId) {
        return this.gameEngine.restartGame(roomId);
    }
    getGameState(roomId) {
        return this.gameEngine.getGameState(roomId);
    }
    handleGameEvent(roomId, event, playerId, data = {}) {
        return this.gameEngine.handleGameEvent(roomId, event, playerId, data);
    }
    validateGameOperation(room, operation, playerId, data) {
        switch (operation) {
            case 'start':
                return gameRules_1.GameRules.validateGameStartConditions(room);
            case 'grab_landlord':
                return playerId ? gameRules_1.GameRules.validateGrabLandlord(room, playerId, data?.isGrab || false) : { valid: false, error: '缺少玩家ID' };
            case 'play_cards':
                return playerId && data?.cards ? gameRules_1.GameRules.validatePlayCards(room, playerId, data.cards) : { valid: false, error: '缺少参数' };
            case 'pass_turn':
                return playerId ? gameRules_1.GameRules.validatePassTurn(room, playerId) : { valid: false, error: '缺少玩家ID' };
            default:
                return { valid: false, error: '未知操作' };
        }
    }
    isGameFinished(room) {
        return gameState_1.GameStateManager.isGameFinished(room);
    }
    getGameStats(room) {
        return gameState_1.GameStateManager.getGameStats(room);
    }
    getGameConfig() {
        return gameRules_1.GameRules.getGameConfig();
    }
}
exports.GameService = GameService;
let gameServiceInstance = null;
function getGameService() {
    if (!gameServiceInstance) {
        gameServiceInstance = new GameService();
    }
    return gameServiceInstance;
}
//# sourceMappingURL=gameService.js.map