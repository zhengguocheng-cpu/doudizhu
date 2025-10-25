import { Card } from '../../types';

/**
 * 扑克牌生成器服务
 * 负责生成标准的一副扑克牌
 */
export class CardGenerator {
  private static readonly SUITS: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  private static readonly RANKS: Card['rank'][] = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];

  /**
   * 生成一副标准的54张扑克牌（包括大小王）
   */
  public static generateDeck(): Card[] {
    const cards: Card[] = [];

    // 生成普通扑克牌（52张）
    this.SUITS.forEach(suit => {
      this.RANKS.forEach(rank => {
        cards.push({ suit, rank });
      });
    });

    // 添加大小王（黑红桃2作为大小王）
    cards.push(
      { suit: 'hearts', rank: '2' },   // 大王
      { suit: 'diamonds', rank: '2' }  // 小王
    );

    return cards;
  }

  /**
   * 生成指定数量的扑克牌
   */
  public static generateCards(count: number): Card[] {
    const fullDeck = this.generateDeck();
    return fullDeck.slice(0, Math.min(count, fullDeck.length));
  }

  /**
   * 生成去掉大小王的扑克牌
   */
  public static generateStandardDeck(): Card[] {
    return this.SUITS.flatMap(suit =>
      this.RANKS.map(rank => ({ suit, rank } as Card))
    );
  }

  /**
   * 获取花色名称（用于显示）
   */
  public static getSuitDisplayName(suit: Card['suit']): string {
    const suitNames: Record<Card['suit'], string> = {
      'hearts': '♥',
      'diamonds': '♦',
      'clubs': '♣',
      'spades': '♠'
    };
    return suitNames[suit] || suit;
  }

  /**
   * 获取牌面名称（用于显示）
   */
  public static getRankDisplayName(rank: Card['rank']): string {
    const rankNames: Record<string, string> = {
      'J': 'J',
      'Q': 'Q',
      'K': 'K',
      'A': 'A',
      '2': '2'
    };
    return rankNames[rank] || rank;
  }

  /**
   * 将Card对象转换为字符串表示
   */
  public static cardToString(card: Card): string {
    return `${card.suit}${card.rank}`;
  }

  /**
   * 将字符串转换为Card对象
   */
  public static stringToCard(cardString: string): Card {
    if (cardString.length < 2) {
      throw new Error('无效的卡牌字符串');
    }

    const suit = cardString.slice(0, -1) as Card['suit'];
    const rank = cardString.slice(-1) as Card['rank'];

    // 特殊处理大小王
    if (cardString.includes('🃏') || cardString.includes('🂠')) {
      return { suit: 'hearts', rank: '2' };
    }

    return { suit, rank };
  }
}
