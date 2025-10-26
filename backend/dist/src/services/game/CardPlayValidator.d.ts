import { CardPattern } from './CardTypeDetector';
export interface ValidationResult {
    valid: boolean;
    error?: string;
    pattern?: CardPattern;
}
export declare class CardPlayValidator {
    static validate(playerCards: string[], playedCards: string[], lastPattern: CardPattern | null, isFirstPlay: boolean): ValidationResult;
    private static hasCards;
    private static canBeat;
}
//# sourceMappingURL=CardPlayValidator.d.ts.map