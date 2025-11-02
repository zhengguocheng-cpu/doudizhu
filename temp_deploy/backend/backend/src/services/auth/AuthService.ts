/**
 * 认证服务
 * 统一处理用户认证、会话管理和权限验证
 */

import { BaseService } from '../../core/BaseService';
import { EventBus } from '../../core/EventBus';
import { Player } from '../../types/player';
import { UserSession, AuthResponse, LogLevel } from '../../types';
import { createUserManager } from '../user/userManager';
import { PlayerSession } from '../player/playerSession';

export class AuthService extends BaseService {
  private static _instance: AuthService;
  private userManager: any;
  private sessionManager!: PlayerSession;
  private eventBus!: EventBus;

  private constructor() {
    super();
  }

  public static getInstance(): AuthService {
    if (!AuthService._instance) {
      AuthService._instance = new AuthService();
    }
    return AuthService._instance;
  }

  protected async onInitialize(): Promise<void> {
    this.sessionManager = this.getService('SessionManager');
    this.userManager = createUserManager(this.sessionManager);
    this.eventBus = EventBus.getInstance();

    // 设置事件处理器
    this.setupEventHandlers();

    this.log(LogLevel.INFO, 'AuthService initialized');
  }

  protected async onDestroy(): Promise<void> {
    this.log(LogLevel.INFO, 'AuthService destroyed');
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // 监听用户断开连接事件
    this.eventBus.subscribe('socket:disconnected', (event: any) => {
      this.handleSocketDisconnected(event);
    });
  }

  /**
   * 处理Socket断开连接
   */
  private handleSocketDisconnected(event: any): void {
    const { socketId } = event;

    // 查找使用此Socket的用户
    const user = this.findUserBySocketId(socketId);
    if (user) {
      this.userManager.setUserOffline(user.id);
      this.log(LogLevel.INFO, 'User set offline due to socket disconnect', {
        userId: user.id,
        socketId
      });
    }
  }

  /**
   * 通过Socket ID查找用户
   */
  private findUserBySocketId(socketId: string): Player | undefined {
    return this.userManager.getAllUsers().find((user: Player) => user.socketId === socketId);
  }

  /**
   * 认证用户
   */
  public async authenticate(data: { userName: string }): Promise<AuthResponse> {
    try {
      const { userName } = data;

      // 验证用户名
      if (!userName || userName.trim().length === 0) {
        return {
          success: false,
          error: '用户名不能为空'
        };
      }

      // 使用UserManager认证用户
      const user = this.userManager.authenticateUser(userName, '');

      // 创建会话
      //const sessionId = this.sessionManager.createUserSession(user, '');

      this.log(LogLevel.INFO, ' User authenticated successfully', {
        userId: user.id,
        userName: user.name,
        sessionId: ''
      });

      // 发布认证成功事件
      this.eventBus.emit('user:authenticated', {
        userId: user.id,
        userName: user.name,
        sessionId: ''
      });

      return {
        success: true,
        userId: user.id,
        userName: user.name,
        sessionId: ''
      };

    } catch (error) {
      this.log(LogLevel.ERROR, 'Authentication failed', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : '认证失败'
      };
    }
  }

  /**
   * 通过Session ID重新认证
   */
  public async authenticateBySession(sessionId: string, socketId: string): Promise<AuthResponse> {
    try {
      const session = this.sessionManager.getSession(sessionId);

      if (!session || !session.player) {
        return {
          success: false,
          error: '会话不存在或已过期'
        };
      }

      // 更新连接状态
      this.userManager.updateUserConnection(session.player.name, socketId);
      this.sessionManager.updateSocketId(sessionId, socketId);
      this.sessionManager.setOnlineStatus(sessionId, true);

      this.log(LogLevel.INFO, 'User re-authenticated by session', {
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

    } catch (error) {
      this.log(LogLevel.ERROR, 'Session authentication failed', { sessionId, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : '会话认证失败'
      };
    }
  }

  /**
   * 通过用户名重新认证
   */
  public async authenticateByUserName(userName: string, socketId: string): Promise<AuthResponse> {
    try {
      const user = this.userManager.findUserByName(userName);

      if (!user) {
        return {
          success: false,
          error: '用户不存在，请重新登录'
        };
      }

      // 更新连接状态
      this.userManager.updateUserConnection(user.name, socketId);

      // 尝试重连会话
      const reconnectSuccess = this.sessionManager.reconnectUser(user.name, socketId);
      let sessionId: string;

      if (reconnectSuccess) {
        const session = this.sessionManager.findSessionByUserId(user.name);
        sessionId = session?.sessionId || '';
      } else {
        sessionId = this.sessionManager.createUserSession(user, socketId);
      }

      this.log(LogLevel.INFO, 'User re-authenticated by username', {
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

    } catch (error) {
      this.log(LogLevel.ERROR, 'Username authentication failed', { userName, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : '用户名认证失败'
      };
    }
  }

  /**
   * 验证用户权限
   */
  public validatePermission(userId: string, requiredPermission: string): boolean {
    // 这里可以实现具体的权限验证逻辑
    // 目前简化处理，所有认证用户都有基本权限
    const user = this.userManager.getUserById(userId);
    return user !== undefined;
  }

  /**
   * 获取用户统计信息
   */
  public getUserStats(): any {
    return this.userManager.getUserStats();
  }

  /**
   * 获取在线用户列表
   */
  public getOnlineUsers(): Player[] {
    return this.userManager.getOnlineUsers();
  }

  /**
   * 获取所有用户
   */
  public getAllUsers(): Player[] {
    return this.userManager.getAllUsers();
  }

  /**
   * 删除用户
   */
  public deleteUser(userId: string): boolean {
    const result = this.userManager.deleteUser(userId);
    if (result) {
      this.log(LogLevel.INFO, 'User deleted', { userId });
    }
    return result;
  }

  /**
   * 清理过期用户
   */
  public cleanupExpiredUsers(maxOfflineMinutes: number = 60): number {
    const cleanedCount = this.userManager.cleanupOfflineUsers(maxOfflineMinutes);
    if (cleanedCount > 0) {
      this.log(LogLevel.INFO, 'Expired users cleaned up', { count: cleanedCount });
    }
    return cleanedCount;
  }

  /**
   * 获取用户会话信息
   */
  public getUserSession(userId: string): UserSession | undefined {
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

  /**
   * 验证会话是否有效
   */
  public validateSession(sessionId: string): boolean {
    const session = this.sessionManager.getSession(sessionId);
    return session !== undefined && session.player !== undefined;
  }

  /**
   * 登出用户
   */
  public async logout(userId: string, sessionId?: string): Promise<void> {
    try {
      this.userManager.setUserOffline(userId);

      if (sessionId) {
        this.sessionManager.destroySession(sessionId);
      }

      this.log(LogLevel.INFO, 'User logged out', { userId, sessionId });

      // 发布登出事件
      this.eventBus.emit('user:logged_out', {
        userId,
        sessionId,
        timestamp: new Date()
      });

    } catch (error) {
      this.log(LogLevel.ERROR, 'Logout failed', { userId, sessionId, error });
    }
  }
}

// 导出获取实例的方法，而不是直接实例化
let authServiceInstance: AuthService | null = null;

export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    authServiceInstance = AuthService.getInstance();
  }
  return authServiceInstance!; // 使用非空断言操作符，因为我们确保了实例存在
}

// 为了向后兼容，仍然导出获取实例的函数
// 注意：所有引用authService的地方都已改为getAuthService()
