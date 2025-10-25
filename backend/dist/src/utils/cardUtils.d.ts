import { Card } from '../types';
export declare class CardUtils {
    static compareCards(cards1: Card[], cards2: Card[]): number;
    static getCardType(cards: Card[]): {
        type: string;
        level: number;
        value: number;
    };
    static getCardValue(card: Card): number;
    static getSuitValue(suit: Card['suit']): number;
    private static isRocket;
    private static isBomb;
    private static isPair;
    private static isThreeOfAKind;
    private static isThreeWithOne;
    private static isThreeWithPair;
    private static isStraight;
    private static isStraightPair;
    private static isThreeOfAKindStraight;
    private static isPlaneWithWings;
    private static isFourWithTwo;
    private static compareSameTypeCards;
}
//# sourceMappingURL=cardUtils.d.ts.map