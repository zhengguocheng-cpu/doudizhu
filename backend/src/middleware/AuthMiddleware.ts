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
        // 通过用户ID认证，传递页面跳转令牌
        result = await this.authenticateByUserId(auth.userId, socket.id, auth.pageNavigationToken);
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
        
        // 向客户端发送认证失败消息
        socket.emit('auth_failed', {
          message: result.error || '认证失败，请重试'
        });
        
        // 断开连接
        socket.disconnect(true);
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
    
    // 设置用户离线状态
    if (socket.userId) {
      this.userManager.setUserOffline(socket.userId);
      this.log(LogLevel.INFO, 'User set offline', {
        userId: socket.userId
      });
      
      // 同时更新会话状态为离线
      if (socket.sessionId) {
        this.sessionManager.setOnlineStatus(socket.sessionId, false);
        this.log(LogLevel.INFO, 'Session set offline', {
          sessionId: socket.sessionId
        });
      }
      
      // 发布断开连接事件
      this.emitUserDisconnectedEvent(socket.userId, socket.sessionId);
    }
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
   * 如果用户在线，拒绝重复登录
   */
  private async authenticateByUserId(userId: string, socketId: string, pageNavigationToken?: string): Promise<AuthResult> {
    try {
      // 使用authenticateUser方法，包含在线检查，传递页面跳转令牌
      const user = this.userManager.authenticateUser(userId, socketId, pageNavigationToken);

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
