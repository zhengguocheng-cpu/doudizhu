import { Player } from '../../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * 玩家会话服务
 * 管理玩家的连接状态和会话信息
 */
export class PlayerSession {
  private sessions: Map<string, {
    player: Player;
    socketId: string;
    connectedAt: Date;
    lastActivity: Date;
    isOnline: boolean;
  }> = new Map();

  /**
   * 创建玩家会话
   */
  public createSession(player: Player, socketId: string): string {
    const sessionId = uuidv4();
    const session = {
      player,
      socketId,
      connectedAt: new Date(),
      lastActivity: new Date(),
      isOnline: true
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  /**
   * 获取玩家会话
   */
  public getSession(sessionId: string): { player: Player; socketId: string; connectedAt: Date; lastActivity: Date; isOnline: boolean } | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * 更新玩家活动时间
   */
  public updateActivity(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
      return true;
    }
    return false;
  }

  /**
   * 设置玩家在线状态
   */
  public setOnlineStatus(sessionId: string, isOnline: boolean): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isOnline = isOnline;
      return true;
    }
    return false;
  }

  /**
   * 销毁玩家会话
   */
  public destroySession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * 通过Socket ID查找会话
   */
  public findSessionBySocketId(socketId: string): { sessionId: string; player: Player } | undefined {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.socketId === socketId && session.isOnline) {
        return {
          sessionId,
          player: session.player
        };
      }
    }
    return undefined;
  }

  public findSessionByUserId(userId: string): { sessionId: string; player: Player } | undefined {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.player.id === userId && session.isOnline) {
        return {
          sessionId,
          player: session.player
        };
      }
    }
    return undefined;
  }

  /**
   * 创建用户会话（带重复连接检查）
   */
  public createUserSession(user: Player, socketId: string): string {
    // 1. 检查是否已有该用户的会话
    const existingSession = this.findSessionByUserId(user.id);
    if (existingSession) {
      // 断开旧连接
      this.setOnlineStatus(existingSession.sessionId, false);
      console.log(`断开用户 ${user.name} 的旧连接`);
    }

    // 2. 创建新会话
    const sessionId = this.createSession(user, socketId);

    // 3. 标记为在线
    this.setOnlineStatus(sessionId, true);

    return sessionId;
  }

  /**
   * 更新会话的Socket连接
   */
  public updateSocketId(sessionId: string, newSocketId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.socketId = newSocketId;
      session.lastActivity = new Date();
      return true;
    }
    return false;
  }

  /**
   * 重连用户
   */
  public reconnectUser(userId: string, newSocketId: string): boolean {
    // 查找用户现有会话并更新Socket连接
    const session = this.findSessionByUserId(userId);
    if (session) {
      this.updateSocketId(session.sessionId, newSocketId);
      this.setOnlineStatus(session.sessionId, true);
      return true;
    }
    return false;
  }

  /**
   * 通过Socket ID查找会话（包括离线用户）
   */
  public findSessionBySocketIdIncludingOffline(socketId: string): { sessionId: string; player: Player } | undefined {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.socketId === socketId) {
        return {
          sessionId,
          player: session.player
        };
      }
    }
    return undefined;
  }

  /**
   * 清理离线会话（超过30分钟未活动）
   */
  public cleanupOfflineSessions(): number {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (!session.isOnline && session.lastActivity < thirtyMinutesAgo) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * 获取会话统计信息
   */
  public getSessionStats(): {
    total: number;
    online: number;
    offline: number;
  } {
    const sessions = Array.from(this.sessions.values());
    return {
      total: sessions.length,
      online: sessions.filter(s => s.isOnline).length,
      offline: sessions.filter(s => !s.isOnline).length
    };
  }
}
