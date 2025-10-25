import { Player, GameRoom } from '../../types';
import { BaseService } from '../../core/BaseService';
export declare class PlayerManager extends BaseService {
    private playerSession;
    constructor();
    protected onInitialize(): Promise<void>;
    protected onDestroy(): Promise<void>;
    createPlayer(name: string): Player;
    addPlayerToRoom(room: GameRoom, playerName: string): Player;
    removePlayerFromRoom(room: GameRoom, playerId: string): boolean;
    togglePlayerReady(room: GameRoom, playerId: string): boolean;
    setPlayerCards(player: Player, cards: string[]): void;
    updatePlayerCards(player: Player, remainingCards: string[]): void;
    resetPlayerState(player: Player): void;
    private resetRoomForNewGame;
    getRoomPlayers(room: GameRoom): Player[];
    getPlayer(room: GameRoom, playerId: string): Player | undefined;
    getPlayerPosition(room: GameRoom, playerId: string): number;
    isPlayerReady(room: GameRoom, playerId: string): boolean;
    areAllPlayersReady(room: GameRoom): boolean;
    isPlayerLandlord(room: GameRoom, playerId: string): boolean;
    isPlayerCurrentTurn(room: GameRoom, playerId: string): boolean;
    setLandlord(room: GameRoom, playerId: string): boolean;
    validatePlayPermission(room: GameRoom, playerId: string): {
        valid: boolean;
        error?: string;
    };
    validateGrabLandlordPermission(room: GameRoom, playerId: string): {
        valid: boolean;
        error?: string;
    };
    validatePassPermission(room: GameRoom, playerId: string): {
        valid: boolean;
        error?: string;
    };
    getPlayerStatusDescription(room: GameRoom, playerId: string): string;
    cleanupOfflineSessions(): number;
    getPlayerStats(): {
        sessions: {
            total: number;
            online: number;
            offline: number;
        };
    };
}
//# sourceMappingURL=playerManager.d.ts.map