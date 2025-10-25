import { GameRoom } from '../../types';
export declare class GameRules {
    private static readonly CARDS_PER_PLAYER;
    private static readonly BOTTOM_CARDS_COUNT;
    private static readonly MIN_PLAYERS;
    private static readonly MAX_PLAYERS;
    static validateGameStartConditions(room: GameRoom): {
        valid: boolean;
        error?: string;
    };
    static validateGrabLandlord(room: GameRoom, playerId: string, isGrab: boolean): {
        valid: boolean;
        error?: string;
    };
    static validatePlayCards(room: GameRoom, playerId: string, cards: string[]): {
        valid: boolean;
        error?: string;
        cardType?: string;
    };
    static validatePassTurn(room: GameRoom, playerId: string): {
        valid: boolean;
        error?: string;
    };
    private static validateCardCombination;
    private static compareCardCombinations;
    private static getCardsValue;
    private static getCardValue;
    private static isPlayerTurn;
    static getLandlordScoreMultiplier(grabCount: number): number;
    static isBomb(cards: string[]): boolean;
    static getGameConfig(): {
        cardsPerPlayer: number;
        bottomCardsCount: number;
        minPlayers: number;
        maxPlayers: number;
        maxRounds: number;
    };
}
//# sourceMappingURL=gameRules.d.ts.map