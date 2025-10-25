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
   * 处理用户认证 - 注释掉
   */
  private async handleAuthentication(socket: AuthenticatedSocket, data: any): Promise<void> {
    // 注释掉认证处理
    // try {
    //   console.log('🔐 后端收到认证请求:', {
    //     socketId: socket.id,
    //     socketAuthenticated: socket.authenticated,
    //     socketUserId: socket.userId,
    //     requestData: data
    //   });

    //   const result = await this.authenticateUser(data);

    //   console.log('🔍 认证结果:', {
    //     success: result.success,
    //     user: result.user?.name,
    //     sessionId: result.sessionId,
    //     error: result.error
    //   });

    //   if (result.success && result.user && result.sessionId) {
    //     // 绑定用户信息到Socket
    //     socket.userId = result.user.name;
    //     socket.userName = result.user.name;
    //     socket.sessionId = result.sessionId;
    //     socket.authenticated = true;
    //     socket.user = result.user;

    //     // 更新用户状态
    //     if (result.user) {
    //       await this.userManager.updateUserConnection(result.user.name, socket.id);
    //     }

    //     // 发送认证成功响应
    //     if (result.user) {
    //       socket.emit('authenticated', {
    //         userId: result.user.name,
    //         userName: result.user.name,
    //         sessionId: result.sessionId
    //       });
    //     }

    //     this.log(LogLevel.INFO, 'User authenticated successfully', {
    //       userId: result.user?.name,
    //       socketId: socket.id
    //     });

    //     // 发布认证成功事件
    //     if (result.user) {
    //       this.emitUserAuthenticatedEvent(result.user, result.sessionId, socket);
    //     }

    //   } else {
    //     socket.emit('error', {
    //       message: result.error || '认证失败'
    //     });

    //     this.log(LogLevel.WARN, 'User authentication failed', {
    //       socketId: socket.id,
    //       error: result.error
    //     });
    //   }

    // } catch (error) {
    //   this.log(LogLevel.ERROR, 'Authentication error', { error, socketId: socket.id });
    //   socket.emit('error', {
    //     message: error instanceof Error ? error.message : '认证过程中发生错误'
    //   });
    // }
  }

  /**
   * 处理用户重连 - 注释掉
   */
  private async handleReconnection(socket: AuthenticatedSocket, data: any): Promise<void> {
    // 注释掉重连处理
    // try {
    //   this.log(LogLevel.INFO, 'Handling reconnection', { socketId: socket.id });

    //   let result: AuthResult;

    //   if (data.sessionId) {
    //     // 通过sessionId重连
    //     result = await this.authenticateBySession(data.sessionId, socket.id);
    //   } else if (data.userName) {
    //     // 通过用户名重连
    //     result = await this.authenticateByUserName(data.userName, socket.id);
    //   } else {
    //     result = { success: false, error: '缺少认证信息' };
    //   }

    //   if (result.success) {
    //     socket.userId = result.user?.name;
    //     socket.userName = result.user?.name;
    //     socket.sessionId = result.sessionId;
    //     socket.authenticated = true;
    //     socket.user = result.user;

    //     socket.emit('authenticated', {
    //       userId: result.user?.name,
    //       userName: result.user?.name,
    //       sessionId: result.sessionId
    //     });

    //     this.log(LogLevel.INFO, 'User reconnected successfully', {
    //       userId: result.user?.name,
    //       socketId: socket.id
    //     });

    //   } else {
    //     socket.emit('error', {
    //       message: result.error || '重连失败'
    //     });
    //   }

    // } catch (error) {
    //   this.log(LogLevel.ERROR, 'Reconnection error', { error, socketId: socket.id });
    //   socket.emit('error', {
    //     message: error instanceof Error ? error.message : '重连过程中发生错误'
    //   });
    // }
  }

  /**
   * 处理断开连接 - 简化版
   */
  private handleDisconnection(socket: AuthenticatedSocket): void {
    // 注释掉用户断开处理
    // if (socket.userId) {
    //   this.userManager.setUserOffline(socket.userId);
    //   if (socket.sessionId) {
    //     this.sessionManager.setOnlineStatus(socket.sessionId, false);
    //   }

    //   this.log(LogLevel.INFO, 'User disconnected', {
    //     userId: socket.userId,
    //     socketId: socket.id
    //   });

    //   // 发布用户断开事件
    //   this.emitUserDisconnectedEvent(socket.userId, socket.sessionId);
    // }

    // 简化断开处理
    this.log(LogLevel.INFO, 'Socket disconnected', {
      socketId: socket.id
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
   * 认证用户 - 注释掉
   */
  private async authenticateUser(data: any): Promise<AuthResult> {
    // 注释掉用户认证方法
    // const { userName } = data;

    // if (!userName || userName.trim().length === 0) {
    //   return { success: false, error: '用户名不能为空' };
    // }

    // try {
    //   const user = this.userManager.authenticateUser(userName, ''); // Socket ID 稍后设置
    //   const sessionId = this.sessionManager.createUserSession(user, '');

    //   return { success: true, user, sessionId };
    // } catch (error) {
    //   return {
    //     success: false,
    //     error: error instanceof Error ? error.message : '认证失败'
    //   };
    // }

    // 简化认证，总是成功
    return { success: true };
  }

  /**
   * 通过Session ID认证 - 注释掉
   */
  private async authenticateBySession(sessionId: string, socketId: string): Promise<AuthResult> {
    // 注释掉Session认证方法
    // const session = this.sessionManager.getSession(sessionId);

    // if (!session || !session.player) {
    //   return { success: false, error: '会话不存在或已过期' };
    // }

    // // 更新连接状态
    // this.userManager.updateUserConnection(session.player.name, socketId);
    // this.sessionManager.updateSocketId(sessionId, socketId);
    // this.sessionManager.setOnlineStatus(sessionId, true);

    // return { success: true, user: session.player, sessionId };

    // 简化认证，总是成功
    return { success: true };
  }

  /**
   * 通过用户名认证
   */
  private async authenticateByUserName(userName: string, socketId: string): Promise<AuthResult> {
    try {
      // 查找用户
      let user = this.userManager.findUserByName(userName);

      if (!user) {
        // 如果用户不存在，自动创建新用户
        user = this.userManager.createUser(userName);
        console.log(`新用户自动注册: ${userName}, ID: ${userName}`);
      } else {
        // 更新用户连接状态
        this.userManager.updateUserConnection(userName, socketId);
        console.log(`用户重连: ${userName}, ID: ${userName}`);
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

  /**
   * 权限检查中间件 - 注释掉
   */
  public requireAuth(handler: Function): Function {
    // 注释掉权限检查
    // return (socket: AuthenticatedSocket, data: any) => {
    //   if (!socket.authenticated || !socket.userId) {
    //     socket.emit('error', { message: '用户未认证' });
    //     return;
    //   }

    //   if (socket.userId !== data.userId) {
    //     socket.emit('error', { message: '用户身份验证失败' });
    //     return;
    //   }

    //   return handler(socket, data);
    // };

    // 简化权限检查，直接执行
    return handler;
  }

  /**
   * 权限检查装饰器 - 注释掉
   */
  public requirePermission(permission: string): Function {
    // 注释掉权限检查装饰器
    // return (handler: Function) => {
    //   return (socket: AuthenticatedSocket, data: any) => {
    //     if (!socket.user) {
    //       socket.emit('error', { message: '用户未认证' });
    //       return;
    //     }

    //     // 这里可以添加具体的权限检查逻辑
    //     return handler(socket, data);
    //   };
    // };

    // 简化权限检查装饰器，直接执行
    return (handler: Function) => handler;
  }
}
