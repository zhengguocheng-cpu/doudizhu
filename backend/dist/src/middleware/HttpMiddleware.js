"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpMiddleware = void 0;
const BaseService_1 = require("../core/BaseService");
const types_1 = require("../types");
class HttpMiddleware extends BaseService_1.BaseService {
    constructor() {
        super();
    }
    async onInitialize() {
        this.authMiddleware = this.getService('AuthMiddleware');
        this.errorMiddleware = this.getService('ErrorMiddleware');
        this.log(types_1.LogLevel.INFO, 'HttpMiddleware initialized');
    }
    async onDestroy() {
        this.log(types_1.LogLevel.INFO, 'HttpMiddleware destroyed');
    }
    requestLogger(req, res, next) {
        const startTime = Date.now();
        this.logger?.info('HTTP Request started', {
            method: req.method,
            path: req.path,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            const statusCode = res.statusCode;
            this.logger?.log({
                level: statusCode >= 400 ? types_1.LogLevel.WARN : types_1.LogLevel.INFO,
                message: 'HTTP Request completed',
                context: {
                    method: req.method,
                    path: req.path,
                    statusCode,
                    duration: `${duration}ms`
                },
                metadata: {
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    contentLength: req.get('content-length')
                },
                timestamp: new Date(),
                duration
            });
        });
        next();
    }
    corsHandler(req, res, next) {
        const origin = req.headers.origin;
        const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:8080'];
        if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
            res.header('Access-Control-Allow-Origin', origin || '*');
            res.header('Access-Control-Allow-Credentials', 'true');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,X-Requested-With');
        }
        if (req.method === 'OPTIONS') {
            res.sendStatus(200);
        }
        else {
            next();
        }
    }
    authenticateRequest(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            const sessionId = req.headers['x-session-id'];
            const userName = req.headers['x-user-name'];
            if (!authHeader && !sessionId && !userName) {
                return next(this.errorMiddleware.createAuthError('缺少认证信息'));
            }
            next();
        }
        catch (error) {
            next(this.errorMiddleware.createAuthError('认证失败'));
        }
    }
    requirePermission(permission) {
        return (req, res, next) => {
            next();
        };
    }
    rateLimit(maxRequests = 100, windowMs = 60 * 1000) {
        const requests = new Map();
        return (req, res, next) => {
            const key = req.ip || 'unknown';
            const now = Date.now();
            const windowStart = now - windowMs;
            if (!requests.has(key)) {
                requests.set(key, []);
            }
            const userRequests = requests.get(key);
            const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
            requests.set(key, validRequests);
            if (validRequests.length >= maxRequests) {
                this.logger?.warn('Rate limit exceeded', {
                    ip: key,
                    requestCount: validRequests.length,
                    limit: maxRequests
                });
                return next(this.errorMiddleware.createError('RATE_LIMITED', '请求过于频繁，请稍后再试'));
            }
            validRequests.push(now);
            next();
        };
    }
    validateRequest(validationRules) {
        return (req, res, next) => {
            next();
        };
    }
    responseFormatter(req, res, next) {
        const originalJson = res.json;
        res.json = function (data) {
            const response = {
                success: res.statusCode >= 200 && res.statusCode < 300,
                data,
                timestamp: new Date().toISOString(),
                path: req.path,
                method: req.method
            };
            return originalJson.call(this, response);
        };
        next();
    }
    securityHeaders(req, res, next) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        if (req.secure) {
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }
        next();
    }
    timeoutHandler(timeoutMs = 30000) {
        return (req, res, next) => {
            const timeout = setTimeout(() => {
                if (!res.headersSent) {
                    next(this.errorMiddleware.createError('TIMEOUT_ERROR', '请求超时'));
                }
            }, timeoutMs);
            res.on('finish', () => {
                clearTimeout(timeout);
            });
            next();
        };
    }
    notFoundHandler(req, res, next) {
        next(this.errorMiddleware.createError('NOT_FOUND', `路由 ${req.method} ${req.path} 不存在`));
    }
}
exports.HttpMiddleware = HttpMiddleware;
//# sourceMappingURL=HttpMiddleware.js.map