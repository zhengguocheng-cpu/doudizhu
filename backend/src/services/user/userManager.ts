import { Player, UserSession } from '../../types';
import { PlayerSession } from '../player/playerSession';
import { v4 as uuidv4 } from 'uuid';

/**
 * 用户管理器服务
 * 负责用户的完整生命周期管理
 */
export class UserManager {
  private users: Map<string, Player> = new Map();
  private sessionManager: PlayerSession;

  constructor(sessionManager: PlayerSession) {
    this.sessionManager = sessionManager;
  }

  /**
   * 创建或查找用户（使用用户名作为唯一标识）
   * 多页面架构：允许同一用户的页面跳转重连，但拒绝真正的重复登录
   */
  public authenticateUser(userName: string, socketId: string): Player {
    const trimmedUserName = userName.trim();

    // 1. 查找是否已有该用户
    let user = this.findUserByName(trimmedUserName);

    if (!user) {
      // 2. 创建新用户
      user = this.createUser(trimmedUserName);
      console.log(`✅ [MPA] 新用户注册: ${trimmedUserName}`);
    } else {
      // 3. 用户已存在，检查是否在线
      if (user.isOnline && user.socketId !== socketId) {
        // 检查旧socketId是否还活跃
        const session = this.sessionManager.findSessionByUserId(trimmedUserName);
        
        if (session && session.sessionId) {
          // 旧会话存在，检查是否是真正的重复登录
          // 如果旧socketId和新socketId都不同，说明是重复登录
          console.log(`⚠️ [MPA] 用户 ${trimmedUserName} 尝试新连接`);
          console.log(`   旧socketId: ${user.socketId}`);
          console.log(`   新socketId: ${socketId}`);
          
          // 给一个短暂的宽限期（500ms），允许页面跳转时的快速重连
          // 如果是真正的重复登录，用户会在不同的浏览器/标签页
          const timeSinceLastLogin = Date.now() - (user.lastLoginAt?.getTime() || 0);
          
          if (timeSinceLastLogin < 500) {
            // 很可能是页面跳转，允许重连
            console.log(`✅ [MPA] 页面跳转重连（${timeSinceLastLogin}ms），允许`);
            this.updateUserConnection(trimmedUserName, socketId);
          } else {
            // 时间间隔较长，可能是真正的重复登录
            console.log(`❌ [MPA] 拒绝重复登录: ${trimmedUserName} 已在其他地方在线 (${timeSinceLastLogin}ms)`);
            throw new Error('用户名已被占用，该用户正在游戏中。请使用其他用户名或稍后再试。');
          }
        } else {
          // 旧会话不存在，允许登录
          console.log(`✅ [MPA] 旧会话已失效，允许登录`);
          this.updateUserConnection(trimmedUserName, socketId);
        }
      } else {
        // 用户离线或同一socketId，允许登录
        this.updateUserConnection(trimmedUserName, socketId);
        console.log(`✅ [MPA] 用户登录: ${trimmedUserName}`);
      }
    }

    return user;
  }

  /**
   * 创建新用户（使用用户名作为ID）
   */
  public createUser(userName: string): Player {
    // 验证用户名
    if (!userName || userName.trim().length === 0) {
      throw new Error('用户名不能为空');
    }

    if (userName.length > 20) {
      throw new Error('用户名不能超过20个字符');
    }

    const trimmedUserName = userName.trim();

    // 检查用户名是否重复
    const existingUser = this.findUserByName(trimmedUserName);
    if (existingUser) {
      throw new Error('用户名已存在');
    }

    // 使用用户名作为用户ID
    const player: Player = {
      id: trimmedUserName, // 使用用户名作为ID
      name: trimmedUserName,
      ready: false,
      cards: [],
      cardCount: 0,
      socketId: '',
      userId: trimmedUserName, // 保持一致性
      createdAt: new Date(),
      lastLoginAt: new Date(),
      isOnline: false
    };

    this.users.set(trimmedUserName, player);
    return player;
  }

  /**
   * 通过用户名查找用户
   */
  public findUserByName(userName: string): Player | undefined {
    return this.users.get(userName.trim());
  }

  /**
   * 通过用户ID查找用户（兼容性方法）
   */
  public getUserById(userId: string): Player | undefined {
    // 由于现在使用用户名作为ID，这里直接查找用户名
    return this.users.get(userId);
  }

  /**
   * 更新用户连接信息（使用用户名作为ID）
   */
  public updateUserConnection(userName: string, socketId: string): boolean {
    const user = this.users.get(userName);
    if (user) {
      user.socketId = socketId;
      user.lastLoginAt = new Date();
      user.isOnline = true;
      return true;
    }
    return false;
  }

  /**
   * 设置用户离线状态（使用用户名作为ID）
   */
  public setUserOffline(userName: string): boolean {
    const user = this.users.get(userName);
    if (user) {
      user.isOnline = false;
      user.socketId = '';
      return true;
    }
    return false;
  }

  /**
   * 获取所有在线用户
   */
  public getOnlineUsers(): Player[] {
    return Array.from(this.users.values()).filter(user => user.isOnline);
  }

  /**
   * 获取所有用户
   */
  public getAllUsers(): Player[] {
    return Array.from(this.users.values());
  }

  /**
   * 删除用户
   */
  public deleteUser(userId: string): boolean {
    const user = this.users.get(userId);
    if (user) {
      // 清理用户会话
      this.sessionManager.destroySession(userId);
      this.users.delete(userId);
      return true;
    }
    return false;
  }

  /**
   * 获取用户统计信息
   */
  public getUserStats(): {
    total: number;
    online: number;
    offline: number;
  } {
    const users = Array.from(this.users.values());
    return {
      total: users.length,
      online: users.filter(u => u.isOnline).length,
      offline: users.filter(u => !u.isOnline).length
    };
  }

  /**
   * 清理离线用户（超过指定时间）
   */
  public cleanupOfflineUsers(maxOfflineMinutes: number = 60): number {
    const cutoffTime = new Date(Date.now() - maxOfflineMinutes * 60 * 1000);
    let cleanedCount = 0;

    for (const [userId, user] of this.users.entries()) {
      if (!user.isOnline && user.lastLoginAt && user.lastLoginAt < cutoffTime) {
        this.deleteUser(userId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }
}

// 创建单例实例
// 注意：这里需要传入PlayerSession实例
let userManagerInstance: UserManager | null = null;

export function createUserManager(sessionManager: PlayerSession): UserManager {
  if (!userManagerInstance) {
    userManagerInstance = new UserManager(sessionManager);
  }
  return userManagerInstance;
}

export function getUserManager(): UserManager {
  if (!userManagerInstance) {
    throw new Error('UserManager未初始化，请先调用createUserManager');
  }
  return userManagerInstance;
}
