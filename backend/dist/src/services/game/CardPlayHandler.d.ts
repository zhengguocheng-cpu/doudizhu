import { Server } from 'socket.io';
export declare class CardPlayHandler {
    private io;
    constructor(io: Server);
    handlePlayCards(roomId: string, userId: string, cards: string[]): void;
    handlePass(roomId: string, userId: string): void;
    private checkGameOver;
    private nextPlayer;
    private startNewRound;
    private findSocketIdByUserId;
}
//# sourceMappingURL=CardPlayHandler.d.ts.map