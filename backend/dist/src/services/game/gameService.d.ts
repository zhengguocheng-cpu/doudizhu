import { GameRoom, Player } from '../../types';
export declare class GameService {
    private gameEngine;
    constructor();
    startGame(roomId: string): {
        success: boolean;
        error?: string;
    };
    handleGrabLandlord(roomId: string, playerId: string, isGrab: boolean): {
        success: boolean;
        error?: string;
        gameFinished?: boolean;
    };
    handlePlayCards(roomId: string, playerId: string, cards: string[]): {
        success: boolean;
        error?: string;
        nextPlayer?: Player;
    };
    handlePassTurn(roomId: string, playerId: string): {
        success: boolean;
        error?: string;
        nextPlayer?: Player;
    };
    endGame(roomId: string, winner?: Player, reason?: string): {
        success: boolean;
        error?: string;
    };
    restartGame(roomId: string): {
        success: boolean;
        error?: string;
    };
    getGameState(roomId: string): {
        success: boolean;
        data?: any;
        error?: string;
    };
    handleGameEvent(roomId: string, event: string, playerId: string, data?: any): {
        success: boolean;
        error?: string;
        result?: any;
    };
    validateGameOperation(room: GameRoom, operation: string, playerId?: string, data?: any): {
        valid: boolean;
        error?: string;
    };
    isGameFinished(room: GameRoom): {
        finished: boolean;
        winner?: Player;
        reason?: string;
    };
    getGameStats(room: GameRoom): {
        totalRounds: number;
        currentRound: number;
        remainingCards: number;
        playedCards: number;
        playersWithCards: number;
        gameDuration?: number;
    };
    getGameConfig(): {
        cardsPerPlayer: number;
        bottomCardsCount: number;
        minPlayers: number;
        maxPlayers: number;
        maxRounds: number;
    };
}
export declare function getGameService(): GameService;
//# sourceMappingURL=gameService.d.ts.map