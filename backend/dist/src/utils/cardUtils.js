"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardUtils = void 0;
class CardUtils {
    static compareCards(cards1, cards2) {
        if (cards1.length === 0 && cards2.length === 0)
            return 0;
        if (cards1.length === 0)
            return -1;
        if (cards2.length === 0)
            return 1;
        const type1 = this.getCardType(cards1);
        const type2 = this.getCardType(cards2);
        if (type1.level !== type2.level) {
            return type1.level - type2.level;
        }
        return this.compareSameTypeCards(cards1, cards2, type1);
    }
    static getCardType(cards) {
        if (cards.length === 0)
            return { type: 'empty', level: 0, value: 0 };
        const sortedCards = [...cards].sort((a, b) => this.getCardValue(b) - this.getCardValue(a));
        if (this.isRocket(sortedCards)) {
            return { type: 'rocket', level: 15, value: 2 };
        }
        if (this.isBomb(sortedCards)) {
            return { type: 'bomb', level: 14, value: this.getCardValue(sortedCards[0]) };
        }
        if (cards.length === 1) {
            return { type: 'single', level: 1, value: this.getCardValue(sortedCards[0]) };
        }
        if (cards.length === 2 && this.isPair(sortedCards)) {
            return { type: 'pair', level: 2, value: this.getCardValue(sortedCards[0]) };
        }
        if (cards.length === 3 && this.isThreeOfAKind(sortedCards)) {
            return { type: 'three', level: 3, value: this.getCardValue(sortedCards[1]) };
        }
        if (cards.length === 4 && this.isThreeWithOne(sortedCards)) {
            return { type: 'three_with_one', level: 4, value: this.getCardValue(sortedCards[1]) };
        }
        if (cards.length === 5 && this.isThreeWithPair(sortedCards)) {
            return { type: 'three_with_pair', level: 5, value: this.getCardValue(sortedCards[2]) };
        }
        if (this.isStraight(sortedCards)) {
            return { type: 'straight', level: 6, value: this.getCardValue(sortedCards[0]) };
        }
        if (this.isStraightPair(sortedCards)) {
            return { type: 'straight_pair', level: 7, value: this.getCardValue(sortedCards[0]) };
        }
        if (this.isThreeOfAKindStraight(sortedCards)) {
            return { type: 'plane', level: 8, value: this.getCardValue(sortedCards[1]) };
        }
        if (this.isPlaneWithWings(sortedCards)) {
            return { type: 'plane_with_wings', level: 9, value: this.getCardValue(sortedCards[1]) };
        }
        if (cards.length === 6 && this.isFourWithTwo(sortedCards)) {
            return { type: 'four_with_two', level: 10, value: this.getCardValue(sortedCards[2]) };
        }
        return { type: 'invalid', level: 0, value: 0 };
    }
    static getCardValue(card) {
        const rankValues = {
            '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15
        };
        return rankValues[card.rank] || 0;
    }
    static getSuitValue(suit) {
        const suitValues = {
            'hearts': 1, 'diamonds': 2, 'clubs': 3, 'spades': 4
        };
        return suitValues[suit] || 0;
    }
    static isRocket(cards) {
        return cards.length === 2 &&
            cards.every(card => card.rank === '2') &&
            cards.some(card => card.suit === 'hearts') &&
            cards.some(card => card.suit === 'diamonds');
    }
    static isBomb(cards) {
        if (cards.length !== 4)
            return false;
        return cards.every(card => card.rank === cards[0].rank);
    }
    static isPair(cards) {
        return cards.length === 2 && cards[0].rank === cards[1].rank;
    }
    static isThreeOfAKind(cards) {
        return cards.length === 3 && cards.every(card => card.rank === cards[0].rank);
    }
    static isThreeWithOne(cards) {
        if (cards.length !== 4)
            return false;
        const sorted = cards.sort((a, b) => this.getCardValue(a) - this.getCardValue(b));
        return (sorted[0].rank === sorted[1].rank && sorted[0].rank === sorted[2].rank) ||
            (sorted[1].rank === sorted[2].rank && sorted[1].rank === sorted[3].rank);
    }
    static isThreeWithPair(cards) {
        if (cards.length !== 5)
            return false;
        const sorted = cards.sort((a, b) => this.getCardValue(a) - this.getCardValue(b));
        return (sorted[0].rank === sorted[1].rank && sorted[0].rank === sorted[2].rank &&
            sorted[3].rank === sorted[4].rank) ||
            (sorted[0].rank === sorted[1].rank &&
                sorted[2].rank === sorted[3].rank && sorted[2].rank === sorted[4].rank);
    }
    static isStraight(cards) {
        if (cards.length < 5 || cards.length > 12)
            return false;
        const sorted = cards.sort((a, b) => this.getCardValue(a) - this.getCardValue(b));
        for (let i = 1; i < sorted.length; i++) {
            if (this.getCardValue(sorted[i]) - this.getCardValue(sorted[i - 1]) !== 1) {
                return false;
            }
        }
        return this.getCardValue(sorted[sorted.length - 1]) <= 14;
    }
    static isStraightPair(cards) {
        if (cards.length < 6 || cards.length % 2 !== 0)
            return false;
        const sorted = cards.sort((a, b) => this.getCardValue(a) - this.getCardValue(b));
        for (let i = 0; i < sorted.length; i += 2) {
            if (sorted[i].rank !== sorted[i + 1].rank) {
                return false;
            }
            if (i > 0 && this.getCardValue(sorted[i]) - this.getCardValue(sorted[i - 2]) !== 1) {
                return false;
            }
        }
        return this.getCardValue(sorted[sorted.length - 2]) <= 14;
    }
    static isThreeOfAKindStraight(cards) {
        if (cards.length < 6 || cards.length % 3 !== 0)
            return false;
        const sorted = cards.sort((a, b) => this.getCardValue(a) - this.getCardValue(b));
        for (let i = 0; i < sorted.length; i += 3) {
            if (sorted[i].rank !== sorted[i + 1].rank || sorted[i].rank !== sorted[i + 2].rank) {
                return false;
            }
            if (i > 0 && this.getCardValue(sorted[i]) - this.getCardValue(sorted[i - 3]) !== 1) {
                return false;
            }
        }
        return this.getCardValue(sorted[sorted.length - 3]) <= 14;
    }
    static isPlaneWithWings(cards) {
        if (cards.length !== 8)
            return false;
        const sorted = cards.sort((a, b) => this.getCardValue(a) - this.getCardValue(b));
        if (sorted[0].rank === sorted[1].rank && sorted[0].rank === sorted[2].rank &&
            sorted[3].rank === sorted[4].rank && sorted[3].rank === sorted[5].rank &&
            this.getCardValue(sorted[0]) === this.getCardValue(sorted[3]) - 1) {
            return true;
        }
        return false;
    }
    static isFourWithTwo(cards) {
        if (cards.length !== 6)
            return false;
        const sorted = cards.sort((a, b) => this.getCardValue(a) - this.getCardValue(b));
        return (sorted[0].rank === sorted[1].rank && sorted[0].rank === sorted[2].rank && sorted[0].rank === sorted[3].rank) ||
            (sorted[1].rank === sorted[2].rank && sorted[1].rank === sorted[3].rank && sorted[1].rank === sorted[4].rank) ||
            (sorted[2].rank === sorted[3].rank && sorted[2].rank === sorted[4].rank && sorted[2].rank === sorted[5].rank);
    }
    static compareSameTypeCards(cards1, cards2, type1) {
        const sorted1 = [...cards1].sort((a, b) => this.getCardValue(b) - this.getCardValue(a));
        const sorted2 = [...cards2].sort((a, b) => this.getCardValue(b) - this.getCardValue(a));
        return this.getCardValue(sorted1[0]) - this.getCardValue(sorted2[0]);
    }
}
exports.CardUtils = CardUtils;
//# sourceMappingURL=cardUtils.js.map