"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerManager = void 0;
const uuid_1 = require("uuid");
const playerValidator_1 = require("./playerValidator");
const BaseService_1 = require("../../core/BaseService");
const types_1 = require("../../types");
class PlayerManager extends BaseService_1.BaseService {
    constructor() {
        super();
    }
    async onInitialize() {
        this.playerSession = this.getService('SessionManager');
        this.log(types_1.LogLevel.INFO, 'PlayerManager initialized');
    }
    async onDestroy() {
        this.log(types_1.LogLevel.INFO, 'PlayerManager destroyed');
    }
    createPlayer(name) {
        const nameValidation = playerValidator_1.PlayerValidator.validatePlayerName(name);
        if (!nameValidation.valid) {
            throw new Error(nameValidation.error);
        }
        const player = {
            id: (0, uuid_1.v4)(),
            name: name.trim(),
            ready: false,
            cards: [],
            cardCount: 0
        };
        return player;
    }
    addPlayerToRoom(room, playerName) {
        if (room.status !== 'waiting') {
            throw new Error('游戏已开始，不能加入');
        }
        if (room.players.length >= room.maxPlayers) {
            throw new Error('房间已满');
        }
        const existingPlayer = room.players.find(p => p.name === playerName.trim());
        if (existingPlayer) {
            throw new Error('房间中已有同名玩家');
        }
        const player = this.createPlayer(playerName);
        room.players.push(player);
        room.updatedAt = new Date();
        return player;
    }
    removePlayerFromRoom(room, playerId) {
        const leaveValidation = playerValidator_1.PlayerValidator.validatePlayerCanLeave(room, playerId);
        if (!leaveValidation.valid) {
            throw new Error(leaveValidation.error);
        }
        const playerIndex = room.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) {
            return false;
        }
        const player = room.players[playerIndex];
        this.resetPlayerState(player);
        if (room.landlord?.id === playerId) {
            room.landlord = null;
        }
        room.players.splice(playerIndex, 1);
        room.updatedAt = new Date();
        if (room.players.length === 0) {
            this.resetRoomForNewGame(room);
        }
        return true;
    }
    togglePlayerReady(room, playerId) {
        const readyValidation = playerValidator_1.PlayerValidator.validatePlayerCanReady(room, playerId);
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
    setPlayerCards(player, cards) {
        player.cards = [...cards];
        player.cardCount = cards.length;
        player.ready = false;
    }
    updatePlayerCards(player, remainingCards) {
        player.cards = [...remainingCards];
        player.cardCount = remainingCards.length;
    }
    resetPlayerState(player) {
        player.ready = false;
        player.cards = [];
        player.cardCount = 0;
    }
    resetRoomForNewGame(room) {
        room.status = 'waiting';
        room.currentPlayerIndex = 0;
        room.landlord = null;
        room.cards = {
            remaining: [],
            played: []
        };
        room.players.forEach(player => this.resetPlayerState(player));
    }
    getRoomPlayers(room) {
        return [...room.players];
    }
    getPlayer(room, playerId) {
        return room.players.find(p => p.id === playerId);
    }
    getPlayerPosition(room, playerId) {
        return playerValidator_1.PlayerValidator.getPlayerPosition(room, playerId);
    }
    isPlayerReady(room, playerId) {
        const player = this.getPlayer(room, playerId);
        return player ? playerValidator_1.PlayerValidator.isPlayerReady(player) : false;
    }
    areAllPlayersReady(room) {
        return room.players.length >= 3 && room.players.every(player => player.ready);
    }
    isPlayerLandlord(room, playerId) {
        return playerValidator_1.PlayerValidator.isPlayerLandlord(room, playerId);
    }
    isPlayerCurrentTurn(room, playerId) {
        return playerValidator_1.PlayerValidator.isPlayerCurrentTurn(room, playerId);
    }
    setLandlord(room, playerId) {
        const player = this.getPlayer(room, playerId);
        if (!player) {
            return false;
        }
        room.landlord = player;
        room.updatedAt = new Date();
        return true;
    }
    validatePlayPermission(room, playerId) {
        return playerValidator_1.PlayerValidator.validatePlayerCanPlay(room, playerId);
    }
    validateGrabLandlordPermission(room, playerId) {
        return playerValidator_1.PlayerValidator.validatePlayerCanGrabLandlord(room, playerId);
    }
    validatePassPermission(room, playerId) {
        return playerValidator_1.PlayerValidator.validatePlayerCanPass(room, playerId);
    }
    getPlayerStatusDescription(room, playerId) {
        const player = this.getPlayer(room, playerId);
        if (!player) {
            return '玩家不存在';
        }
        const isCurrentTurn = this.isPlayerCurrentTurn(room, playerId);
        return playerValidator_1.PlayerValidator.getPlayerStatusDescription(player, isCurrentTurn);
    }
    cleanupOfflineSessions() {
        return this.playerSession.cleanupOfflineSessions();
    }
    getPlayerStats() {
        return {
            sessions: this.playerSession.getSessionStats()
        };
    }
}
exports.PlayerManager = PlayerManager;
//# sourceMappingURL=playerManager.js.map