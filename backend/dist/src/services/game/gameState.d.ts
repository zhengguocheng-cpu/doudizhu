import { GameRoom, Player } from '../../types';
export declare class GameStateManager {
    static getNextPlayerIndex(room: GameRoom): number;
    static getCurrentPlayer(room: GameRoom): Player | undefined;
    static getNextPlayer(room: GameRoom): Player | undefined;
    static setCurrentPlayer(room: GameRoom, playerId: string): boolean;
    static switchToNextPlayer(room: GameRoom): boolean;
    static isGameFinished(room: GameRoom): {
        finished: boolean;
        winner?: Player;
        reason?: string;
    };
    static calculatePlayerScore(player: Player, isWinner: boolean, isLandlord: boolean): number;
    static getGameStats(room: GameRoom): {
        totalRounds: number;
        currentRound: number;
        remainingCards: number;
        playedCards: number;
        playersWithCards: number;
        gameDuration?: number;
    };
    static getGamePhaseDescription(room: GameRoom): string;
    static canStartNewGame(room: GameRoom): {
        canStart: boolean;
        reason?: string;
    };
    static resetGameState(room: GameRoom): void;
}
//# sourceMappingURL=gameState.d.ts.map