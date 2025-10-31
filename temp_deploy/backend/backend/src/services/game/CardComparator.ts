/**
 * 牌型比较器
 * 负责比较两个牌型的大小
 */

import { CardType, CardPattern } from './CardTypeDetector';

export class CardComparator {
  /**
   * 比较两个牌型
   * @returns 1: pattern1大, -1: pattern2大, 0: 无法比较或相等
   */
  public static compare(pattern1: CardPattern, pattern2: CardPattern): number {
    // 无效牌型无法比较
    if (pattern1.type === CardType.INVALID || pattern2.type === CardType.INVALID) {
      return 0;
    }

    // 王炸最大
    if (pattern1.type === CardType.ROCKET) {
      return pattern2.type === CardType.ROCKET ? 0 : 1;
    }
    if (pattern2.type === CardType.ROCKET) {
      return -1;
    }

    // 炸弹可以压任何非炸弹牌型
    if (pattern1.type === CardType.BOMB && pattern2.type !== CardType.BOMB) {
      return 1;
    }
    if (pattern2.type === CardType.BOMB && pattern1.type !== CardType.BOMB) {
      return -1;
    }

    // 两个炸弹比较大小
    if (pattern1.type === CardType.BOMB && pattern2.type === CardType.BOMB) {
      return pattern1.value > pattern2.value ? 1 : (pattern1.value < pattern2.value ? -1 : 0);
    }

    // 其他牌型必须类型相同才能比较
    if (!this.canCompare(pattern1, pattern2)) {
      return 0;
    }

    // 比较主牌值
    if (pattern1.value > pattern2.value) {
      return 1;
    } else if (pattern1.value < pattern2.value) {
      return -1;
    } else {
      return 0;
    }
  }

  /**
   * 判断两个牌型是否可以比较
   */
  private static canCompare(pattern1: CardPattern, pattern2: CardPattern): boolean {
    // 类型必须相同
    if (pattern1.type !== pattern2.type) {
      return false;
    }

    // 对于有长度的牌型（顺子、连对、飞机），长度也必须相同
    if (pattern1.length !== undefined && pattern2.length !== undefined) {
      return pattern1.length === pattern2.length;
    }

    // 对于没有长度的牌型，牌数必须相同
    return pattern1.cards.length === pattern2.cards.length;
  }

  /**
   * 判断pattern1是否能压过pattern2
   */
  public static canBeat(pattern1: CardPattern, pattern2: CardPattern): boolean {
    return this.compare(pattern1, pattern2) === 1;
  }
}
