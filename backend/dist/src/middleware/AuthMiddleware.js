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
        this.log(types_1.LogLevel.INFO, 'class AuthMiddleware initialized');
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
            this.log(types_1.LogLevel.INFO, '（1）- Processing auth from connection', {
                socketId: socket.id,
                authData: auth
            });
            let result;
            if (auth.userId) {
                result = await this.authenticateByUserId(auth.userId, socket.id, auth.htmlName);
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
                this.log(types_1.LogLevel.INFO, '(3) - User authenticated from connection successfully', {
                    userId: result.user.name,
                    socketId: socket.id
                });
                this.emitUserAuthenticatedEvent(result.user, result.sessionId, socket);
            }
            else {
                this.log(types_1.LogLevel.WARN, 'Authentication from connection failed', {
                    socketId: socket.id,
                    error: result.error
                });
                socket.emit('auth_failed', {
                    message: result.error || '认证失败，请重试'
                });
                socket.disconnect(true);
            }
        }
        catch (error) {
            this.log(types_1.LogLevel.ERROR, 'Auth from connection error', {
                error,
                socketId: socket.id
            });
        }
    }
    handleDisconnection(socket) {
        this.log(types_1.LogLevel.INFO, 'Socket disconnected', {
            socketId: socket.id,
            userId: socket.userId
        });
        if (socket.userId) {
            this.userManager.setUserOffline(socket.userId);
            this.log(types_1.LogLevel.INFO, 'User set offline', {
                userId: socket.userId
            });
            this.emitUserDisconnectedEvent(socket.userId, socket.sessionId);
        }
    }
    handleSocketError(socket, error) {
        this.log(types_1.LogLevel.ERROR, 'Socket error', {
            error: error.message,
            socketId: socket.id,
            userId: socket.userId
        });
    }
    async authenticateByUserId(userId, socketId, htmlName) {
        try {
            const user = this.userManager.authenticateUser(userId, socketId, htmlName);
            return { success: true, user };
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
        try {
            const { EventBus } = require('../core/EventBus');
            const eventBus = EventBus.getInstance();
            eventBus.publish('user:disconnected', {
                userId,
                sessionId,
                timestamp: new Date()
            });
        }
        catch (error) {
            this.log(types_1.LogLevel.WARN, 'Failed to publish user disconnected event', { error });
        }
    }
}
exports.AuthMiddleware = AuthMiddleware;
//# sourceMappingURL=AuthMiddleware.js.map