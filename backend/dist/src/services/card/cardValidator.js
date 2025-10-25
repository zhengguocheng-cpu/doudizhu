"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardValidator = void 0;
class CardValidator {
    static validatePlayerCards(playerCards, playedCards) {
        for (const card of playedCards) {
            if (!playerCards.includes(card)) {
                return false;
            }
        }
        return true;
    }
    static validateCardCount(cards) {
        return cards.length > 0 && cards.length <= 20;
    }
    static isValidCardString(cardString) {
        if (cardString.length < 2 || cardString.length > 3) {
            return false;
        }
        if (cardString.includes('🃏') || cardString.includes('🂠')) {
            return true;
        }
        const suit = cardString.slice(0, -1);
        const rank = cardString.slice(-1);
        const validSuits = ['hearts', 'diamonds', 'clubs', 'spades', '♠', '♥', '♣', '♦'];
        const validRanks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
        return validSuits.some(s => suit.includes(s.slice(0, 1))) && validRanks.includes(rank);
    }
    static validateRoomPlayerCount(playerCount) {
        return playerCount >= 3 && playerCount <= 6;
    }
    static validateGameStartConditions(players) {
        if (players.length < 3)
            return false;
        return players.every(player => player.ready === true);
    }
    static isPass(cards) {
        return !cards || cards.length === 0;
    }
    static getCardValue(cardString) {
        if (cardString.includes('🃏') || cardString.includes('🂠')) {
            return cardString.includes('🂠') ? 17 : 16;
        }
        const rank = cardString.slice(-1);
        const rankValues = {
            '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15
        };
        return rankValues[rank] || 0;
    }
    static compareCards(card1, card2) {
        const value1 = this.getCardValue(card1);
        const value2 = this.getCardValue(card2);
        if (value1 > value2)
            return 1;
        if (value1 < value2)
            return -1;
        return 0;
    }
}
exports.CardValidator = CardValidator;
//# sourceMappingURL=cardValidator.js.map