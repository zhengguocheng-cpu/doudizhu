"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
exports.getAuthService = getAuthService;
const BaseService_1 = require("../../core/BaseService");
const EventBus_1 = require("../../core/EventBus");
const types_1 = require("../../types");
const userManager_1 = require("../user/userManager");
class AuthService extends BaseService_1.BaseService {
    constructor() {
        super();
    }
    static getInstance() {
        if (!AuthService._instance) {
            AuthService._instance = new AuthService();
        }
        return AuthService._instance;
    }
    async onInitialize() {
        this.sessionManager = this.getService('SessionManager');
        this.userManager = (0, userManager_1.createUserManager)(this.sessionManager);
        this.eventBus = EventBus_1.EventBus.getInstance();
        this.setupEventHandlers();
        this.log(types_1.LogLevel.INFO, 'class AuthService initialized');
    }
    async onDestroy() {
        this.log(types_1.LogLevel.INFO, 'AuthService destroyed');
    }
    setupEventHandlers() {
        this.eventBus.subscribe('socket:disconnected', (event) => {
            this.handleSocketDisconnected(event);
        });
    }
    handleSocketDisconnected(event) {
        const { socketId } = event;
        const user = this.findUserBySocketId(socketId);
        if (user) {
            this.userManager.setUserOffline(user.id);
            this.log(types_1.LogLevel.INFO, 'User set offline due to socket disconnect', {
                userId: user.id,
                socketId
            });
        }
    }
    findUserBySocketId(socketId) {
        return this.userManager.getAllUsers().find((user) => user.socketId === socketId);
    }
    async authenticate(data) {
        try {
            const { userName } = data;
            if (!userName || userName.trim().length === 0) {
                return {
                    success: false,
                    error: '用户名不能为空'
                };
            }
            const user = this.userManager.authenticateUser(userName, '');
            const sessionId = this.sessionManager.createUserSession(user, '');
            this.log(types_1.LogLevel.INFO, 'User authenticated successfully', {
                userId: user.id,
                userName: user.name,
                sessionId
            });
            this.eventBus.emit('user:authenticated', {
                userId: user.id,
                userName: user.name,
                sessionId
            });
            return {
                success: true,
                userId: user.id,
                userName: user.name,
                sessionId
            };
        }
        catch (error) {
            this.log(types_1.LogLevel.ERROR, 'Authentication failed', { error });
            return {
                success: false,
                error: error instanceof Error ? error.message : '认证失败'
            };
        }
    }
    async authenticateBySession(sessionId, socketId) {
        try {
            const session = this.sessionManager.getSession(sessionId);
            if (!session || !session.player) {
                return {
                    success: false,
                    error: '会话不存在或已过期'
                };
            }
            this.userManager.updateUserConnection(session.player.name, socketId);
            this.sessionManager.updateSocketId(sessionId, socketId);
            this.sessionManager.setOnlineStatus(sessionId, true);
            this.log(types_1.LogLevel.INFO, 'User re-authenticated by session', {
                userId: session.player.name,
                sessionId,
                socketId
            });
            return {
                success: true,
                userId: session.player.name,
                userName: session.player.name,
                sessionId
            };
        }
        catch (error) {
            this.log(types_1.LogLevel.ERROR, 'Session authentication failed', { sessionId, error });
            return {
                success: false,
                error: error instanceof Error ? error.message : '会话认证失败'
            };
        }
    }
    async authenticateByUserName(userName, socketId) {
        try {
            const user = this.userManager.findUserByName(userName);
            if (!user) {
                return {
                    success: false,
                    error: '用户不存在，请重新登录'
                };
            }
            this.userManager.updateUserConnection(user.name, socketId);
            const reconnectSuccess = this.sessionManager.reconnectUser(user.name, socketId);
            let sessionId;
            if (reconnectSuccess) {
                const session = this.sessionManager.findSessionByUserId(user.name);
                sessionId = session?.sessionId || '';
            }
            else {
                sessionId = this.sessionManager.createUserSession(user, socketId);
            }
            this.log(types_1.LogLevel.INFO, 'User re-authenticated by username', {
                userId: user.name,
                userName: user.name,
                socketId
            });
            return {
                success: true,
                userId: user.name,
                userName: user.name,
                sessionId
            };
        }
        catch (error) {
            this.log(types_1.LogLevel.ERROR, 'Username authentication failed', { userName, error });
            return {
                success: false,
                error: error instanceof Error ? error.message : '用户名认证失败'
            };
        }
    }
    validatePermission(userId, requiredPermission) {
        const user = this.userManager.getUserById(userId);
        return user !== undefined;
    }
    getUserStats() {
        return this.userManager.getUserStats();
    }
    getOnlineUsers() {
        return this.userManager.getOnlineUsers();
    }
    getAllUsers() {
        return this.userManager.getAllUsers();
    }
    deleteUser(userId) {
        const result = this.userManager.deleteUser(userId);
        if (result) {
            this.log(types_1.LogLevel.INFO, 'User deleted', { userId });
        }
        return result;
    }
    cleanupExpiredUsers(maxOfflineMinutes = 60) {
        const cleanedCount = this.userManager.cleanupOfflineUsers(maxOfflineMinutes);
        if (cleanedCount > 0) {
            this.log(types_1.LogLevel.INFO, 'Expired users cleaned up', { count: cleanedCount });
        }
        return cleanedCount;
    }
    getUserSession(userId) {
        const sessionInfo = this.sessionManager.findSessionByUserId(userId);
        if (sessionInfo) {
            const fullSession = this.sessionManager.getSession(sessionInfo.sessionId);
            if (fullSession) {
                return {
                    sessionId: sessionInfo.sessionId,
                    userId: sessionInfo.player.id,
                    socketId: fullSession.socketId,
                    connectedAt: fullSession.connectedAt,
                    lastActivity: fullSession.lastActivity,
                    isOnline: fullSession.isOnline
                };
            }
        }
        return undefined;
    }
    validateSession(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        return session !== undefined && session.player !== undefined;
    }
    async logout(userId, sessionId) {
        try {
            this.userManager.setUserOffline(userId);
            if (sessionId) {
                this.sessionManager.destroySession(sessionId);
            }
            this.log(types_1.LogLevel.INFO, 'User logged out', { userId, sessionId });
            this.eventBus.emit('user:logged_out', {
                userId,
                sessionId,
                timestamp: new Date()
            });
        }
        catch (error) {
            this.log(types_1.LogLevel.ERROR, 'Logout failed', { userId, sessionId, error });
        }
    }
}
exports.AuthService = AuthService;
let authServiceInstance = null;
function getAuthService() {
    if (!authServiceInstance) {
        authServiceInstance = AuthService.getInstance();
    }
    return authServiceInstance;
}
//# sourceMappingURL=AuthService.js.map