"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameStateManager = void 0;
class GameStateManager {
    static getNextPlayerIndex(room) {
        if (room.currentPlayerIndex === -1) {
            return 0;
        }
        const nextIndex = (room.currentPlayerIndex + 1) % room.players.length;
        return nextIndex;
    }
    static getCurrentPlayer(room) {
        if (room.currentPlayerIndex === -1 || room.currentPlayerIndex >= room.players.length) {
            return undefined;
        }
        return room.players[room.currentPlayerIndex];
    }
    static getNextPlayer(room) {
        const nextIndex = this.getNextPlayerIndex(room);
        return room.players[nextIndex];
    }
    static setCurrentPlayer(room, playerId) {
        const playerIndex = room.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) {
            return false;
        }
        room.currentPlayerIndex = playerIndex;
        room.updatedAt = new Date();
        return true;
    }
    static switchToNextPlayer(room) {
        if (room.players.length === 0) {
            return false;
        }
        room.currentPlayerIndex = this.getNextPlayerIndex(room);
        room.updatedAt = new Date();
        return true;
    }
    static isGameFinished(room) {
        const playerWithNoCards = room.players.find(player => player.cards && player.cards.length === 0);
        if (playerWithNoCards) {
            return {
                finished: true,
                winner: playerWithNoCards,
                reason: `${playerWithNoCards.name}出完所有牌，游戏结束`
            };
        }
        const playersWithCards = room.players.filter(player => player.cards && player.cards.length > 0);
        if (playersWithCards.length <= 1) {
            const winner = playersWithCards[0] || room.players[0];
            return {
                finished: true,
                winner,
                reason: '只剩一个玩家有牌，游戏结束'
            };
        }
        const maxRounds = 100;
        if (room.cards.played.length > maxRounds) {
            const sortedPlayers = room.players.sort((a, b) => (a.cardCount || 0) - (b.cardCount || 0));
            return {
                finished: true,
                winner: sortedPlayers[0],
                reason: '达到最大回合数，按手牌数量判定胜者'
            };
        }
        return { finished: false };
    }
    static calculatePlayerScore(player, isWinner, isLandlord) {
        const baseScore = 10;
        if (isWinner) {
            if (isLandlord) {
                return baseScore * 2;
            }
            else {
                return baseScore;
            }
        }
        else {
            if (isLandlord) {
                return -baseScore * 2;
            }
            else {
                return -baseScore;
            }
        }
    }
    static getGameStats(room) {
        const totalCards = room.players.reduce((sum, player) => sum + (player.cardCount || 0), 0);
        const remainingCards = totalCards + (room.cards.remaining?.length || 0);
        const playedCards = room.cards.played.reduce((sum, round) => sum + round.length, 0);
        const startTime = room.updatedAt || new Date();
        const gameDuration = Date.now() - startTime.getTime();
        return {
            totalRounds: room.cards.played.length,
            currentRound: room.currentPlayerIndex + 1,
            remainingCards,
            playedCards,
            playersWithCards: room.players.filter(p => (p.cardCount || 0) > 0).length,
            gameDuration: Math.floor(gameDuration / 1000)
        };
    }
    static getGamePhaseDescription(room) {
        if (room.status === 'waiting') {
            return '等待玩家准备';
        }
        else if (room.status === 'playing') {
            if (!room.landlord) {
                return '抢地主阶段';
            }
            else {
                return '游戏进行中';
            }
        }
        else if (room.status === 'finished') {
            return '游戏已结束';
        }
        return '未知状态';
    }
    static canStartNewGame(room) {
        if (room.status !== 'finished') {
            return { canStart: false, reason: '当前游戏未结束' };
        }
        if (room.players.length < 3) {
            return { canStart: false, reason: '玩家数量不足，需要至少3名玩家' };
        }
        const allReady = room.players.every(player => player.ready);
        if (!allReady) {
            return { canStart: false, reason: '不是所有玩家都已准备' };
        }
        return { canStart: true };
    }
    static resetGameState(room) {
        room.status = 'waiting';
        room.currentPlayerIndex = 0;
        room.landlord = null;
        room.cards = {
            remaining: [],
            played: []
        };
        room.players.forEach(player => {
            player.ready = false;
            player.cards = [];
            player.cardCount = 0;
        });
        room.updatedAt = new Date();
    }
}
exports.GameStateManager = GameStateManager;
//# sourceMappingURL=gameState.js.map