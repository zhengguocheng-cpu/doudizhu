import { GameRoom, Player } from '../types';
export declare class GameFacade {
    createGameRoom(name: string, maxPlayers?: number): GameRoom;
    quickJoinGame(roomId: string, userName: string): {
        success: boolean;
        player?: Player;
        error?: string;
    };
    quickStartGame(roomId: string): {
        success: boolean;
        error?: string;
    };
    executeGameAction(roomId: string, action: string, playerId: string, data?: any): {
        success: boolean;
        error?: string;
        result?: any;
    };
    getGameSnapshot(roomId: string): {
        success: boolean;
        snapshot?: any;
        error?: string;
    };
    getSystemStats(): {
        rooms: any;
        players: any;
        games: any;
    };
    cleanup(): {
        cleanedPlayers: number;
        cleanedRooms: number;
    };
    healthCheck(): {
        healthy: boolean;
        services: {
            [key: string]: boolean;
        };
        details: any;
    };
}
export declare const gameFacade: GameFacade;
//# sourceMappingURL=gameFacade.d.ts.map