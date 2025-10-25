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
    private handleAuthentication;
    private handleReconnection;
    private handleDisconnection;
    private handleSocketError;
    private authenticateUser;
    private authenticateBySession;
    private authenticateByUserName;
    private authenticateByUserId;
    private emitUserAuthenticatedEvent;
    private emitUserDisconnectedEvent;
    requireAuth(handler: Function): Function;
    requirePermission(permission: string): Function;
}
//# sourceMappingURL=AuthMiddleware.d.ts.map