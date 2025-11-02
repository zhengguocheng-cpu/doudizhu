/**
 * 错误处理中间件
 * 统一处理HTTP和Socket.IO错误，提供一致的错误响应格式
 */

import { Request, Response, NextFunction } from 'express';
import { Socket } from 'socket.io';
import { ApiResponse, AppError, LogLevel } from '../types';
import { BaseService } from '../core/BaseService';

export interface ExtendedError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class ErrorMiddleware extends BaseService {

  constructor() {
    super();
  }

  protected async onInitialize(): Promise<void> {
    this.log(LogLevel.INFO, 'class ErrorMiddleware initialized');
  }

  protected async onDestroy(): Promise<void> {
    this.log(LogLevel.INFO, 'ErrorMiddleware destroyed');
  }

  /**
   * Express错误处理中间件
   */
  public handleHttpError(
    error: ExtendedError,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const appError = this.normalizeError(error, {
      userId: (req as any).userId,
      sessionId: (req as any).sessionId,
      endpoint: `${req.method} ${req.path}`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    // 记录错误日志
    this.logError(appError);

    // 发送错误响应
    this.sendHttpErrorResponse(res, appError);
  }

  /**
   * Socket.IO错误处理中间件
   */
  public handleSocketError(socket: Socket, error: ExtendedError): void {
    const appError = this.normalizeError(error, {
      socketId: socket.id,
      userId: (socket as any).userId,
      sessionId: (socket as any).sessionId
    });

    // 记录错误日志
    this.logError(appError);

    // 发送Socket错误响应
    this.sendSocketErrorResponse(socket, appError);
  }

  /**
   * 全局错误捕获器
   */
  public catchAsyncErrors(handler: Function): Function {
    return async (...args: any[]) => {
      try {
        return await handler(...args);
      } catch (error) {
        const socket = args[0];
        if (socket && typeof socket.emit === 'function') {
          // Socket.IO错误
          this.handleSocketError(socket, error as ExtendedError);
        } else {
          // HTTP错误
          const [req, res, next] = args.slice(-3);
          if (req && res && next) {
            this.handleHttpError(error as ExtendedError, req, res, next);
          }
        }
      }
    };
  }

  /**
   * 规范化错误对象
   */
  private normalizeError(error: ExtendedError, context: any = {}): AppError {
    const appError: AppError = {
      code: error.code || this.mapErrorToCode(error),
      message: error.message || '未知错误',
      details: error.details || {},
      timestamp: new Date(),
      ...context
    };

    // 映射HTTP状态码
    if (error.statusCode) {
      appError.details.statusCode = error.statusCode;
    } else {
      appError.details.statusCode = this.mapErrorToStatusCode(error);
    }

    return appError;
  }

  /**
   * 记录错误日志
   */
  private logError(appError: AppError): void {
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
    } else {
      // Fallback到console
      const levelNames = {
        [LogLevel.ERROR]: 'ERROR',
        [LogLevel.WARN]: 'WARN',
        [LogLevel.INFO]: 'INFO',
        [LogLevel.DEBUG]: 'DEBUG',
        [LogLevel.TRACE]: 'TRACE'
      };
      const levelName = levelNames[logLevel] || 'ERROR';
      console.error(`[${appError.timestamp.toISOString()}] ${levelName} [ErrorMiddleware] ${appError.message}`, appError.details);
    }
  }

  /**
   * 发送HTTP错误响应
   */
  private sendHttpErrorResponse(res: Response, appError: AppError): void {
    const statusCode = appError.details?.statusCode || 500;

    const response: ApiResponse = {
      success: false,
      error: this.getClientErrorMessage(appError),
      message: this.getClientMessage(appError)
    };

    // 开发环境下包含更多错误信息
    if (process.env.NODE_ENV === 'development') {
      response.error = appError.message;
      response.message = appError.details?.endpoint || 'API Error';
    }

    res.status(statusCode).json(response);
  }

  /**
   * 发送Socket.IO错误响应
   */
  private sendSocketErrorResponse(socket: Socket, appError: AppError): void {
    socket.emit('error', {
      code: appError.code,
      message: this.getClientErrorMessage(appError),
      timestamp: appError.timestamp
    });
  }

  /**
   * 映射错误到错误码
   */
  private mapErrorToCode(error: ExtendedError): string {
    if (error.name === 'ValidationError') return 'VALIDATION_ERROR';
    if (error.name === 'UnauthorizedError') return 'AUTH_REQUIRED';
    if (error.message.includes('not found')) return 'NOT_FOUND';
    if (error.message.includes('timeout')) return 'TIMEOUT_ERROR';
    if (error.message.includes('rate limit')) return 'RATE_LIMITED';
    return 'INTERNAL_ERROR';
  }

  /**
   * 映射错误到HTTP状态码
   */
  private mapErrorToStatusCode(error: ExtendedError): number {
    if (error.name === 'ValidationError') return 400;
    if (error.name === 'UnauthorizedError') return 401;
    if (error.message.includes('not found')) return 404;
    if (error.message.includes('conflict')) return 409;
    if (error.message.includes('rate limit')) return 429;
    return 500;
  }

  /**
   * 确定日志级别
   */
  private determineLogLevel(appError: AppError): LogLevel {
    if (appError.details?.statusCode >= 500) return LogLevel.ERROR;
    if (appError.details?.statusCode >= 400) return LogLevel.WARN;
    return LogLevel.INFO;
  }

  /**
   * 获取客户端错误消息
   */
  private getClientErrorMessage(appError: AppError): string {
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

  /**
   * 获取客户端消息
   */
  private getClientMessage(appError: AppError): string {
    if (process.env.NODE_ENV === 'development') {
      return `${appError.code}: ${appError.message}`;
    }
    return this.getClientErrorMessage(appError);
  }

  /**
   * 创建自定义错误
   */
  public createError(code: string, message: string, details?: any): ExtendedError {
    const error = new Error(message) as ExtendedError;
    error.code = code;
    error.details = details;
    error.name = 'AppError';
    return error;
  }

  /**
   * 创建验证错误
   */
  public createValidationError(message: string, details?: any): ExtendedError {
    return this.createError('VALIDATION_ERROR', message, details);
  }

  /**
   * 创建认证错误
   */
  public createAuthError(message: string, details?: any): ExtendedError {
    const error = this.createError('AUTH_FAILED', message, details);
    error.statusCode = 401;
    error.name = 'UnauthorizedError';
    return error;
  }

  /**
   * 创建房间错误
   */
  public createRoomError(message: string, details?: any): ExtendedError {
    return this.createError('ROOM_ERROR', message, details);
  }

  /**
   * 创建游戏错误
   */
  public createGameError(message: string, details?: any): ExtendedError {
    return this.createError('GAME_ERROR', message, details);
  }
}
