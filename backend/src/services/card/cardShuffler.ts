import { Card } from '../../types';

/**
 * 扑克牌洗牌器服务
 * 提供多种洗牌算法，确保公平性和随机性
 */
export class CardShuffler {
  /**
   * 标准洗牌算法（Fisher-Yates）
   * 时间复杂度: O(n)
   * 空间复杂度: O(1)
   */
  public static shuffle(cards: Card[]): Card[] {
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * 多次洗牌算法（增加随机性）
   */
  public static shuffleMultiple(cards: Card[], times: number = 3): Card[] {
    let shuffled = [...cards];
    for (let i = 0; i < times; i++) {
      shuffled = this.shuffle(shuffled);
    }
    return shuffled;
  }

  /**
   * 切牌算法（模拟真实洗牌）
   */
  public static cutAndShuffle(cards: Card[]): Card[] {
    if (cards.length < 2) return cards;

    // 随机切牌位置
    const cutPoint = Math.floor(Math.random() * cards.length);
    const firstHalf = cards.slice(0, cutPoint);
    const secondHalf = cards.slice(cutPoint);

    // 重新组合
    return this.shuffle([...secondHalf, ...firstHalf]);
  }

  /**
   * 完美洗牌算法（交织法）
   */
  public static perfectShuffle(cards: Card[]): Card[] {
    const n = cards.length;
    if (n < 2) return cards;

    const shuffled: Card[] = [];
    const mid = Math.floor(n / 2);

    for (let i = 0; i < mid; i++) {
      shuffled.push(cards[i]);           // 左半部分
      if (i + mid < n) {
        shuffled.push(cards[i + mid]);  // 右半部分
      }
    }

    return shuffled;
  }

  /**
   * 验证洗牌的公平性（用于测试）
   */
  public static validateShuffleFairness(
    cards: Card[],
    shuffles: number = 1000
  ): { isFair: boolean; distribution: Map<string, number> } {
    const distribution = new Map<string, number>();

    // 记录原始位置分布
    cards.forEach((card, index) => {
      const key = `${card.suit}_${card.rank}_${index}`;
      distribution.set(key, 0);
    });

    // 执行多次洗牌统计分布
    for (let i = 0; i < shuffles; i++) {
      const shuffled = this.shuffle([...cards]);
      shuffled.forEach((card, newIndex) => {
        const key = `${card.suit}_${card.rank}_${newIndex}`;
        distribution.set(key, (distribution.get(key) || 0) + 1);
      });
    }

    // 检查分布是否均匀
    const expected = shuffles / cards.length;
    const tolerance = expected * 0.1; // 10%容差

    let isFair = true;
    for (const count of distribution.values()) {
      if (Math.abs(count - expected) > tolerance) {
        isFair = false;
        break;
      }
    }

    return { isFair, distribution };
  }
}
