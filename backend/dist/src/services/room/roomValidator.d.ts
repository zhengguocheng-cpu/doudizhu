import { GameRoom } from '../../types';
export declare class RoomValidator {
    static validateRoomExists(room: GameRoom | undefined): boolean;
    static validateRoomJoinable(room: GameRoom): {
        valid: boolean;
        error?: string;
    };
    static validatePlayerReady(room: GameRoom, playerId: string): {
        valid: boolean;
        error?: string;
    };
    static validateGameStartConditions(room: GameRoom): {
        valid: boolean;
        error?: string;
    };
    static validatePlayerLeave(room: GameRoom, playerId: string): {
        valid: boolean;
        error?: string;
    };
    static validateRoomParams(name: string, maxPlayers: number): {
        valid: boolean;
        error?: string;
    };
    static isRoomEmpty(room: GameRoom): boolean;
    static isRoomFull(room: GameRoom): boolean;
    static getRoomStatusDescription(room: GameRoom): string;
}
//# sourceMappingURL=roomValidator.d.ts.map