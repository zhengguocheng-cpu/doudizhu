/**
 * HTTP中间件
 * 提供HTTP路由的认证、错误处理、日志等中间件
 */

import { Request, Response, NextFunction } from 'express';
import { BaseService } from '../core/BaseService';
import { AuthMiddleware } from './AuthMiddleware';
import { ErrorMiddleware } from './ErrorMiddleware';
import { LogLevel } from '../types';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userName?: string;
  sessionId?: string;
  user?: any;
}

export class HttpMiddleware extends BaseService {
  private authMiddleware!: AuthMiddleware;
  private errorMiddleware!: ErrorMiddleware;

  constructor() {
    super();
  }

  protected async onInitialize(): Promise<void> {
    this.authMiddleware = this.getService('AuthMiddleware');
    this.errorMiddleware = this.getService('ErrorMiddleware');
    this.log(LogLevel.INFO, 'HttpMiddleware initialized');
  }

  protected async onDestroy(): Promise<void> {
    this.log(LogLevel.INFO, 'HttpMiddleware destroyed');
  }

  /**
   * 请求日志中间件
   */
  public requestLogger(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();

    // 记录请求开始
    this.logger?.info('HTTP Request started', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // 记录响应完成
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      this.logger?.log({
        level: statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO,
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

  /**
   * CORS中间件
   */
  public corsHandler(req: Request, res: Response, next: NextFunction): void {
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
    } else {
      next();
    }
  }

  /**
   * 认证中间件
   */
  public authenticateRequest(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const authHeader = req.headers.authorization;
      const sessionId = req.headers['x-session-id'] as string;
      const userName = req.headers['x-user-name'] as string;

      if (!authHeader && !sessionId && !userName) {
        return next(this.errorMiddleware.createAuthError('缺少认证信息'));
      }

      // 这里可以添加具体的认证逻辑
      // 为了简化，暂时跳过详细的认证检查

      next();
    } catch (error) {
      next(this.errorMiddleware.createAuthError('认证失败'));
    }
  }

  /**
   * 权限检查中间件
   */
  public requirePermission(permission: string) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      // 这里可以添加权限检查逻辑
      next();
    };
  }

  /**
   * 速率限制中间件
   */
  public rateLimit(maxRequests: number = 100, windowMs: number = 60 * 1000) {
    const requests = new Map<string, number[]>();

    return (req: Request, res: Response, next: NextFunction): void => {
      const key = req.ip || 'unknown';
      const now = Date.now();
      const windowStart = now - windowMs;

      // 获取或创建请求记录
      if (!requests.has(key)) {
        requests.set(key, []);
      }

      const userRequests = requests.get(key)!;

      // 移除过期的请求
      const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
      requests.set(key, validRequests);

      // 检查是否超过限制
      if (validRequests.length >= maxRequests) {
        this.logger?.warn('Rate limit exceeded', {
          ip: key,
          requestCount: validRequests.length,
          limit: maxRequests
        });

        return next(this.errorMiddleware.createError('RATE_LIMITED', '请求过于频繁，请稍后再试'));
      }

      // 记录当前请求
      validRequests.push(now);

      next();
    };
  }

  /**
   * 请求验证中间件
   */
  public validateRequest(validationRules: any) {
    return (req: Request, res: Response, next: NextFunction): void => {
      // 这里可以添加请求数据验证逻辑
      next();
    };
  }

  /**
   * 响应格式化中间件
   */
  public responseFormatter(req: Request, res: Response, next: NextFunction): void {
    const originalJson = res.json;

    res.json = function(data: any) {
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

  /**
   * 安全头中间件
   */
  public securityHeaders(req: Request, res: Response, next: NextFunction): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    if (req.secure) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
  }

  /**
   * 请求超时中间件
   */
  public timeoutHandler(timeoutMs: number = 30000) {
    return (req: Request, res: Response, next: NextFunction): void => {
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

  /**
   * 404处理器
   */
  public notFoundHandler(req: Request, res: Response, next: NextFunction): void {
    next(this.errorMiddleware.createError('NOT_FOUND', `路由 ${req.method} ${req.path} 不存在`));
  }
}
