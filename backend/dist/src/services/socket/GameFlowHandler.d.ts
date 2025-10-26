export declare class GameFlowHandler {
    private static instance;
    private io;
    private constructor();
    static getInstance(): GameFlowHandler;
    initialize(io: any): void;
    startGame(roomId: string): void;
    private dealCards;
    private sortCards;
    private findSocketIdByUserId;
}
export declare const gameFlowHandler: GameFlowHandler;
//# sourceMappingURL=GameFlowHandler.d.ts.map