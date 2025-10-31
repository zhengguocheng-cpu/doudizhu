import { GameRoom, Player } from '../../types';

/**
 * 游戏规则服务
 * 负责游戏规则的验证和执行
 */
export class GameRules {
  private static readonly CARDS_PER_PLAYER = 17;
  private static readonly BOTTOM_CARDS_COUNT = 3;
  private static readonly MIN_PLAYERS = 3;
  private static readonly MAX_PLAYERS = 6;

  /**
   * 验证游戏开始条件
   */
  public static validateGameStartConditions(room: GameRoom): { valid: boolean; error?: string } {
    // 检查房间状态
    if (room.status !== 'waiting') {
      return { valid: false, error: '房间状态不正确' };
    }

    // 检查玩家数量
    if (room.players.length < this.MIN_PLAYERS || room.players.length > this.MAX_PLAYERS) {
      return { valid: false, error: `玩家数量必须在${this.MIN_PLAYERS}-${this.MAX_PLAYERS}之间` };
    }

    // 检查所有玩家是否都已准备
    const allReady = room.players.every(player => player.ready === true);
    if (!allReady) {
      return { valid: false, error: '不是所有玩家都已准备' };
    }

    // 检查玩家名称唯一性
    const names = room.players.map(p => p.name);
    const uniqueNames = new Set(names);
    if (names.length !== uniqueNames.size) {
      return { valid: false, error: '存在重复的玩家名称' };
    }

    return { valid: true };
  }

  /**
   * 验证抢地主操作
   */
  public static validateGrabLandlord(
    room: GameRoom,
    playerId: string,
    isGrab: boolean
  ): { valid: boolean; error?: string } {
    // 检查房间状态
    if (room.status !== 'playing') {
      return { valid: false, error: '游戏状态不正确' };
    }

    // 检查是否已经有地主
    if (room.landlord) {
      return { valid: false, error: '已经确定地主' };
    }

    // 检查是否轮到该玩家
    if (!this.isPlayerTurn(room, playerId)) {
      return { valid: false, error: '还没轮到你抢地主' };
    }

    // 检查玩家是否有手牌
    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.cards || player.cards.length === 0) {
      return { valid: false, error: '没有手牌' };
    }

