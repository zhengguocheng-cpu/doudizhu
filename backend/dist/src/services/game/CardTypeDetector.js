"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardTypeDetector = exports.CardType = void 0;
var CardType;
(function (CardType) {
    CardType["SINGLE"] = "single";
    CardType["PAIR"] = "pair";
    CardType["TRIPLE"] = "triple";
    CardType["TRIPLE_WITH_SINGLE"] = "triple_with_single";
    CardType["TRIPLE_WITH_PAIR"] = "triple_with_pair";
    CardType["STRAIGHT"] = "straight";
    CardType["CONSECUTIVE_PAIRS"] = "consecutive_pairs";
    CardType["AIRPLANE"] = "airplane";
    CardType["AIRPLANE_WITH_WINGS"] = "airplane_with_wings";
    CardType["FOUR_WITH_TWO"] = "four_with_two";
    CardType["BOMB"] = "bomb";
    CardType["ROCKET"] = "rocket";
    CardType["INVALID"] = "invalid";
})(CardType || (exports.CardType = CardType = {}));
const CARD_VALUES = {
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    'J': 11,
    'Q': 12,
    'K': 13,
    'A': 14,
    '2': 15,
    '小王': 16,
    '大王': 17
};
class CardTypeDetector {
    static detect(cards) {
        if (!cards || cards.length === 0) {
            return { type: CardType.INVALID, value: 0, cards: [] };
        }
        return (this.isRocket(cards) ||
            this.isBomb(cards) ||
            this.isStraight(cards) ||
            this.isConsecutivePairs(cards) ||
            this.isAirplane(cards) ||
            this.isAirplaneWithWings(cards) ||
            this.isFourWithTwo(cards) ||
            this.isTripleWithPair(cards) ||
            this.isTripleWithSingle(cards) ||
            this.isTriple(cards) ||
            this.isPair(cards) ||
            this.isSingle(cards) ||
            { type: CardType.INVALID, value: 0, cards });
    }
    static getCardValue(card) {
        const rank = card.replace(/[♠♥♣♦]/g, '');
        return CARD_VALUES[rank] || 0;
    }
    static getCardRank(card) {
        return card.replace(/[♠♥♣♦]/g, '');
    }
    static countCards(cards) {
        const counts = new Map();
        for (const card of cards) {
            const rank = this.getCardRank(card);
            counts.set(rank, (counts.get(rank) || 0) + 1);
        }
        return counts;
    }
    static isSingle(cards) {
        if (cards.length !== 1)
            return null;
        return {
            type: CardType.SINGLE,
            value: this.getCardValue(cards[0]),
            cards
        };
    }
    static isPair(cards) {
        if (cards.length !== 2)
            return null;
        const rank1 = this.getCardRank(cards[0]);
        const rank2 = this.getCardRank(cards[1]);
        if (rank1 === rank2) {
            return {
                type: CardType.PAIR,
                value: this.getCardValue(cards[0]),
                cards
            };
        }
        return null;
    }
    static isTriple(cards) {
        if (cards.length !== 3)
            return null;
        const counts = this.countCards(cards);
        if (counts.size === 1 && counts.values().next().value === 3) {
            return {
                type: CardType.TRIPLE,
                value: this.getCardValue(cards[0]),
                cards
            };
        }
        return null;
    }
    static isTripleWithSingle(cards) {
        if (cards.length !== 4)
            return null;
        const counts = this.countCards(cards);
        if (counts.size !== 2)
            return null;
        const countsArray = Array.from(counts.entries());
        const [rank1, count1] = countsArray[0];
        const [rank2, count2] = countsArray[1];
        if ((count1 === 3 && count2 === 1) || (count1 === 1 && count2 === 3)) {
            const tripleRank = count1 === 3 ? rank1 : rank2;
            return {
                type: CardType.TRIPLE_WITH_SINGLE,
                value: CARD_VALUES[tripleRank],
                cards
            };
        }
        return null;
    }
    static isTripleWithPair(cards) {
        if (cards.length !== 5)
            return null;
        const counts = this.countCards(cards);
        if (counts.size !== 2)
            return null;
        const countsArray = Array.from(counts.entries());
        const [rank1, count1] = countsArray[0];
        const [rank2, count2] = countsArray[1];
        if ((count1 === 3 && count2 === 2) || (count1 === 2 && count2 === 3)) {
            const tripleRank = count1 === 3 ? rank1 : rank2;
            return {
                type: CardType.TRIPLE_WITH_PAIR,
                value: CARD_VALUES[tripleRank],
                cards
            };
        }
        return null;
    }
    static isStraight(cards) {
        if (cards.length < 5)
            return null;
        for (const card of cards) {
            const rank = this.getCardRank(card);
            if (rank === '2' || rank === '小王' || rank === '大王') {
                return null;
            }
        }
        const values = cards.map(card => this.getCardValue(card)).sort((a, b) => a - b);
        for (let i = 1; i < values.length; i++) {
            if (values[i] !== values[i - 1] + 1) {
                return null;
            }
        }
        return {
            type: CardType.STRAIGHT,
            value: values[values.length - 1],
            cards,
            length: cards.length
        };
    }
    static isConsecutivePairs(cards) {
        if (cards.length < 6 || cards.length % 2 !== 0)
            return null;
        const counts = this.countCards(cards);
        for (const count of counts.values()) {
            if (count !== 2)
                return null;
        }
        for (const rank of counts.keys()) {
            if (rank === '2' || rank === '小王' || rank === '大王') {
                return null;
            }
        }
        const values = Array.from(counts.keys())
            .map(rank => CARD_VALUES[rank])
            .sort((a, b) => a - b);
        for (let i = 1; i < values.length; i++) {
            if (values[i] !== values[i - 1] + 1) {
                return null;
            }
        }
        return {
            type: CardType.CONSECUTIVE_PAIRS,
            value: values[values.length - 1],
            cards,
            length: values.length
        };
    }
    static isAirplane(cards) {
        if (cards.length < 6 || cards.length % 3 !== 0)
            return null;
        const counts = this.countCards(cards);
        for (const count of counts.values()) {
            if (count !== 3)
                return null;
        }
        for (const rank of counts.keys()) {
            if (rank === '2' || rank === '小王' || rank === '大王') {
                return null;
            }
        }
        const values = Array.from(counts.keys())
            .map(rank => CARD_VALUES[rank])
            .sort((a, b) => a - b);
        if (values.length < 2)
            return null;
        for (let i = 1; i < values.length; i++) {
            if (values[i] !== values[i - 1] + 1) {
                return null;
            }
        }
        return {
            type: CardType.AIRPLANE,
            value: values[values.length - 1],
            cards,
            length: values.length
        };
    }
    static isAirplaneWithWings(cards) {
        return null;
    }
    static isFourWithTwo(cards) {
        if (cards.length !== 6 && cards.length !== 8)
            return null;
        const counts = this.countCards(cards);
        let fourRank = null;
        for (const [rank, count] of counts.entries()) {
            if (count === 4) {
                fourRank = rank;
                break;
            }
        }
        if (!fourRank)
            return null;
        if (cards.length === 6) {
            return {
                type: CardType.FOUR_WITH_TWO,
                value: CARD_VALUES[fourRank],
                cards
            };
        }
        else {
            const otherCounts = Array.from(counts.values()).filter(c => c !== 4);
            if (otherCounts.length === 2 && otherCounts.every(c => c === 2)) {
                return {
                    type: CardType.FOUR_WITH_TWO,
                    value: CARD_VALUES[fourRank],
                    cards
                };
            }
        }
        return null;
    }
    static isBomb(cards) {
        if (cards.length !== 4)
            return null;
        const counts = this.countCards(cards);
        if (counts.size === 1 && counts.values().next().value === 4) {
            return {
                type: CardType.BOMB,
                value: this.getCardValue(cards[0]),
                cards
            };
        }
        return null;
    }
    static isRocket(cards) {
        if (cards.length !== 2)
            return null;
        const ranks = cards.map(card => this.getCardRank(card)).sort();
        if (ranks[0] === '大王' && ranks[1] === '小王') {
            return {
                type: CardType.ROCKET,
                value: 17,
                cards
            };
        }
        return null;
    }
}
exports.CardTypeDetector = CardTypeDetector;
//# sourceMappingURL=CardTypeDetector.js.map