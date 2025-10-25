"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRules = void 0;
class GameRules {
    static validateGameStartConditions(room) {
        if (room.status !== 'waiting') {
            return { valid: false, error: '房间状态不正确' };
        }
        if (room.players.length < this.MIN_PLAYERS || room.players.length > this.MAX_PLAYERS) {
            return { valid: false, error: `玩家数量必须在${this.MIN_PLAYERS}-${this.MAX_PLAYERS}之间` };
        }
        const allReady = room.players.every(player => player.ready === true);
        if (!allReady) {
            return { valid: false, error: '不是所有玩家都已准备' };
        }
        const names = room.players.map(p => p.name);
        const uniqueNames = new Set(names);
        if (names.length !== uniqueNames.size) {
            return { valid: false, error: '存在重复的玩家名称' };
        }
        return { valid: true };
    }
    static validateGrabLandlord(room, playerId, isGrab) {
        if (room.status !== 'playing') {
            return { valid: false, error: '游戏状态不正确' };
        }
        if (room.landlord) {
            return { valid: false, error: '已经确定地主' };
        }
        if (!this.isPlayerTurn(room, playerId)) {
            return { valid: false, error: '还没轮到你抢地主' };
        }
        const player = room.players.find(p => p.id === playerId);
        if (!player || !player.cards || player.cards.length === 0) {
            return { valid: false, error: '没有手牌' };
        }
        return { valid: true };
    }
    static validatePlayCards(room, playerId, cards) {
        if (room.status !== 'playing') {
            return { valid: false, error: '游戏状态不正确' };
        }
        if (!room.landlord) {
            return { valid: false, error: '地主未确定' };
        }
        if (!this.isPlayerTurn(room, playerId)) {
            return { valid: false, error: '还没轮到你出牌' };
        }
        const player = room.players.find(p => p.id === playerId);
        if (!player || !player.cards) {
            return { valid: false, error: '玩家信息不完整' };
        }
        for (const card of cards) {
            if (!player.cards.includes(card)) {
                return { valid: false, error: '玩家没有这张牌' };
            }
        }
        const cardTypeValidation = this.validateCardCombination(cards);
        if (!cardTypeValidation.valid) {
            return { valid: false, error: cardTypeValidation.error };
        }
        if (room.cards.played.length > 0) {
            const lastPlayedCards = room.cards.played[room.cards.played.length - 1];
            if (lastPlayedCards.length > 0) {
                const comparison = this.compareCardCombinations(cards, lastPlayedCards);
                if (comparison === 'smaller') {
                    return { valid: false, error: '牌型比上家小' };
                }
            }
        }
        return {
            valid: true,
            cardType: cardTypeValidation.cardType
        };
    }
    static validatePassTurn(room, playerId) {
        if (room.status !== 'playing') {
            return { valid: false, error: '游戏状态不正确' };
        }
        if (!room.landlord) {
            return { valid: false, error: '地主未确定' };
        }
        if (!this.isPlayerTurn(room, playerId)) {
            return { valid: false, error: '还没轮到你出牌' };
        }
        if (room.cards.played.length === 0) {
            return { valid: false, error: '第一轮不能跳过' };
        }
        const lastPlayedCards = room.cards.played[room.cards.played.length - 1];
        if (lastPlayedCards.length === 0) {
            return { valid: false, error: '上一轮没有出牌，不能跳过' };
        }
        return { valid: true };
    }
    static validateCardCombination(cards) {
        if (cards.length === 0) {
            return { valid: false, error: '不能出空牌' };
        }
        if (cards.length === 1) {
            return { valid: true, cardType: 'single' };
        }
        else if (cards.length === 2) {
            return { valid: true, cardType: 'pair' };
        }
        else if (cards.length === 3) {
            return { valid: true, cardType: 'triple' };
        }
        else if (cards.length === 4) {
            return { valid: true, cardType: 'bomb' };
        }
        return { valid: true, cardType: 'unknown' };
    }
    static compareCardCombinations(cards1, cards2) {
        if (cards1.length !== cards2.length) {
            return cards1.length > cards2.length ? 'bigger' : 'smaller';
        }
        const value1 = this.getCardsValue(cards1);
        const value2 = this.getCardsValue(cards2);
        if (value1 > value2)
            return 'bigger';
        if (value1 < value2)
            return 'smaller';
        return 'equal';
    }
    static getCardsValue(cards) {
        let total = 0;
        for (const card of cards) {
            total += this.getCardValue(card);
        }
        return total;
    }
    static getCardValue(card) {
        const rank = card.slice(-1);
        const rankValues = {
            'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10,
            '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
        };
        return rankValues[rank] || 0;
    }
    static isPlayerTurn(room, playerId) {
        const currentPlayer = room.players[room.currentPlayerIndex];
        return currentPlayer?.id === playerId;
    }
    static getLandlordScoreMultiplier(grabCount) {
        const multipliers = [1, 2, 4];
        return multipliers[grabCount] || 4;
    }
    static isBomb(cards) {
        if (cards.length === 4)
            return true;
        if (cards.includes('🃏') || cards.includes('🂠'))
            return true;
        return false;
    }
    static getGameConfig() {
        return {
            cardsPerPlayer: this.CARDS_PER_PLAYER,
            bottomCardsCount: this.BOTTOM_CARDS_COUNT,
            minPlayers: this.MIN_PLAYERS,
            maxPlayers: this.MAX_PLAYERS,
            maxRounds: 100
        };
    }
}
exports.GameRules = GameRules;
GameRules.CARDS_PER_PLAYER = 17;
GameRules.BOTTOM_CARDS_COUNT = 3;
GameRules.MIN_PLAYERS = 3;
GameRules.MAX_PLAYERS = 6;
//# sourceMappingURL=gameRules.js.map