import { Player } from '../../types';
export declare class PlayerSession {
    private sessions;
    createSession(player: Player, socketId: string): string;
    getSession(sessionId: string): {
        player: Player;
        socketId: string;
        connectedAt: Date;
        lastActivity: Date;
        isOnline: boolean;
    } | undefined;
    updateActivity(sessionId: string): boolean;
    setOnlineStatus(sessionId: string, isOnline: boolean): boolean;
    destroySession(sessionId: string): boolean;
    findSessionBySocketId(socketId: string): {
        sessionId: string;
        player: Player;
    } | undefined;
    findSessionByUserId(userId: string): {
        sessionId: string;
        player: Player;
    } | undefined;
    createUserSession(user: Player, socketId: string): string;
    updateSocketId(sessionId: string, newSocketId: string): boolean;
    reconnectUser(userId: string, newSocketId: string): boolean;
    findSessionBySocketIdIncludingOffline(socketId: string): {
        sessionId: string;
        player: Player;
    } | undefined;
    cleanupOfflineSessions(): number;
    getSessionStats(): {
        total: number;
        online: number;
        offline: number;
    };
}
//# sourceMappingURL=playerSession.d.ts.map