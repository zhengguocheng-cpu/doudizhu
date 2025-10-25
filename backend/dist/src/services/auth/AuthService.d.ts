import { BaseService } from '../../core/BaseService';
import { Player } from '../../types/player';
import { UserSession, AuthResponse } from '../../types';
export declare class AuthService extends BaseService {
    private static _instance;
    private userManager;
    private sessionManager;
    private eventBus;
    private constructor();
    static getInstance(): AuthService;
    protected onInitialize(): Promise<void>;
    protected onDestroy(): Promise<void>;
    private setupEventHandlers;
    private handleSocketDisconnected;
    private findUserBySocketId;
    authenticate(data: {
        userName: string;
    }): Promise<AuthResponse>;
    authenticateBySession(sessionId: string, socketId: string): Promise<AuthResponse>;
    authenticateByUserName(userName: string, socketId: string): Promise<AuthResponse>;
    validatePermission(userId: string, requiredPermission: string): boolean;
    getUserStats(): any;
    getOnlineUsers(): Player[];
    getAllUsers(): Player[];
    deleteUser(userId: string): boolean;
    cleanupExpiredUsers(maxOfflineMinutes?: number): number;
    getUserSession(userId: string): UserSession | undefined;
    validateSession(sessionId: string): boolean;
    logout(userId: string, sessionId?: string): Promise<void>;
}
export declare function getAuthService(): AuthService;
//# sourceMappingURL=AuthService.d.ts.map