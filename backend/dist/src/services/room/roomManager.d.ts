import { GameRoom, Player } from '../../types';
export declare class RoomManager {
    private rooms;
    constructor();
    createRoom(name: string, maxPlayers?: number): GameRoom;
    getRoom(roomId: string): GameRoom | undefined;
    getAllRooms(): GameRoom[];
    joinRoom(roomId: string, playerName: string, playerAvatar?: string): Player;
    addExistingUserToRoom(roomId: string, user: Player): Player;
    leaveRoom(roomId: string, playerId: string): boolean;
    togglePlayerReady(roomId: string, playerId: string): boolean;
    canStartGame(roomId: string): boolean;
    startGame(roomId: string): boolean;
    endGame(roomId: string, winner?: Player): boolean;
    resetRoom(roomId: string): boolean;
    deleteRoom(roomId: string): boolean;
    private initializeDefaultRooms;
    getRoomStats(): {
        total: number;
        waiting: number;
        playing: number;
        finished: number;
        empty: number;
        full: number;
    };
    private getPlayerAvatarIndex;
}
//# sourceMappingURL=roomManager.d.ts.map