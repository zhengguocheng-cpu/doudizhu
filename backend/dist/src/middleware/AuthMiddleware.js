"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
const types_1 = require("../types");
const BaseService_1 = require("../core/BaseService");
class AuthMiddleware extends BaseService_1.BaseService {
    constructor() {
        super();
    }
    async onInitialize() {
        this.userManager = this.getService('UserManager');
        this.sessionManager = this.getService('SessionManager');
        this.log(types_1.LogLevel.INFO, 'AuthMiddleware initialized');
    }
    async onDestroy() {
        this.log(types_1.LogLevel.INFO, 'AuthMiddleware destroyed');
    }
    authenticateSocket(socket, next) {
        try {
            if (socket.handshake.auth && (socket.handshake.auth.userName || socket.handshake.auth.userId)) {
                this.handleAuthFromConnection(socket, socket.handshake.auth);
            }
            socket.on('error', (error) => {
                this.handleSocketError(socket, error);
            });
            socket.on('disconnect', () => {
                this.handleDisconnection(socket);
            });
            this.log(types_1.LogLevel.INFO, 'Socket authentication middleware setup', {
                socketId: socket.id,
                authData: socket.handshake.auth
            });
            next();
        }
        catch (error) {
            this.log(types_1.LogLevel.ERROR, 'Socket authentication middleware failed', { error });
            next(error);
        }
    }
    async handleAuthFromConnection(socket, auth) {
        try {
            this.log(types_1.LogLevel.INFO, 'Processing auth from connection', {
                socketId: socket.id,
                authData: auth
            });
            let result;
            if (auth.userId) {
                result = await this.authenticateByUserId(auth.userId, socket.id);
            }
            else {
                this.log(types_1.LogLevel.WARN, 'No valid auth data in connection', { socketId: socket.id });
                return;
            }
            if (result.success && result.user) {
                socket.userId = result.user.name;
                socket.userName = result.user.name;
                socket.sessionId = result.sessionId;
                socket.authenticated = true;
                socket.user = result.user;
                await this.userManager.updateUserConnection(result.user.name, socket.id);
                this.log(types_1.LogLevel.INFO, 'User authenticated from connection successfully', {
                    userId: result.user.name,
                    socketId: socket.id
                });
                if (result.sessionId) {
                    this.emitUserAuthenticatedEvent(result.user, result.sessionId, socket);
                }
            }
            else {
                this.log(types_1.LogLevel.WARN, 'Authentication from connection failed', {
                    socketId: socket.id,
                    error: result.error
                });
            }
        }
        catch (error) {
            this.log(types_1.LogLevel.ERROR, 'Auth from connection error', {
                error,
                socketId: socket.id
            });
        }
    }
    async handleAuthentication(socket, data) {
    }
    async handleReconnection(socket, data) {
    }
    handleDisconnection(socket) {
        this.log(types_1.LogLevel.INFO, 'Socket disconnected', {
            socketId: socket.id
        });
    }
    handleSocketError(socket, error) {
        this.log(types_1.LogLevel.ERROR, 'Socket error', {
            error: error.message,
            socketId: socket.id,
            userId: socket.userId
        });
    }
    async authenticateUser(data) {
        return { success: true };
    }
    async authenticateBySession(sessionId, socketId) {
        return { success: true };
    }
    async authenticateByUserName(userName, socketId) {
        try {
            let user = this.userManager.findUserByName(userName);
            if (!user) {
                user = this.userManager.createUser(userName);
                console.log(`新用户自动注册: ${userName}, ID: ${userName}`);
            }
            else {
                this.userManager.updateUserConnection(userName, socketId);
                console.log(`用户重连: ${userName}, ID: ${userName}`);
            }
            const sessionId = this.sessionManager.createUserSession(user, socketId);
            return { success: true, user, sessionId };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '认证失败'
            };
        }
    }
    async authenticateByUserId(userId, socketId) {
        try {
            let user = this.userManager.getUserById(userId);
            if (!user) {
                user = this.userManager.createUser(userId);
                console.log(`新用户自动注册: ${userId}, ID: ${userId}`);
            }
            else {
                this.userManager.updateUserConnection(userId, socketId);
                console.log(`用户重连: ${userId}, ID: ${userId}`);
            }
            const sessionId = this.sessionManager.createUserSession(user, socketId);
            return { success: true, user, sessionId };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '认证失败'
            };
        }
    }
    emitUserAuthenticatedEvent(user, sessionId, socket) {
        this.log(types_1.LogLevel.INFO, 'User authenticated event emitted', { userId: user.name });
    }
    emitUserDisconnectedEvent(userId, sessionId) {
        this.log(types_1.LogLevel.INFO, 'User disconnected event emitted', { userId });
    }
    requireAuth(handler) {
        return handler;
    }
    requirePermission(permission) {
        return (handler) => handler;
    }
}
exports.AuthMiddleware = AuthMiddleware;
//# sourceMappingURL=AuthMiddleware.js.map