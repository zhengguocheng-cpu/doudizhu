import { Player } from '../../types/player';
export declare class GameRoomsService {
    private static instance;
    private gameRooms;
    private constructor();
    static getInstance(): GameRoomsService;
    createRoom(roomId: string, createdBy: Player): Promise<{
        success: boolean;
        error?: string;
    }>;
    joinRoom(roomId: string, player: Player): Promise<{
        success: boolean;
        error?: string;
    }>;
    leaveRoom(roomId: string, playerId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    playerReady(roomId: string, playerId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    setGameRoom(roomId: string, roomData: any): void;
    getGameRoom(roomId: string): any;
    deleteGameRoom(roomId: string): void;
    getGameRoomsForAPI(): any[];
    getRoomCount(): number;
    getRoomStats(): any;
}
export declare const gameRoomsService: GameRoomsService;
//# sourceMappingURL=gameRoomsService.d.ts.map