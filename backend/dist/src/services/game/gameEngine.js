"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameEngine = void 0;
const gameState_1 = require("./gameState");
const gameRules_1 = require("./gameRules");
const roomService_1 = require("../room/roomService");
const playerService_1 = require("../player/playerService");
const cardService_1 = require("../card/cardService");
class GameEngine {
    constructor() {
        this.playerService = (0, playerService_1.getPlayerService)();
    }
    startGame(roomId) {
        const room = roomService_1.roomService.getRoom(roomId);
        if (!room) {
            return { success: false, error: '房间不存在' };
        }
        const validation = gameRules_1.GameRules.validateGameStartConditions(room);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }
        try {
            const dealResult = cardService_1.cardService.dealCards(room.players.length);
            room.players.forEach((player, index) => {
                this.playerService.setPlayerCards(player, dealResult.playerCards[index].map(card => `${card.suit}${card.rank}`));
            });
            room.cards.remaining = dealResult.bottomCards.map(card => `${card.suit}${card.rank}`);
            room.status = 'playing';
            room.currentPlayerIndex = 0;
            room.updatedAt = new Date();
            console.log(`🎮 游戏开始，房间 ${roomId} 发牌完成`);
            return { success: true };
        }
        catch (error) {
            console.error('开始游戏失败:', error);
            return { success: false, error: '发牌失败' };
        }
    }
    handleGrabLandlord(roomId, playerId, isGrab) {
        const room = roomService_1.roomService.getRoom(roomId);
        if (!room) {
            return { success: false, error: '房间不存在' };
        }
        const validation = gameRules_1.GameRules.validateGrabLandlord(room, playerId, isGrab);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }
        if (isGrab) {
            const success = this.playerService.setLandlord(room, playerId);
            if (!success) {
                return { success: false, error: '设置地主失败' };
            }
            const landlord = this.playerService.getPlayer(room, playerId);
            if (landlord && room.cards.remaining) {
                const currentCards = landlord.cards || [];
                this.playerService.setPlayerCards(landlord, [...currentCards, ...room.cards.remaining]);
            }
            gameState_1.GameStateManager.setCurrentPlayer(room, playerId);
            console.log(`🏆 玩家 ${playerId} 抢地主成功，成为地主`);
            return { success: true };
        }
        else {
            gameState_1.GameStateManager.switchToNextPlayer(room);
            return { success: true };
        }
    }
    handlePlayCards(roomId, playerId, cards) {
        const room = roomService_1.roomService.getRoom(roomId);
        if (!room) {
            return { success: false, error: '房间不存在' };
        }
        const validation = gameRules_1.GameRules.validatePlayCards(room, playerId, cards);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }
        try {
            const player = this.playerService.getPlayer(room, playerId);
            if (!player) {
                return { success: false, error: '玩家不存在' };
            }
            const remainingCards = (player.cards || []).filter((card) => !cards.includes(card));
            this.playerService.updatePlayerCards(player, remainingCards);
            room.cards.played.push([...cards]);
            const gameFinishedCheck = gameState_1.GameStateManager.isGameFinished(room);
            if (gameFinishedCheck.finished) {
                this.endGame(roomId, gameFinishedCheck.winner, gameFinishedCheck.reason);
                return {
                    success: true,
                    nextPlayer: gameFinishedCheck.winner
                };
            }
            gameState_1.GameStateManager.switchToNextPlayer(room);
            const nextPlayer = gameState_1.GameStateManager.getCurrentPlayer(room);
            console.log(`🎯 玩家 ${player.name} 出牌成功，下一位玩家: ${nextPlayer?.name || '未知'}`);
            return {
                success: true,
                nextPlayer
            };
        }
        catch (error) {
            console.error('出牌处理失败:', error);
            return { success: false, error: '出牌处理失败' };
        }
    }
    handlePassTurn(roomId, playerId) {
        const room = roomService_1.roomService.getRoom(roomId);
        if (!room) {
            return { success: false, error: '房间不存在' };
        }
        const validation = gameRules_1.GameRules.validatePassTurn(room, playerId);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }
        try {
            gameState_1.GameStateManager.switchToNextPlayer(room);
            const nextPlayer = gameState_1.GameStateManager.getCurrentPlayer(room);
            console.log(`⏭️ 玩家 ${playerId} 跳过回合，下一位玩家: ${nextPlayer?.name || '未知'}`);
            return {
                success: true,
                nextPlayer
            };
        }
        catch (error) {
            console.error('跳过回合处理失败:', error);
            return { success: false, error: '跳过回合处理失败' };
        }
    }
    endGame(roomId, winner, reason) {
        const room = roomService_1.roomService.getRoom(roomId);
        if (!room) {
            return { success: false, error: '房间不存在' };
        }
        try {
            room.status = 'finished';
            room.updatedAt = new Date();
            if (winner) {
                console.log(`🏁 游戏结束，胜者: ${winner.name}，原因: ${reason || '正常结束'}`);
            }
            return { success: true };
        }
        catch (error) {
            console.error('结束游戏失败:', error);
            return { success: false, error: '结束游戏失败' };
        }
    }
    restartGame(roomId) {
        const room = roomService_1.roomService.getRoom(roomId);
        if (!room) {
            return { success: false, error: '房间不存在' };
        }
        const validation = gameState_1.GameStateManager.canStartNewGame(room);
        if (!validation.canStart) {
            return { success: false, error: validation.reason };
        }
        try {
            gameState_1.GameStateManager.resetGameState(room);
            console.log(`🔄 游戏重启，房间 ${roomId} 状态已重置`);
            return { success: true };
        }
        catch (error) {
            console.error('重启游戏失败:', error);
            return { success: false, error: '重启游戏失败' };
        }
    }
    getGameState(roomId) {
        const room = roomService_1.roomService.getRoom(roomId);
        if (!room) {
            return { success: false, error: '房间不存在' };
        }
        try {
            const currentPlayer = gameState_1.GameStateManager.getCurrentPlayer(room);
            const nextPlayer = gameState_1.GameStateManager.getNextPlayer(room);
            const gameStats = gameState_1.GameStateManager.getGameStats(room);
            const phaseDescription = gameState_1.GameStateManager.getGamePhaseDescription(room);
            const gameFinishedCheck = gameState_1.GameStateManager.isGameFinished(room);
            return {
                success: true,
                data: {
                    roomId,
                    status: room.status,
                    phase: phaseDescription,
                    currentPlayer: currentPlayer ? {
                        id: currentPlayer.id,
                        name: currentPlayer.name,
                        cardCount: currentPlayer.cardCount
                    } : null,
                    nextPlayer: nextPlayer ? {
                        id: nextPlayer.id,
                        name: nextPlayer.name,
                        cardCount: nextPlayer.cardCount
                    } : null,
                    landlord: room.landlord ? {
                        id: room.landlord.id,
                        name: room.landlord.name
                    } : null,
                    stats: gameStats,
                    players: room.players.map(player => ({
                        id: player.id,
                        name: player.name,
                        cardCount: player.cardCount,
                        ready: player.ready,
                        status: this.playerService.getPlayerStatusDescription(room, player.id)
                    })),
                    gameFinished: gameFinishedCheck.finished,
                    winner: gameFinishedCheck.winner,
                    finishReason: gameFinishedCheck.reason
                }
            };
        }
        catch (error) {
            console.error('获取游戏状态失败:', error);
            return { success: false, error: '获取游戏状态失败' };
        }
    }
    handleGameEvent(roomId, event, playerId, data = {}) {
        try {
            switch (event) {
                case 'start_game':
                    return {
                        success: this.startGame(roomId).success,
                        error: this.startGame(roomId).error
                    };
                case 'grab_landlord':
                    return this.handleGrabLandlord(roomId, playerId, data.isGrab || false);
                case 'play_cards':
                    return this.handlePlayCards(roomId, playerId, data.cards || []);
                case 'pass_turn':
                    return this.handlePassTurn(roomId, playerId);
                case 'end_game':
                    return this.endGame(roomId, data.winner, data.reason);
                case 'restart_game':
                    return this.restartGame(roomId);
                default:
                    return { success: false, error: '未知的游戏事件' };
            }
        }
        catch (error) {
            console.error('处理游戏事件失败:', error);
            return { success: false, error: '处理游戏事件失败' };
        }
    }
}
exports.GameEngine = GameEngine;
//# sourceMappingURL=gameEngine.js.map