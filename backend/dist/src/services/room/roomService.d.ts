import { GameRoom, Player } from '../../types';
export declare class RoomService {
    private roomManager;
    constructor();
    createRoom(name: string, maxPlayers?: number): GameRoom;
    getRoom(roomId: string): GameRoom | undefined;
    getAllRooms(): GameRoom[];
    joinRoom(roomId: string, playerName: string, playerAvatar?: string): Player;
    addExistingUserToRoom(roomId: string, user: Player): Player;
    leaveRoom(roomId: string, playerId: string): boolean;
    togglePlayerReady(roomId: string, playerId: string): boolean;
    startGame(roomId: string): boolean;
    endGame(roomId: string, winner?: Player): boolean;
    resetRoom(roomId: string): boolean;
    deleteRoom(roomId: string): boolean;
    validateRoomOperation(roomId: string, operation: string): {
        valid: boolean;
        error?: string;
    };
    getRoomStats(): {
        total: number;
        waiting: number;
        playing: number;
        finished: number;
        empty: number;
        full: number;
    };
    isDefaultRoom(roomId: string): boolean;
    findUserByName(userName: string): Player | undefined;
    saveGameState(roomId: string, gameState: any): void;
    getGameState(roomId: string): any | undefined;
    clearGameState(roomId: string): void;
}
export declare const roomService: RoomService;
//# sourceMappingURL=roomService.d.ts.map