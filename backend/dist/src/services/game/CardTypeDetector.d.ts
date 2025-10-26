export declare enum CardType {
    SINGLE = "single",
    PAIR = "pair",
    TRIPLE = "triple",
    TRIPLE_WITH_SINGLE = "triple_with_single",
    TRIPLE_WITH_PAIR = "triple_with_pair",
    STRAIGHT = "straight",
    CONSECUTIVE_PAIRS = "consecutive_pairs",
    AIRPLANE = "airplane",
    AIRPLANE_WITH_WINGS = "airplane_with_wings",
    FOUR_WITH_TWO = "four_with_two",
    BOMB = "bomb",
    ROCKET = "rocket",
    INVALID = "invalid"
}
export interface CardPattern {
    type: CardType;
    value: number;
    cards: string[];
    length?: number;
}
export declare class CardTypeDetector {
    static detect(cards: string[]): CardPattern;
    static getCardValue(card: string): number;
    private static getCardRank;
    private static countCards;
    private static isSingle;
    private static isPair;
    private static isTriple;
    private static isTripleWithSingle;
    private static isTripleWithPair;
    private static isStraight;
    private static isConsecutivePairs;
    private static isAirplane;
    private static isAirplaneWithWings;
    private static isFourWithTwo;
    private static isBomb;
    private static isRocket;
}
//# sourceMappingURL=CardTypeDetector.d.ts.map