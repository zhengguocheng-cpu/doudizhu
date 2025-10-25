import { Card } from '../../types';
import { CardGenerator } from './cardGenerator';
import { CardShuffler } from './cardShuffler';
import { CardValidator } from './cardValidator';

/**
 * 卡牌服务 - 统一管理所有扑克牌相关操作
 * 提供完整的斗地主扑克牌功能
 */
export class CardService {
  private static readonly CARDS_PER_PLAYER = 17;
  private static readonly BOTTOM_CARDS_COUNT = 3;

  /**
   * 创建一副洗好的扑克牌
   */
  public createShuffledDeck(): Card[] {
    const deck = CardGenerator.generateDeck();
    return CardShuffler.shuffle(deck);
  }

  /**
   * 为指定数量的玩家发牌
   */
  public dealCards(playerCount: number): {
    playerCards: Card[][];
    bottomCards: Card[];
  } {
    // 验证玩家数量
    if (!CardValidator.validateRoomPlayerCount(playerCount)) {
      throw new Error('玩家数量不符合斗地主规则（3-6人）');
    }

    const deck = this.createShuffledDeck();
    const totalCards = deck.length;
    const cardsPerPlayer = Math.floor(totalCards / playerCount);

    const playerCards: Card[][] = [];
    const bottomCards: Card[] = [];

    // 发牌给玩家
    for (let i = 0; i < playerCount; i++) {
      const startIndex = i * cardsPerPlayer;
      const endIndex = startIndex + cardsPerPlayer;
      playerCards.push(deck.slice(startIndex, endIndex));
    }

    // 剩余的3张作为底牌
    const remainingStart = playerCount * cardsPerPlayer;
    bottomCards.push(...deck.slice(remainingStart));

    return { playerCards, bottomCards };
  }

  /**
   * 验证玩家出牌
   */
  public validatePlay(
    playerCards: string[],
    playedCards: string[]
  ): { valid: boolean; error?: string } {
    try {
      // 验证出牌数量
      if (!CardValidator.validateCardCount(playedCards)) {
        return { valid: false, error: '出牌数量不符合规则' };
      }

      // 验证玩家是否拥有这些牌
      if (!CardValidator.validatePlayerCards(playerCards, playedCards)) {
        return { valid: false, error: '玩家不拥有这些牌' };
      }

      // 验证牌字符串格式
      for (const card of playedCards) {
        if (!CardValidator.isValidCardString(card)) {
          return { valid: false, error: '包含无效的牌' };
        }
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : '出牌验证失败'
      };
    }
  }

  /**
   * 比较两组牌的大小（简化版，用于后续牌型判断）
   */
  public compareCardGroups(cards1: string[], cards2: string[]): number {
    if (cards1.length === 0 && cards2.length === 0) return 0;
    if (cards1.length === 0) return -1;
    if (cards2.length === 0) return 1;

    // 简化比较：取第一张牌的数值
    const value1 = CardValidator.getCardValue(cards1[0]);
    const value2 = CardValidator.getCardValue(cards2[0]);

    if (value1 > value2) return 1;
    if (value1 < value2) return -1;
    return 0;
  }

  /**
   * 获取牌的显示名称
   */
  public getCardDisplayName(cardString: string): string {
    try {
      const card = CardGenerator.stringToCard(cardString);
      const suit = CardGenerator.getSuitDisplayName(card.suit);
      const rank = CardGenerator.getRankDisplayName(card.rank);
      return `${suit}${rank}`;
    } catch {
      return cardString; // 如果解析失败，返回原字符串
    }
  }

  /**
   * 获取多张牌的显示名称
   */
  public getCardsDisplayNames(cardStrings: string[]): string[] {
    return cardStrings.map(card => this.getCardDisplayName(card));
  }

  /**
   * 验证洗牌的公平性（用于测试）
   */
  public validateShuffleFairness(shuffles: number = 1000): boolean {
    const deck = CardGenerator.generateDeck();
    const result = CardShuffler.validateShuffleFairness(deck, shuffles);
    return result.isFair;
  }
}

// 导出单例实例
export const cardService = new CardService();
