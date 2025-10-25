import { GameRoom } from '../../types';
export declare class DefaultRoomConfig {
    private static readonly DEFAULT_ROOM_COUNT;
    private static readonly DEFAULT_MAX_PLAYERS;
    private static readonly ROOM_ID_PREFIX;
    static getDefaultRoomCount(): number;
    static getDefaultMaxPlayers(): number;
    static generateRoomId(index: number): string;
    static generateRoomName(roomId: string): string;
    static createDefaultRoomTemplate(roomId: string): Partial<GameRoom>;
    static getDefaultRoomConfigs(): Array<{
        id: string;
        config: Partial<GameRoom>;
    }>;
    static isDefaultRoom(roomId: string): boolean;
    static parseRoomNumber(roomId: string): number | null;
    static getRoomConfig(roomId: string, overrides?: Partial<GameRoom>): GameRoom;
}
//# sourceMappingURL=defaultRooms.d.ts.map