    return { valid: true };
  }

  /**
   * 验证出牌操作
   */
  public static validatePlayCards(
    room: GameRoom,
    playerId: string,
    cards: string[]
  ): { valid: boolean; error?: string; cardType?: string } {
    // 检查房间状态
    if (room.status !== 'playing') {
      return { valid: false, error: '游戏状态不正确' };
    }

    // 检查是否有地主
    if (!room.landlord) {
      return { valid: false, error: '地主未确定' };
    }

    // 检查是否轮到该玩家
    if (!this.isPlayerTurn(room, playerId)) {
      return { valid: false, error: '还没轮到你出牌' };
    }

    // 检查玩家手牌
    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.cards) {
      return { valid: false, error: '玩家信息不完整' };
    }

    // 验证玩家是否有这些牌
    for (const card of cards) {
      if (!player.cards.includes(card)) {
        return { valid: false, error: '玩家没有这张牌' };
      }
    }

    // 验证牌型
    const cardTypeValidation = this.validateCardCombination(cards);
    if (!cardTypeValidation.valid) {
      return { valid: false, error: cardTypeValidation.error };
    }

    // 如果不是第一轮出牌，需要比较牌型
    if (room.cards.played.length > 0) {
      const lastPlayedCards = room.cards.played[room.cards.played.length - 1];
      if (lastPlayedCards.length > 0) {
        const comparison = this.compareCardCombinations(cards, lastPlayedCards);
        if (comparison === 'smaller') {
          return { valid: false, error: '牌型比上家小' };
        }
      }
    }

    return {
      valid: true,
      cardType: cardTypeValidation.cardType
    };
  }

  /**
   * 验证跳过操作
   */
  public static validatePassTurn(
    room: GameRoom,
    playerId: string
  ): { valid: boolean; error?: string } {
    // 检查房间状态
    if (room.status !== 'playing') {
      return { valid: false, error: '游戏状态不正确' };
    }

    // 检查是否有地主
    if (!room.landlord) {
      return { valid: false, error: '地主未确定' };
    }

    // 检查是否轮到该玩家
    if (!this.isPlayerTurn(room, playerId)) {
      return { valid: false, error: '还没轮到你出牌' };
    }

    // 检查是否可以跳过（有上一轮出牌且不是第一轮）
    if (room.cards.played.length === 0) {
      return { valid: false, error: '第一轮不能跳过' };
    }

    const lastPlayedCards = room.cards.played[room.cards.played.length - 1];
    if (lastPlayedCards.length === 0) {
      return { valid: false, error: '上一轮没有出牌，不能跳过' };
    }

    return { valid: true };
  }

  /**
   * 验证牌型组合
   */
  private static validateCardCombination(cards: string[]): { valid: boolean; error?: string; cardType?: string } {
    if (cards.length === 0) {
      return { valid: false, error: '不能出空牌' };
    }

    // 简单的牌型验证逻辑
    // 这里应该实现完整的斗地主牌型规则
    // 包括：单牌、对子、顺子、连对、飞机、炸弹等

    // 临时简化实现
    if (cards.length === 1) {
      return { valid: true, cardType: 'single' };
    } else if (cards.length === 2) {
      return { valid: true, cardType: 'pair' };
    } else if (cards.length === 3) {
      return { valid: true, cardType: 'triple' };
    } else if (cards.length === 4) {
      return { valid: true, cardType: 'bomb' };
    }

    return { valid: true, cardType: 'unknown' };
  }

  /**
   * 比较两个牌型组合
   */
  private static compareCardCombinations(
    cards1: string[],
    cards2: string[]
  ): 'bigger' | 'smaller' | 'equal' {
    // 简化比较逻辑
    // 实际应该根据牌型和大小进行比较

    if (cards1.length !== cards2.length) {
      return cards1.length > cards2.length ? 'bigger' : 'smaller';
    }

    // 简单的数值比较（需要改进）
    const value1 = this.getCardsValue(cards1);
    const value2 = this.getCardsValue(cards2);

    if (value1 > value2) return 'bigger';
    if (value1 < value2) return 'smaller';
    return 'equal';
  }

  /**
   * 获取牌组的数值（简化实现）
   */
  private static getCardsValue(cards: string[]): number {
    let total = 0;
    for (const card of cards) {
      total += this.getCardValue(card);
    }
    return total;
  }

  /**
   * 获取单张牌的数值（简化实现）
   */
  private static getCardValue(card: string): number {
    const rank = card.slice(-1);
    const rankValues: { [key: string]: number } = {
      'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10,
      '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
    };

    return rankValues[rank] || 0;
  }

  /**
   * 检查是否轮到该玩家
   */
  private static isPlayerTurn(room: GameRoom, playerId: string): boolean {
    const currentPlayer = room.players[room.currentPlayerIndex];
    return currentPlayer?.id === playerId;
  }

  /**
   * 获取地主分数倍数
   */
  public static getLandlordScoreMultiplier(grabCount: number): number {
    // 抢地主次数对应的倍数
    const multipliers = [1, 2, 4]; // 不抢、抢一次、抢两次
    return multipliers[grabCount] || 4;
  }

  /**
   * 检查是否是炸弹
   */
  public static isBomb(cards: string[]): boolean {
    // 简化实现：4张牌或大小王
    if (cards.length === 4) return true;
    if (cards.includes('🃏') || cards.includes('🂠')) return true;
    return false;
  }

  /**
   * 获取游戏规则配置
   */
  public static getGameConfig(): {
    cardsPerPlayer: number;
    bottomCardsCount: number;
    minPlayers: number;
    maxPlayers: number;
    maxRounds: number;
  } {
    return {
      cardsPerPlayer: this.CARDS_PER_PLAYER,
      bottomCardsCount: this.BOTTOM_CARDS_COUNT,
      minPlayers: this.MIN_PLAYERS,
      maxPlayers: this.MAX_PLAYERS,
      maxRounds: 100
    };
  }
}
