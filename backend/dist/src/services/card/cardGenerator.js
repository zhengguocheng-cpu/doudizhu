"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardGenerator = void 0;
class CardGenerator {
    static generateDeck() {
        const cards = [];
        this.SUITS.forEach(suit => {
            this.RANKS.forEach(rank => {
                cards.push({ suit, rank });
            });
        });
        cards.push({ suit: 'hearts', rank: '2' }, { suit: 'diamonds', rank: '2' });
        return cards;
    }
    static generateCards(count) {
        const fullDeck = this.generateDeck();
        return fullDeck.slice(0, Math.min(count, fullDeck.length));
    }
    static generateStandardDeck() {
        return this.SUITS.flatMap(suit => this.RANKS.map(rank => ({ suit, rank })));
    }
    static getSuitDisplayName(suit) {
        const suitNames = {
            'hearts': '♥',
            'diamonds': '♦',
            'clubs': '♣',
            'spades': '♠'
        };
        return suitNames[suit] || suit;
    }
    static getRankDisplayName(rank) {
        const rankNames = {
            'J': 'J',
            'Q': 'Q',
            'K': 'K',
            'A': 'A',
            '2': '2'
        };
        return rankNames[rank] || rank;
    }
    static cardToString(card) {
        return `${card.suit}${card.rank}`;
    }
    static stringToCard(cardString) {
        if (cardString.length < 2) {
            throw new Error('无效的卡牌字符串');
        }
        const suit = cardString.slice(0, -1);
        const rank = cardString.slice(-1);
        if (cardString.includes('🃏') || cardString.includes('🂠')) {
            return { suit: 'hearts', rank: '2' };
        }
        return { suit, rank };
    }
}
exports.CardGenerator = CardGenerator;
CardGenerator.SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
CardGenerator.RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
//# sourceMappingURL=cardGenerator.js.map