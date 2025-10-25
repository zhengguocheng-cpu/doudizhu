import { Card } from '../../types';
export declare class CardShuffler {
    static shuffle(cards: Card[]): Card[];
    static shuffleMultiple(cards: Card[], times?: number): Card[];
    static cutAndShuffle(cards: Card[]): Card[];
    static perfectShuffle(cards: Card[]): Card[];
    static validateShuffleFairness(cards: Card[], shuffles?: number): {
        isFair: boolean;
        distribution: Map<string, number>;
    };
}
//# sourceMappingURL=cardShuffler.d.ts.map