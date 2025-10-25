import { Socket } from 'socket.io';
import { BaseService } from '../core/BaseService';
export interface AuthenticatedSocket extends Socket {
    userId?: string;
    userName?: string;
    sessionId?: string;
    authenticated?: boolean;
    user?: any;
}
export interface AuthResult {
    success: boolean;
    user?: any;
    sessionId?: string;
    error?: string;
}
export declare class AuthMiddleware extends BaseService {
    private userManager;
    private sessionManager;
    constructor();
    protected onInitialize(): Promise<void>;
    protected onDestroy(): Promise<void>;
    authenticateSocket(socket: AuthenticatedSocket, next: Function): void;
    private handleAuthFromConnection;
    private handleDisconnection;
    private handleSocketError;
    private authenticateByUserId;
    private emitUserAuthenticatedEvent;
    private emitUserDisconnectedEvent;
}
//# sourceMappingURL=AuthMiddleware.d.ts.map