/**
 * 认证中间件
 * 处理用户认证、会话管理和权限验证
 */

import { Socket } from 'socket.io';
import { ApiResponse, UserStatus, GAME_CONSTANTS, LogLevel } from '../types';
import { BaseService } from '../core/BaseService';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
  sessionId?: string;
  authenticated?: boolean;
  user?: any;
}

export interface AuthResult {
  success: boolean;
  user?: any;
  sessionId?: string;
  error?: string;
}

export class AuthMiddleware extends BaseService {
  private userManager: any;
  private sessionManager: any;

  constructor() {
    super();
    // Services will be resolved automatically when onInitialize is called
  }

  protected async onInitialize(): Promise<void> {
    this.userManager = this.getService('UserManager');
    this.sessionManager = this.getService('SessionManager');
    this.log(LogLevel.INFO, 'AuthMiddleware initialized');
  }

  protected async onDestroy(): Promise<void> {
    this.log(LogLevel.INFO, 'AuthMiddleware destroyed');
  }

  /**
   * Socket.IO认证中间件
   */
  public authenticateSocket(socket: AuthenticatedSocket, next: Function): void {
    try {
      // 处理连接时的auth参数
      if (socket.handshake.auth && (socket.handshake.auth.userName || socket.handshake.auth.userId)) {
        this.handleAuthFromConnection(socket, socket.handshake.auth);
      }

      // 设置错误处理器
      socket.on('error', (error) => {
        this.handleSocketError(socket, error);
      });

      // 处理断开连接
      socket.on('disconnect', () => {
        this.handleDisconnection(socket);
      });

      this.log(LogLevel.INFO, 'Socket authentication middleware setup', {
        socketId: socket.id,
        authData: socket.handshake.auth
      });

      next();
    } catch (error) {
      this.log(LogLevel.ERROR, 'Socket authentication middleware failed', { error });
      next(error);
    }
  }

  /**
   * 处理连接时的auth参数
   */
  private async handleAuthFromConnection(socket: AuthenticatedSocket, auth: any): Promise<void> {
    try {
      this.log(LogLevel.INFO, 'Processing auth from connection', {
        socketId: socket.id,
        authData: auth
      });

      let result: AuthResult;

      if (auth.userId) {
        // 通过用户ID认证
        result = await this.authenticateByUserId(auth.userId, socket.id);
      } else {
        this.log(LogLevel.WARN, 'No valid auth data in connection', { socketId: socket.id });
        return;
      }

      if (result.success && result.user) {
        // 绑定用户信息到Socket
        socket.userId = result.user.name;
        socket.userName = result.user.name;
        socket.sessionId = result.sessionId;
        socket.authenticated = true;
        socket.user = result.user;

        // 更新用户状态
        await this.userManager.updateUserConnection(result.user.name, socket.id);

        this.log(LogLevel.INFO, 'User authenticated from connection successfully', {
          userId: result.user.name,
          socketId: socket.id
        });

        // 发布认证成功事件
        if (result.sessionId) {
          this.emitUserAuthenticatedEvent(result.user, result.sessionId, socket);
        }

      } else {
        this.log(LogLevel.WARN, 'Authentication from connection failed', {
          socketId: socket.id,
          error: result.error
        });
      }

    } catch (error) {
      this.log(LogLevel.ERROR, 'Auth from connection error', {
        error,
        socketId: socket.id
      });
    }
  }



  /**
   * 处理断开连接
   */
  private handleDisconnection(socket: AuthenticatedSocket): void {
    this.log(LogLevel.INFO, 'Socket disconnected', {
      socketId: socket.id,
      userId: socket.userId
    });
  }

  /**
   * 处理Socket错误
   */
  private handleSocketError(socket: AuthenticatedSocket, error: Error): void {
    this.log(LogLevel.ERROR, 'Socket error', {
      error: error.message,
      socketId: socket.id,
      userId: socket.userId
    });
  }




  /**
   * 通过用户ID认证
   */
  private async authenticateByUserId(userId: string, socketId: string): Promise<AuthResult> {
    try {
      // 查找用户
      let user = this.userManager.getUserById(userId);

      if (!user) {
        // 如果用户不存在，自动创建新用户
        user = this.userManager.createUser(userId);
        console.log(`新用户自动注册: ${userId}, ID: ${userId}`);
      } else {
        // 更新用户连接状态
        this.userManager.updateUserConnection(userId, socketId);
        console.log(`用户重连: ${userId}, ID: ${userId}`);
      }

      // 创建会话
      const sessionId = this.sessionManager.createUserSession(user, socketId);

      return { success: true, user, sessionId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '认证失败'
      };
    }
  }

  /**
   * 发布用户认证成功事件
   */
  private emitUserAuthenticatedEvent(user: any, sessionId: string, socket: AuthenticatedSocket): void {
    // 这里可以发布事件到事件总线
    this.log(LogLevel.INFO, 'User authenticated event emitted', { userId: user.name });
  }

  /**
   * 发布用户断开事件
   */
  private emitUserDisconnectedEvent(userId: string, sessionId?: string): void {
    // 这里可以发布事件到事件总线
    this.log(LogLevel.INFO, 'User disconnected event emitted', { userId });
  }


}
