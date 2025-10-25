import { Card } from '../../types';
export declare class CardService {
    private static readonly CARDS_PER_PLAYER;
    private static readonly BOTTOM_CARDS_COUNT;
    createShuffledDeck(): Card[];
    dealCards(playerCount: number): {
        playerCards: Card[][];
        bottomCards: Card[];
    };
    validatePlay(playerCards: string[], playedCards: string[]): {
        valid: boolean;
        error?: string;
    };
    compareCardGroups(cards1: string[], cards2: string[]): number;
    getCardDisplayName(cardString: string): string;
    getCardsDisplayNames(cardStrings: string[]): string[];
    validateShuffleFairness(shuffles?: number): boolean;
}
export declare const cardService: CardService;
//# sourceMappingURL=cardService.d.ts.map