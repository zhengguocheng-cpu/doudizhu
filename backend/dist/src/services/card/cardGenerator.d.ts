import { Card } from '../../types';
export declare class CardGenerator {
    private static readonly SUITS;
    private static readonly RANKS;
    static generateDeck(): Card[];
    static generateCards(count: number): Card[];
    static generateStandardDeck(): Card[];
    static getSuitDisplayName(suit: Card['suit']): string;
    static getRankDisplayName(rank: Card['rank']): string;
    static cardToString(card: Card): string;
    static stringToCard(cardString: string): Card;
}
//# sourceMappingURL=cardGenerator.d.ts.map