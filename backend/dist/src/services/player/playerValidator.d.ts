import { Player, GameRoom } from '../../types';
export declare class PlayerValidator {
    static validatePlayerExists(player: Player | undefined): boolean;
    static validatePlayerInRoom(room: GameRoom, playerId: string): {
        valid: boolean;
        error?: string;
    };
    static validatePlayerCanReady(room: GameRoom, playerId: string): {
        valid: boolean;
        error?: string;
    };
    static validatePlayerCanLeave(room: GameRoom, playerId: string): {
        valid: boolean;
        error?: string;
    };
    static validatePlayerCanPlay(room: GameRoom, playerId: string): {
        valid: boolean;
        error?: string;
    };
    static validatePlayerCanGrabLandlord(room: GameRoom, playerId: string): {
        valid: boolean;
        error?: string;
    };
    static validatePlayerCanPass(room: GameRoom, playerId: string): {
        valid: boolean;
        error?: string;
    };
    static validatePlayerName(name: string): {
        valid: boolean;
        error?: string;
    };
    static validatePlayerCards(playerCards: string[] | undefined, playedCards: string[]): {
        valid: boolean;
        error?: string;
    };
    static isPlayerReady(player: Player): boolean;
    static isPlayerLandlord(room: GameRoom, playerId: string): boolean;
    static isPlayerCurrentTurn(room: GameRoom, playerId: string): boolean;
    static getPlayerPosition(room: GameRoom, playerId: string): number;
    static getPlayerStatusDescription(player: Player, isCurrentTurn?: boolean): string;
}
//# sourceMappingURL=playerValidator.d.ts.map