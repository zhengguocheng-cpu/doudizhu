import { Socket } from 'socket.io';
export interface AuthenticatedSocket extends Socket {
    userId?: string;
    userName?: string;
    sessionId?: string;
    authenticated?: boolean;
    user?: any;
}
export declare class SocketEventHandler {
    private static instance;
    private eventBus;
    private gameRoomsService;
    private io;
    constructor();
    static getInstance(): SocketEventHandler;
    initialize(io: any): void;
    handleGetRoomsList(socket: AuthenticatedSocket, data: any): Promise<void>;
    handleGetRoomState(socket: AuthenticatedSocket, data: any): Promise<void>;
    handleJoinGame(socket: AuthenticatedSocket, data: any): Promise<void>;
    handleLeaveGame(socket: AuthenticatedSocket, data: any): Promise<void>;
    handlePlayerReady(socket: AuthenticatedSocket, data: any): Promise<void>;
    handleBidLandlord(socket: AuthenticatedSocket, data: any): Promise<void>;
    handlePlayCards(socket: AuthenticatedSocket, data: any): Promise<void>;
    handlePassTurn(socket: AuthenticatedSocket, data: any): Promise<void>;
    handleSendMessage(socket: AuthenticatedSocket, data: any): Promise<void>;
    private validateAuthentication;
    private getNextPlayer;
    broadcastRoomsUpdate(eventType: string, roomId: string, data?: any): void;
}
export declare const socketEventHandler: SocketEventHandler;
//# sourceMappingURL=SocketEventHandler.d.ts.map