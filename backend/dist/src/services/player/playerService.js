"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerService = void 0;
exports.getPlayerService = getPlayerService;
const playerValidator_1 = require("./playerValidator");
const BaseService_1 = require("../../core/BaseService");
const types_1 = require("../../types");
class PlayerService extends BaseService_1.BaseService {
    constructor() {
        super();
    }
    async onInitialize() {
        this.playerManager = this.getService('PlayerManager');
        this.log(types_1.LogLevel.INFO, 'PlayerService initialized');
    }
    async onDestroy() {
        this.log(types_1.LogLevel.INFO, 'PlayerService destroyed');
    }
    createPlayer(name) {
        return this.playerManager.createPlayer(name);
    }
    addPlayerToRoom(room, playerName) {
        return this.playerManager.addPlayerToRoom(room, playerName);
    }
    removePlayerFromRoom(room, playerId) {
        return this.playerManager.removePlayerFromRoom(room, playerId);
    }
    togglePlayerReady(room, playerId) {
        return this.playerManager.togglePlayerReady(room, playerId);
    }
    setPlayerCards(player, cards) {
        this.playerManager.setPlayerCards(player, cards);
    }
    updatePlayerCards(player, remainingCards) {
        this.playerManager.updatePlayerCards(player, remainingCards);
    }
    setLandlord(room, playerId) {
        return this.playerManager.setLandlord(room, playerId);
    }
    getRoomPlayers(room) {
        return this.playerManager.getRoomPlayers(room);
    }
    getPlayer(room, playerId) {
        return this.playerManager.getPlayer(room, playerId);
    }
    validatePlayerOperation(room, playerId, operation) {
        switch (operation) {
            case 'ready':
                return playerValidator_1.PlayerValidator.validatePlayerCanReady(room, playerId);
            case 'leave':
                return playerValidator_1.PlayerValidator.validatePlayerCanLeave(room, playerId);
            case 'play':
                return playerValidator_1.PlayerValidator.validatePlayerCanPlay(room, playerId);
            case 'grab_landlord':
                return playerValidator_1.PlayerValidator.validatePlayerCanGrabLandlord(room, playerId);
            case 'pass':
                return playerValidator_1.PlayerValidator.validatePlayerCanPass(room, playerId);
            default:
                return { valid: false, error: '未知操作' };
        }
    }
    isPlayerReady(room, playerId) {
        return this.playerManager.isPlayerReady(room, playerId);
    }
    areAllPlayersReady(room) {
        return this.playerManager.areAllPlayersReady(room);
    }
    isPlayerLandlord(room, playerId) {
        return this.playerManager.isPlayerLandlord(room, playerId);
    }
    isPlayerCurrentTurn(room, playerId) {
        return this.playerManager.isPlayerCurrentTurn(room, playerId);
    }
    getPlayerStatusDescription(room, playerId) {
        return this.playerManager.getPlayerStatusDescription(room, playerId);
    }
    validatePlayerCards(playerCards, playedCards) {
        return playerValidator_1.PlayerValidator.validatePlayerCards(playerCards, playedCards);
    }
    cleanupOfflineSessions() {
        return this.playerManager.cleanupOfflineSessions();
    }
    getPlayerStats() {
        return this.playerManager.getPlayerStats();
    }
}
exports.PlayerService = PlayerService;
let playerServiceInstance = null;
function getPlayerService() {
    if (!playerServiceInstance) {
        playerServiceInstance = new PlayerService();
        playerServiceInstance.initialize().catch(error => {
            console.error('PlayerService初始化失败:', error);
        });
    }
    return playerServiceInstance;
}
//# sourceMappingURL=playerService.js.map