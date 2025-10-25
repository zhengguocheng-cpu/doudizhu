import { Player } from '../../types';

/**
 * 用户状态数据接口
 */
export interface UserState {
  userId: string;
  userName: string;
  roomId?: string;
  isInRoom: boolean;
  roomState?: {
    ready: boolean;
    cards?: string[];
    cardCount: number;
    isLandlord?: boolean;
  };
  lastUpdated: Date;
}

/**
 * 状态恢复服务
 * 负责保存和恢复用户的游戏状态
 */
export class StateRecoveryService {
  private userStates: Map<string, UserState> = new Map();

  /**
   * 保存用户状态
   */
  public saveUserState(userId: string, state: Partial<UserState>): void {
    const existingState = this.userStates.get(userId) || {
      userId,
      userName: '',
      isInRoom: false,
      lastUpdated: new Date()
    };

    // 合并状态
    const updatedState: UserState = {
      ...existingState,
      ...state,
      lastUpdated: new Date()
    };

    this.userStates.set(userId, updatedState);
  }

  /**
   * 恢复用户状态
   */
  public restoreUserState(userId: string): UserState | null {
    return this.userStates.get(userId) || null;
  }

  /**
   * 更新用户房间状态
   */
  public updateUserRoomState(userId: string, roomId: string, user: Player): void {
    this.saveUserState(userId, {
      userName: user.name,
      roomId,
      isInRoom: true,
      roomState: {
        ready: user.ready,
        cards: user.cards,
        cardCount: user.cardCount || 0,
        isLandlord: false // 这个需要从房间状态获取
      }
    });
  }

  /**
   * 移除用户房间状态（离开房间时）
   */
  public removeUserRoomState(userId: string): void {
    const state = this.userStates.get(userId);
    if (state) {
      this.saveUserState(userId, {
        roomId: undefined,
        isInRoom: false,
        roomState: undefined
      });
    }
  }

  /**
   * 设置用户为地主状态
   */
  public setUserAsLandlord(userId: string, cards: string[]): void {
    const state = this.userStates.get(userId);
    if (state && state.roomState) {
      state.roomState.isLandlord = true;
      state.roomState.cards = cards;
      state.roomState.cardCount = cards.length;
      state.lastUpdated = new Date();
      this.userStates.set(userId, state);
    }
  }

  /**
   * 更新用户手牌
   */
  public updateUserCards(userId: string, cards: string[]): void {
    const state = this.userStates.get(userId);
    if (state && state.roomState) {
      state.roomState.cards = cards;
      state.roomState.cardCount = cards.length;
      state.lastUpdated = new Date();
      this.userStates.set(userId, state);
    }
  }

  /**
   * 获取所有需要恢复状态的用户
   */
  public getUsersNeedingRecovery(): UserState[] {
    return Array.from(this.userStates.values()).filter(
      state => state.isInRoom && state.roomId
    );
  }

  /**
   * 清理过期状态
   */
  public cleanupExpiredStates(maxAgeMinutes: number = 30): number {
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    let cleanedCount = 0;

    for (const [userId, state] of this.userStates.entries()) {
      if (state.lastUpdated < cutoffTime) {
        this.userStates.delete(userId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * 完全移除用户状态
   */
  public removeUserState(userId: string): boolean {
    return this.userStates.delete(userId);
  }

  /**
   * 获取状态统计信息
   */
  public getStateStats(): {
    total: number;
    inRooms: number;
    waitingRecovery: number;
  } {
    const states = Array.from(this.userStates.values());
    return {
      total: states.length,
      inRooms: states.filter(s => s.isInRoom).length,
      waitingRecovery: states.filter(s => s.isInRoom && s.roomId).length
    };
  }
}
