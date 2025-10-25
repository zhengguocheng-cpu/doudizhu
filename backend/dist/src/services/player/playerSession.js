"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerSession = void 0;
const uuid_1 = require("uuid");
class PlayerSession {
    constructor() {
        this.sessions = new Map();
    }
    createSession(player, socketId) {
        const sessionId = (0, uuid_1.v4)();
        const session = {
            player,
            socketId,
            connectedAt: new Date(),
            lastActivity: new Date(),
            isOnline: true
        };
        this.sessions.set(sessionId, session);
        return sessionId;
    }
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    updateActivity(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastActivity = new Date();
            return true;
        }
        return false;
    }
    setOnlineStatus(sessionId, isOnline) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.isOnline = isOnline;
            return true;
        }
        return false;
    }
    destroySession(sessionId) {
        return this.sessions.delete(sessionId);
    }
    findSessionBySocketId(socketId) {
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.socketId === socketId && session.isOnline) {
                return {
                    sessionId,
                    player: session.player
                };
            }
        }
        return undefined;
    }
    findSessionByUserId(userId) {
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.player.id === userId && session.isOnline) {
                return {
                    sessionId,
                    player: session.player
                };
            }
        }
        return undefined;
    }
    createUserSession(user, socketId) {
        const existingSession = this.findSessionByUserId(user.id);
        if (existingSession) {
            this.setOnlineStatus(existingSession.sessionId, false);
            console.log(`断开用户 ${user.name} 的旧连接`);
        }
        const sessionId = this.createSession(user, socketId);
        this.setOnlineStatus(sessionId, true);
        return sessionId;
    }
    updateSocketId(sessionId, newSocketId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.socketId = newSocketId;
            session.lastActivity = new Date();
            return true;
        }
        return false;
    }
    reconnectUser(userId, newSocketId) {
        const session = this.findSessionByUserId(userId);
        if (session) {
            this.updateSocketId(session.sessionId, newSocketId);
            this.setOnlineStatus(session.sessionId, true);
            return true;
        }
        return false;
    }
    findSessionBySocketIdIncludingOffline(socketId) {
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.socketId === socketId) {
                return {
                    sessionId,
                    player: session.player
                };
            }
        }
        return undefined;
    }
    cleanupOfflineSessions() {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        let cleanedCount = 0;
        for (const [sessionId, session] of this.sessions.entries()) {
            if (!session.isOnline && session.lastActivity < thirtyMinutesAgo) {
                this.sessions.delete(sessionId);
                cleanedCount++;
            }
        }
        return cleanedCount;
    }
    getSessionStats() {
        const sessions = Array.from(this.sessions.values());
        return {
            total: sessions.length,
            online: sessions.filter(s => s.isOnline).length,
            offline: sessions.filter(s => !s.isOnline).length
        };
    }
}
exports.PlayerSession = PlayerSession;
//# sourceMappingURL=playerSession.js.map