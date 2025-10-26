import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
export declare class Application {
    private app;
    private server;
    private io;
    private userManager;
    private sessionManager;
    private stateRecovery;
    private authMiddleware;
    private eventHandler;
    private container;
    private initialized;
    constructor();
    private initialize;
    private setupMiddleware;
    private setupRoutes;
    private setupSocketIO;
    private setupSocketEventHandlers;
    private handleStartGame;
    broadcastRoomsUpdate(eventType: string, roomId: string, data?: any): void;
    private startGame;
    private createDeck;
    private shuffleDeck;
    private startPlaying;
    private validateCards;
    private getNextPlayer;
    private updateGameState;
    private endGame;
    private initializeServices;
    private setupCleanupTasks;
    start(): Promise<void>;
    getApp(): express.Application;
    getServer(): any;
    getIO(): SocketIOServer;
}
export default Application;
//# sourceMappingURL=app.d.ts.map