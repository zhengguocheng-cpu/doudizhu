"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMiddleware = void 0;
const types_1 = require("../types");
const BaseService_1 = require("../core/BaseService");
class ErrorMiddleware extends BaseService_1.BaseService {
    constructor() {
        super();
    }
    async onInitialize() {
        this.log(types_1.LogLevel.INFO, 'ErrorMiddleware initialized');
    }
    async onDestroy() {
        this.log(types_1.LogLevel.INFO, 'ErrorMiddleware destroyed');
    }
    handleHttpError(error, req, res, next) {
        const appError = this.normalizeError(error, {
            userId: req.userId,
            sessionId: req.sessionId,
            endpoint: `${req.method} ${req.path}`,
            userAgent: req.get('User-Agent'),
            ip: req.ip
        });
        this.logError(appError);
        this.sendHttpErrorResponse(res, appError);
    }
    handleSocketError(socket, error) {
        const appError = this.normalizeError(error, {
            socketId: socket.id,
            userId: socket.userId,
            sessionId: socket.sessionId
        });
        this.logError(appError);
        this.sendSocketErrorResponse(socket, appError);
    }
    catchAsyncErrors(handler) {
        return async (...args) => {
            try {
                return await handler(...args);
            }
            catch (error) {
                const socket = args[0];
                if (socket && typeof socket.emit === 'function') {
                    this.handleSocketError(socket, error);
                }
                else {
                    const [req, res, next] = args.slice(-3);
                    if (req && res && next) {
                        this.handleHttpError(error, req, res, next);
                    }
                }
            }
        };
    }
    normalizeError(error, context = {}) {
        const appError = {
            code: error.code || this.mapErrorToCode(error),
            message: error.message || '未知错误',
            details: error.details || {},
            timestamp: new Date(),
            ...context
        };
        if (error.statusCode) {
            appError.details.statusCode = error.statusCode;
        }
        else {
            appError.details.statusCode = this.mapErrorToStatusCode(error);
        }
        return appError;
    }
    logError(appError) {
        const logLevel = this.determineLogLevel(appError);
        if (this.logger && typeof this.logger.log === 'function') {
            this.logger.log({
                level: logLevel,
                message: appError.message,
                context: {
                    code: appError.code,
                    userId: appError.userId,
                    sessionId: appError.sessionId
                },
                metadata: appError.details,
                error: new Error(appError.message),
                timestamp: appError.timestamp
            });
        }
        else {
            const levelNames = {
                [types_1.LogLevel.ERROR]: 'ERROR',
                [types_1.LogLevel.WARN]: 'WARN',
                [types_1.LogLevel.INFO]: 'INFO',
                [types_1.LogLevel.DEBUG]: 'DEBUG',
                [types_1.LogLevel.TRACE]: 'TRACE'
            };
            const levelName = levelNames[logLevel] || 'ERROR';
            console.error(`[${appError.timestamp.toISOString()}] ${levelName} [ErrorMiddleware] ${appError.message}`, appError.details);
        }
    }
    sendHttpErrorResponse(res, appError) {
        const statusCode = appError.details?.statusCode || 500;
        const response = {
            success: false,
            error: this.getClientErrorMessage(appError),
            message: this.getClientMessage(appError)
        };
        if (process.env.NODE_ENV === 'development') {
            response.error = appError.message;
            response.message = appError.details?.endpoint || 'API Error';
        }
        res.status(statusCode).json(response);
    }
    sendSocketErrorResponse(socket, appError) {
        socket.emit('error', {
            code: appError.code,
            message: this.getClientErrorMessage(appError),
            timestamp: appError.timestamp
        });
    }
    mapErrorToCode(error) {
        if (error.name === 'ValidationError')
            return 'VALIDATION_ERROR';
        if (error.name === 'UnauthorizedError')
            return 'AUTH_REQUIRED';
        if (error.message.includes('not found'))
            return 'NOT_FOUND';
        if (error.message.includes('timeout'))
            return 'TIMEOUT_ERROR';
        if (error.message.includes('rate limit'))
            return 'RATE_LIMITED';
        return 'INTERNAL_ERROR';
    }
    mapErrorToStatusCode(error) {
        if (error.name === 'ValidationError')
            return 400;
        if (error.name === 'UnauthorizedError')
            return 401;
        if (error.message.includes('not found'))
            return 404;
        if (error.message.includes('conflict'))
            return 409;
        if (error.message.includes('rate limit'))
            return 429;
        return 500;
    }
    determineLogLevel(appError) {
        if (appError.details?.statusCode >= 500)
            return types_1.LogLevel.ERROR;
        if (appError.details?.statusCode >= 400)
            return types_1.LogLevel.WARN;
        return types_1.LogLevel.INFO;
    }
    getClientErrorMessage(appError) {
        switch (appError.code) {
            case 'AUTH_REQUIRED':
                return '请先登录';
            case 'AUTH_FAILED':
                return '登录失败，请检查用户名和密码';
            case 'SESSION_EXPIRED':
                return '登录已过期，请重新登录';
            case 'ROOM_NOT_FOUND':
                return '房间不存在';
            case 'ROOM_FULL':
                return '房间已满';
            case 'VALIDATION_ERROR':
                return '输入数据有误';
            case 'RATE_LIMITED':
                return '请求过于频繁，请稍后再试';
            case 'TIMEOUT_ERROR':
                return '操作超时，请重试';
            default:
                return '服务器内部错误';
        }
    }
    getClientMessage(appError) {
        if (process.env.NODE_ENV === 'development') {
            return `${appError.code}: ${appError.message}`;
        }
        return this.getClientErrorMessage(appError);
    }
    createError(code, message, details) {
        const error = new Error(message);
        error.code = code;
        error.details = details;
        error.name = 'AppError';
        return error;
    }
    createValidationError(message, details) {
        return this.createError('VALIDATION_ERROR', message, details);
    }
    createAuthError(message, details) {
        const error = this.createError('AUTH_FAILED', message, details);
        error.statusCode = 401;
        error.name = 'UnauthorizedError';
        return error;
    }
    createRoomError(message, details) {
        return this.createError('ROOM_ERROR', message, details);
    }
    createGameError(message, details) {
        return this.createError('GAME_ERROR', message, details);
    }
}
exports.ErrorMiddleware = ErrorMiddleware;
//# sourceMappingURL=ErrorMiddleware.js.map