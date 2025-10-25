import { Player, GameRoom } from '../../types';
import { BaseService } from '../../core/BaseService';
export declare class PlayerService extends BaseService {
    private playerManager;
    constructor();
    protected onInitialize(): Promise<void>;
    protected onDestroy(): Promise<void>;
    createPlayer(name: string): Player;
    addPlayerToRoom(room: GameRoom, playerName: string): Player;
    removePlayerFromRoom(room: GameRoom, playerId: string): boolean;
    togglePlayerReady(room: GameRoom, playerId: string): boolean;
    setPlayerCards(player: Player, cards: string[]): void;
    updatePlayerCards(player: Player, remainingCards: string[]): void;
    setLandlord(room: GameRoom, playerId: string): boolean;
    getRoomPlayers(room: GameRoom): Player[];
    getPlayer(room: GameRoom, playerId: string): Player | undefined;
    validatePlayerOperation(room: GameRoom, playerId: string, operation: string): {
        valid: boolean;
        error?: string;
    };
    isPlayerReady(room: GameRoom, playerId: string): boolean;
    areAllPlayersReady(room: GameRoom): boolean;
    isPlayerLandlord(room: GameRoom, playerId: string): boolean;
    isPlayerCurrentTurn(room: GameRoom, playerId: string): boolean;
    getPlayerStatusDescription(room: GameRoom, playerId: string): string;
    validatePlayerCards(playerCards: string[] | undefined, playedCards: string[]): {
        valid: boolean;
        error?: string;
    };
    cleanupOfflineSessions(): number;
    getPlayerStats(): {
        sessions: {
            total: number;
            online: number;
            offline: number;
        };
    };
}
export declare function getPlayerService(): PlayerService;
//# sourceMappingURL=playerService.d.ts.map