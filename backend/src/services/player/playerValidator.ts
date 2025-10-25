import { Player, GameRoom } from '../../types';

/**
 * 玩家验证器服务
 * 负责验证玩家状态、权限和操作的合法性
 */
export class PlayerValidator {
  /**
   * 验证玩家是否存在
   */
  public static validatePlayerExists(player: Player | undefined): boolean {
    return player !== undefined;
  }

  /**
   * 验证玩家是否在房间中
   */
  public static validatePlayerInRoom(room: GameRoom, playerId: string): { valid: boolean; error?: string } {
    const player = room.players.find(p => p.id === playerId);
    if (!this.validatePlayerExists(player)) {
      return { valid: false, error: '玩家不在房间中' };
    }
    return { valid: true };
  }

  /**
   * 验证玩家是否可以准备
   */
  public static validatePlayerCanReady(room: GameRoom, playerId: string): { valid: boolean; error?: string } {
    // 检查玩家是否存在
    const playerValidation = this.validatePlayerInRoom(room, playerId);
    if (!playerValidation.valid) {
      return playerValidation;
    }

    // 检查房间状态
    if (room.status !== 'waiting') {
      return { valid: false, error: '游戏已开始，不能改变准备状态' };
    }

    // 检查玩家是否已经有手牌（游戏进行中）
    const player = room.players.find(p => p.id === playerId);
    if (player && player.cards && player.cards.length > 0) {
      return { valid: false, error: '游戏进行中，不能改变准备状态' };
    }

    return { valid: true };
  }

  /**
   * 验证玩家是否可以离开房间
   */
  public static validatePlayerCanLeave(room: GameRoom, playerId: string): { valid: boolean; error?: string } {
    // 检查玩家是否存在
    const playerValidation = this.validatePlayerInRoom(room, playerId);
    if (!playerValidation.valid) {
      return playerValidation;
    }

    // 如果游戏进行中且玩家是地主，验证是否可以离开
    if (room.status === 'playing' && room.landlord?.id === playerId) {
      return { valid: false, error: '地主不能离开游戏进行中' };
    }

    // 如果游戏进行中，警告玩家但允许离开
    if (room.status === 'playing') {
      return { valid: true }; // 警告：游戏进行中离开将丢失进度
    }

    return { valid: true };
  }

  /**
   * 验证玩家是否可以出牌
   */
  public static validatePlayerCanPlay(room: GameRoom, playerId: string): { valid: boolean; error?: string } {
    // 检查房间状态
    if (room.status !== 'playing') {
      return { valid: false, error: '游戏未开始或已结束' };
    }

    // 检查玩家是否存在
    const playerValidation = this.validatePlayerInRoom(room, playerId);
    if (!playerValidation.valid) {
      return playerValidation;
    }

    // 检查是否轮到该玩家
    if (room.currentPlayerIndex !== -1) {
      const currentPlayerIndex = room.players.findIndex(p => p.id === playerId);
      if (currentPlayerIndex !== room.currentPlayerIndex) {
        return { valid: false, error: '还没轮到你出牌' };
      }
    }

    // 检查玩家手牌
    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.cards || player.cards.length === 0) {
      return { valid: false, error: '没有手牌' };
    }

    return { valid: true };
  }

  /**
   * 验证玩家是否可以抢地主
   */
  public static validatePlayerCanGrabLandlord(room: GameRoom, playerId: string): { valid: boolean; error?: string } {
    // 检查房间状态
    if (room.status !== 'playing') {
      return { valid: false, error: '游戏状态不正确' };
    }

    // 检查是否已经有地主
    if (room.landlord) {
      return { valid: false, error: '已经确定地主' };
    }

    // 检查玩家是否存在
    const playerValidation = this.validatePlayerInRoom(room, playerId);
    if (!playerValidation.valid) {
      return playerValidation;
    }

    // 检查玩家手牌
    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.cards || player.cards.length === 0) {
      return { valid: false, error: '没有手牌' };
    }

    return { valid: true };
  }

  /**
   * 验证玩家是否可以跳过回合
   */
  public static validatePlayerCanPass(room: GameRoom, playerId: string): { valid: boolean; error?: string } {
    // 检查房间状态
    if (room.status !== 'playing') {
      return { valid: false, error: '游戏未开始或已结束' };
    }

    // 检查玩家是否存在
    const playerValidation = this.validatePlayerInRoom(room, playerId);
    if (!playerValidation.valid) {
      return playerValidation;
    }

    // 检查是否轮到该玩家
    if (room.currentPlayerIndex !== -1) {
      const currentPlayerIndex = room.players.findIndex(p => p.id === playerId);
      if (currentPlayerIndex !== room.currentPlayerIndex) {
        return { valid: false, error: '还没轮到你出牌' };
      }
    }

    return { valid: true };
  }

  /**
   * 验证玩家名称
   */
  public static validatePlayerName(name: string): { valid: boolean; error?: string } {
    // 验证名称长度
    if (!name || name.trim().length === 0) {
      return { valid: false, error: '玩家名称不能为空' };
    }

    if (name.length > 20) {
      return { valid: false, error: '玩家名称不能超过20个字符' };
    }

    // 验证名称格式
    if (name.trim().length !== name.length) {
      return { valid: false, error: '玩家名称不能以空格开头或结尾' };
    }

    // 验证不允许的字符
    const invalidChars = /[<>"/\\|?*]/;
    if (invalidChars.test(name)) {
      return { valid: false, error: '玩家名称包含不允许的字符' };
    }

    return { valid: true };
  }

  /**
   * 验证玩家手牌
   */
  public static validatePlayerCards(playerCards: string[] | undefined, playedCards: string[]): { valid: boolean; error?: string } {
    if (!playerCards || !playedCards) {
      return { valid: false, error: '玩家手牌或出牌信息不完整' };
    }

    // 检查是否有重复的牌
    const cardCounts: { [key: string]: number } = {};
    for (const card of playedCards) {
      cardCounts[card] = (cardCounts[card] || 0) + 1;
      if (cardCounts[card] > 1) {
        return { valid: false, error: '不能出重复的牌' };
      }
    }

    // 验证玩家是否有这些牌
    for (const card of playedCards) {
      if (!playerCards.includes(card)) {
        return { valid: false, error: '玩家没有这张牌' };
      }
    }

    return { valid: true };
  }

  /**
   * 检查玩家是否已准备
   */
  public static isPlayerReady(player: Player): boolean {
    return player.ready === true;
  }

  /**
   * 检查玩家是否是地主
   */
  public static isPlayerLandlord(room: GameRoom, playerId: string): boolean {
    return room.landlord?.id === playerId;
  }

  /**
   * 检查玩家是否是当前玩家
   */
  public static isPlayerCurrentTurn(room: GameRoom, playerId: string): boolean {
    if (room.currentPlayerIndex === -1) return false;
    return room.players[room.currentPlayerIndex]?.id === playerId;
  }

  /**
   * 获取玩家的房间位置
   */
  public static getPlayerPosition(room: GameRoom, playerId: string): number {
    return room.players.findIndex(p => p.id === playerId);
  }

  /**
   * 获取玩家的状态描述
   */
  public static getPlayerStatusDescription(player: Player, isCurrentTurn: boolean = false): string {
    if (player.ready) {
      if (isCurrentTurn) {
        return '已准备 (轮到你)';
      }
      return '已准备';
    } else {
      if (isCurrentTurn) {
        return '未准备 (轮到你)';
      }
      return '未准备';
    }
  }
}
