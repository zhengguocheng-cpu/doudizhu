import { CardPlayHandler } from '../game/CardPlayHandler';
export declare class GameFlowHandler {
    private static instance;
    private io;
    private cardPlayHandler;
    private constructor();
    static getInstance(): GameFlowHandler;
    initialize(io: any): void;
    private saveGameState;
    private getGameState;
    getCardPlayHandler(): CardPlayHandler | null;
    startGame(roomId: string): void;
    private startBidding;
    handleBidLandlord(roomId: string, userId: string, bid: boolean): void;
    private determineLandlord;
    private dealCards;
    private sortCards;
    private findSocketIdByUserId;
}
export declare const gameFlowHandler: GameFlowHandler;
//# sourceMappingURL=GameFlowHandler.d.ts.map