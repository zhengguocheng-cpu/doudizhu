import { Card } from '../../types';

/**
 * 扑克牌验证器服务
 * 负责验证牌型、检查出牌规则等
 */
export class CardValidator {
  /**
   * 验证玩家是否拥有指定的牌
   */
  public static validatePlayerCards(playerCards: string[], playedCards: string[]): boolean {
    for (const card of playedCards) {
      if (!playerCards.includes(card)) {
        return false;
      }
    }
    return true;
  }

  /**
   * 验证出牌数量是否合理
   */
  public static validateCardCount(cards: string[]): boolean {
    return cards.length > 0 && cards.length <= 20; // 斗地主最多20张牌
  }

  /**
   * 检查是否是有效的扑克牌字符串
   */
  public static isValidCardString(cardString: string): boolean {
    if (cardString.length < 2 || cardString.length > 3) {
      return false;
    }

    // 检查大小王
    if (cardString.includes('🃏') || cardString.includes('🂠')) {
      return true;
    }

    // 检查普通牌
    const suit = cardString.slice(0, -1);
    const rank = cardString.slice(-1);

    const validSuits = ['hearts', 'diamonds', 'clubs', 'spades', '♠', '♥', '♣', '♦'];
    const validRanks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];

    return validSuits.some(s => suit.includes(s.slice(0, 1))) && validRanks.includes(rank);
  }

  /**
   * 验证房间玩家数量是否符合斗地主规则
   */
  public static validateRoomPlayerCount(playerCount: number): boolean {
    return playerCount >= 3 && playerCount <= 6; // 斗地主3-6人
  }

  /**
   * 验证玩家是否可以开始游戏（准备状态）
   */
  public static validateGameStartConditions(players: any[]): boolean {
    if (players.length < 3) return false;

    // 所有玩家都必须准备
    return players.every(player => player.ready === true);
  }

  /**
   * 验证出牌是否为空（过牌）
   */
  public static isPass(cards: string[]): boolean {
    return !cards || cards.length === 0;
  }

  /**
   * 获取牌的数值（用于比较）
   */
  public static getCardValue(cardString: string): number {
    if (cardString.includes('🃏') || cardString.includes('🂠')) {
      return cardString.includes('🂠') ? 17 : 16; // 大王17，小王16
    }

    const rank = cardString.slice(-1);
    const rankValues: Record<string, number> = {
      '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
      'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15
    };

    return rankValues[rank] || 0;
  }

  /**
   * 比较两张牌的大小
   */
  public static compareCards(card1: string, card2: string): number {
    const value1 = this.getCardValue(card1);
    const value2 = this.getCardValue(card2);

    if (value1 > value2) return 1;
    if (value1 < value2) return -1;
    return 0;
  }
}
