import { Player } from '../../types';
import { PlayerSession } from '../player/playerSession';
export declare class UserManager {
    private users;
    private sessionManager;
    constructor(sessionManager: PlayerSession);
    authenticateUser(userName: string, socketId: string, htmlName?: string): Player;
    createUser(userName: string): Player;
    findUserByName(userName: string): Player | undefined;
    getUserById(userId: string): Player | undefined;
    updateUserConnection(userName: string, socketId: string): boolean;
    setUserOffline(userName: string): boolean;
    getOnlineUsers(): Player[];
    getAllUsers(): Player[];
    deleteUser(userId: string): boolean;
    getUserStats(): {
        total: number;
        online: number;
        offline: number;
    };
    cleanupOfflineUsers(maxOfflineMinutes?: number): number;
}
export declare function createUserManager(sessionManager: PlayerSession): UserManager;
export declare function getUserManager(): UserManager;
//# sourceMappingURL=userManager.d.ts.map