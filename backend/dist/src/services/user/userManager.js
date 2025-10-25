"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserManager = void 0;
exports.createUserManager = createUserManager;
exports.getUserManager = getUserManager;
class UserManager {
    constructor(sessionManager) {
        this.users = new Map();
        this.sessionManager = sessionManager;
    }
    authenticateUser(userName, socketId) {
        const trimmedUserName = userName.trim();
        let user = this.findUserByName(trimmedUserName);
        if (!user) {
            user = this.createUser(trimmedUserName);
            console.log(`新用户注册: ${trimmedUserName}, ID: ${trimmedUserName}`);
        }
        else {
            this.updateUserConnection(trimmedUserName, socketId);
            console.log(`用户重连: ${trimmedUserName}, ID: ${trimmedUserName}`);
        }
        return user;
    }
    createUser(userName) {
        if (!userName || userName.trim().length === 0) {
            throw new Error('用户名不能为空');
        }
        if (userName.length > 20) {
            throw new Error('用户名不能超过20个字符');
        }
        const trimmedUserName = userName.trim();
        const existingUser = this.findUserByName(trimmedUserName);
        if (existingUser) {
            throw new Error('用户名已存在');
        }
        const player = {
            id: trimmedUserName,
            name: trimmedUserName,
            ready: false,
            cards: [],
            cardCount: 0,
            socketId: '',
            userId: trimmedUserName,
            createdAt: new Date(),
            lastLoginAt: new Date(),
            isOnline: false
        };
        this.users.set(trimmedUserName, player);
        return player;
    }
    findUserByName(userName) {
        return this.users.get(userName.trim());
    }
    getUserById(userId) {
        return this.users.get(userId);
    }
    updateUserConnection(userName, socketId) {
        const user = this.users.get(userName);
        if (user) {
            user.socketId = socketId;
            user.lastLoginAt = new Date();
            user.isOnline = true;
            return true;
        }
        return false;
    }
    setUserOffline(userName) {
        const user = this.users.get(userName);
        if (user) {
            user.isOnline = false;
            user.socketId = '';
            return true;
        }
        return false;
    }
    getOnlineUsers() {
        return Array.from(this.users.values()).filter(user => user.isOnline);
    }
    getAllUsers() {
        return Array.from(this.users.values());
    }
    deleteUser(userId) {
        const user = this.users.get(userId);
        if (user) {
            this.sessionManager.destroySession(userId);
            this.users.delete(userId);
            return true;
        }
        return false;
    }
    getUserStats() {
        const users = Array.from(this.users.values());
        return {
            total: users.length,
            online: users.filter(u => u.isOnline).length,
            offline: users.filter(u => !u.isOnline).length
        };
    }
    cleanupOfflineUsers(maxOfflineMinutes = 60) {
        const cutoffTime = new Date(Date.now() - maxOfflineMinutes * 60 * 1000);
        let cleanedCount = 0;
        for (const [userId, user] of this.users.entries()) {
            if (!user.isOnline && user.lastLoginAt && user.lastLoginAt < cutoffTime) {
                this.deleteUser(userId);
                cleanedCount++;
            }
        }
        return cleanedCount;
    }
}
exports.UserManager = UserManager;
let userManagerInstance = null;
function createUserManager(sessionManager) {
    if (!userManagerInstance) {
        userManagerInstance = new UserManager(sessionManager);
    }
    return userManagerInstance;
}
function getUserManager() {
    if (!userManagerInstance) {
        throw new Error('UserManager未初始化，请先调用createUserManager');
    }
    return userManagerInstance;
}
//# sourceMappingURL=userManager.js.map