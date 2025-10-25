"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardShuffler = void 0;
class CardShuffler {
    static shuffle(cards) {
        const shuffled = [...cards];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    static shuffleMultiple(cards, times = 3) {
        let shuffled = [...cards];
        for (let i = 0; i < times; i++) {
            shuffled = this.shuffle(shuffled);
        }
        return shuffled;
    }
    static cutAndShuffle(cards) {
        if (cards.length < 2)
            return cards;
        const cutPoint = Math.floor(Math.random() * cards.length);
        const firstHalf = cards.slice(0, cutPoint);
        const secondHalf = cards.slice(cutPoint);
        return this.shuffle([...secondHalf, ...firstHalf]);
    }
    static perfectShuffle(cards) {
        const n = cards.length;
        if (n < 2)
            return cards;
        const shuffled = [];
        const mid = Math.floor(n / 2);
        for (let i = 0; i < mid; i++) {
            shuffled.push(cards[i]);
            if (i + mid < n) {
                shuffled.push(cards[i + mid]);
            }
        }
        return shuffled;
    }
    static validateShuffleFairness(cards, shuffles = 1000) {
        const distribution = new Map();
        cards.forEach((card, index) => {
            const key = `${card.suit}_${card.rank}_${index}`;
            distribution.set(key, 0);
        });
        for (let i = 0; i < shuffles; i++) {
            const shuffled = this.shuffle([...cards]);
            shuffled.forEach((card, newIndex) => {
                const key = `${card.suit}_${card.rank}_${newIndex}`;
                distribution.set(key, (distribution.get(key) || 0) + 1);
            });
        }
        const expected = shuffles / cards.length;
        const tolerance = expected * 0.1;
        let isFair = true;
        for (const count of distribution.values()) {
            if (Math.abs(count - expected) > tolerance) {
                isFair = false;
                break;
            }
        }
        return { isFair, distribution };
    }
}
exports.CardShuffler = CardShuffler;
//# sourceMappingURL=cardShuffler.js.map