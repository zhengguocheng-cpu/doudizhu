import { Player } from '../../types';
export declare class GameEngine {
    private playerService;
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
}
//# sourceMappingURL=gameEngine.d.ts.map