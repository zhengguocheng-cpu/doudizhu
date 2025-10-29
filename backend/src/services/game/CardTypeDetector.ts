/**
 * 牌型识别器
 * 负责识别各种斗地主牌型
 */

export enum CardType {
  SINGLE = 'single',                          // 单张
  PAIR = 'pair',                              // 对子
  TRIPLE = 'triple',                          // 三张
  TRIPLE_WITH_SINGLE = 'triple_with_single',  // 三带一
  TRIPLE_WITH_PAIR = 'triple_with_pair',      // 三带二
  STRAIGHT = 'straight',                      // 顺子
  CONSECUTIVE_PAIRS = 'consecutive_pairs',    // 连对
  AIRPLANE = 'airplane',                      // 飞机
  AIRPLANE_WITH_WINGS = 'airplane_with_wings', // 飞机带翅膀
  FOUR_WITH_TWO = 'four_with_two',            // 四带二
  BOMB = 'bomb',                              // 炸弹
  ROCKET = 'rocket',                          // 王炸
  INVALID = 'invalid'                         // 无效牌型
}

export interface CardPattern {
  type: CardType;
  value: number;      // 主牌值（用于比较大小）
  cards: string[];    // 牌面
  length?: number;    // 顺子/连对/飞机的长度
  description?: string; // 牌型描述（用于前端显示）
}

/**
 * 牌型描述映射
 */
const CARD_TYPE_DESCRIPTIONS: { [key in CardType]: string } = {
  [CardType.SINGLE]: '单牌',
  [CardType.PAIR]: '对子',
  [CardType.TRIPLE]: '三张',
  [CardType.TRIPLE_WITH_SINGLE]: '三带一',
  [CardType.TRIPLE_WITH_PAIR]: '三带二',
  [CardType.STRAIGHT]: '顺子',
  [CardType.CONSECUTIVE_PAIRS]: '连对',
  [CardType.AIRPLANE]: '飞机',
  [CardType.AIRPLANE_WITH_WINGS]: '飞机带翅膀',
  [CardType.FOUR_WITH_TWO]: '四带二',
  [CardType.BOMB]: '炸弹',
  [CardType.ROCKET]: '王炸',
  [CardType.INVALID]: '无效牌型'
};

/**
 * 牌面值映射
 */
const CARD_VALUES: { [key: string]: number } = {
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 11,
  'Q': 12,
  'K': 13,
  'A': 14,
  '2': 15,
  '小王': 16,
  '大王': 17
};

export class CardTypeDetector {
  /**
   * 检测牌型
   */
  public static detect(cards: string[]): CardPattern {
    if (!cards || cards.length === 0) {
      return { type: CardType.INVALID, value: 0, cards: [] };
    }

    // 按优先级检测牌型
    const pattern = (
      this.isRocket(cards) ||
      this.isBomb(cards) ||
      this.isStraight(cards) ||
      this.isConsecutivePairs(cards) ||
      this.isAirplane(cards) ||
      this.isAirplaneWithWings(cards) ||
      this.isFourWithTwo(cards) ||
      this.isTripleWithPair(cards) ||
      this.isTripleWithSingle(cards) ||
      this.isTriple(cards) ||
      this.isPair(cards) ||
      this.isSingle(cards) ||
      { type: CardType.INVALID, value: 0, cards }
    );
    
    // 添加描述
    if (pattern && !pattern.description) {
      pattern.description = CARD_TYPE_DESCRIPTIONS[pattern.type];
    }
    
    return pattern;
  }

  /**
   * 获取牌的数值
   */
  public static getCardValue(card: string): number {
    // 移除花色符号和🃏符号，只保留数字/字母
    const rank = card.replace(/[♠♥♣♦🃏]/g, '');
    return CARD_VALUES[rank] || 0;
  }

  /**
   * 获取牌的点数（不含花色）
   */
  private static getCardRank(card: string): string {
    // 移除花色符号和🃏符号
    return card.replace(/[♠♥♣♦🃏]/g, '');
  }

  /**
   * 统计每个点数的数量
   */
  private static countCards(cards: string[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const card of cards) {
      const rank = this.getCardRank(card);
      counts.set(rank, (counts.get(rank) || 0) + 1);
    }
    return counts;
  }

  /**
   * 单张
   */
  private static isSingle(cards: string[]): CardPattern | null {
    if (cards.length !== 1) return null;
    return {
      type: CardType.SINGLE,
      value: this.getCardValue(cards[0]),
      cards
    };
  }

  /**
   * 对子
   */
  private static isPair(cards: string[]): CardPattern | null {
    if (cards.length !== 2) return null;
    
    const rank1 = this.getCardRank(cards[0]);
    const rank2 = this.getCardRank(cards[1]);
    
    if (rank1 === rank2) {
      return {
        type: CardType.PAIR,
        value: this.getCardValue(cards[0]),
        cards
      };
    }
    
    return null;
  }

  /**
   * 三张
   */
  private static isTriple(cards: string[]): CardPattern | null {
    if (cards.length !== 3) return null;
    
    const counts = this.countCards(cards);
    if (counts.size === 1 && counts.values().next().value === 3) {
      return {
        type: CardType.TRIPLE,
        value: this.getCardValue(cards[0]),
        cards
      };
    }
    
    return null;
  }

  /**
   * 三带一
   */
  private static isTripleWithSingle(cards: string[]): CardPattern | null {
    if (cards.length !== 4) return null;
    
    const counts = this.countCards(cards);
    if (counts.size !== 2) return null;
    
    const countsArray = Array.from(counts.entries());
    const [rank1, count1] = countsArray[0];
    const [rank2, count2] = countsArray[1];
    
    if ((count1 === 3 && count2 === 1) || (count1 === 1 && count2 === 3)) {
      const tripleRank = count1 === 3 ? rank1 : rank2;
      return {
        type: CardType.TRIPLE_WITH_SINGLE,
        value: CARD_VALUES[tripleRank],
        cards
      };
    }
    
    return null;
  }

  /**
   * 三带二
   */
  private static isTripleWithPair(cards: string[]): CardPattern | null {
    if (cards.length !== 5) return null;
    
    const counts = this.countCards(cards);
    if (counts.size !== 2) return null;
    
    const countsArray = Array.from(counts.entries());
    const [rank1, count1] = countsArray[0];
    const [rank2, count2] = countsArray[1];
    
    if ((count1 === 3 && count2 === 2) || (count1 === 2 && count2 === 3)) {
      const tripleRank = count1 === 3 ? rank1 : rank2;
      return {
        type: CardType.TRIPLE_WITH_PAIR,
        value: CARD_VALUES[tripleRank],
        cards
      };
    }
    
    return null;
  }

  /**
   * 顺子（至少5张连续单牌，不能包含2和王）
   */
  private static isStraight(cards: string[]): CardPattern | null {
    if (cards.length < 5) return null;
    
    // 不能包含2和王
    for (const card of cards) {
      const rank = this.getCardRank(card);
      if (rank === '2' || rank === '小王' || rank === '大王') {
        return null;
      }
    }
    
    // 获取所有牌的值并排序
    const values = cards.map(card => this.getCardValue(card)).sort((a, b) => a - b);
    
    // 检查是否连续
    for (let i = 1; i < values.length; i++) {
      if (values[i] !== values[i - 1] + 1) {
        return null;
      }
    }
    
    return {
      type: CardType.STRAIGHT,
      value: values[values.length - 1], // 最大牌的值
      cards,
      length: cards.length
    };
  }

  /**
   * 连对（至少3对连续对子，不能包含2和王）
   */
  private static isConsecutivePairs(cards: string[]): CardPattern | null {
    if (cards.length < 6 || cards.length % 2 !== 0) return null;
    
    const counts = this.countCards(cards);
    
    // 每个点数必须恰好2张
    for (const count of counts.values()) {
      if (count !== 2) return null;
    }
    
    // 不能包含2和王
    for (const rank of counts.keys()) {
      if (rank === '2' || rank === '小王' || rank === '大王') {
        return null;
      }
    }
    
    // 检查是否连续
    const values = Array.from(counts.keys())
      .map(rank => CARD_VALUES[rank])
      .sort((a, b) => a - b);
    
    for (let i = 1; i < values.length; i++) {
      if (values[i] !== values[i - 1] + 1) {
        return null;
      }
    }
    
    return {
      type: CardType.CONSECUTIVE_PAIRS,
      value: values[values.length - 1],
      cards,
      length: values.length
    };
  }

  /**
   * 飞机（至少2个连续三张，不能包含2和王）
   */
  private static isAirplane(cards: string[]): CardPattern | null {
    if (cards.length < 6 || cards.length % 3 !== 0) return null;
    
    const counts = this.countCards(cards);
    
    // 每个点数必须恰好3张
    for (const count of counts.values()) {
      if (count !== 3) return null;
    }
    
    // 不能包含2和王
    for (const rank of counts.keys()) {
      if (rank === '2' || rank === '小王' || rank === '大王') {
        return null;
      }
    }
    
    // 检查是否连续
    const values = Array.from(counts.keys())
      .map(rank => CARD_VALUES[rank])
      .sort((a, b) => a - b);
    
    if (values.length < 2) return null;
    
    for (let i = 1; i < values.length; i++) {
      if (values[i] !== values[i - 1] + 1) {
        return null;
      }
    }
    
    return {
      type: CardType.AIRPLANE,
      value: values[values.length - 1],
      cards,
      length: values.length
    };
  }

  /**
   * 飞机带翅膀（飞机+单牌或对子）
   */
  private static isAirplaneWithWings(cards: string[]): CardPattern | null {
    // 简化实现：暂不支持
    // 完整实现需要复杂的组合判断
    return null;
  }

  /**
   * 四带二（4张+2张单牌或2对）
   */
  private static isFourWithTwo(cards: string[]): CardPattern | null {
    if (cards.length !== 6 && cards.length !== 8) return null;
    
    const counts = this.countCards(cards);
    
    // 必须有一个4张
    let fourRank: string | null = null;
    for (const [rank, count] of counts.entries()) {
      if (count === 4) {
        fourRank = rank;
        break;
      }
    }
    
    if (!fourRank) return null;
    
    // 6张：4+1+1 或 4+2
    // 8张：4+2+2
    if (cards.length === 6) {
      // 可以是4+1+1或4+2
      return {
        type: CardType.FOUR_WITH_TWO,
        value: CARD_VALUES[fourRank],
        cards
      };
    } else {
      // 必须是4+2+2
      const otherCounts = Array.from(counts.values()).filter(c => c !== 4);
      if (otherCounts.length === 2 && otherCounts.every(c => c === 2)) {
        return {
          type: CardType.FOUR_WITH_TWO,
          value: CARD_VALUES[fourRank],
          cards
        };
      }
    }
    
    return null;
  }

  /**
   * 炸弹（4张相同）
   */
  private static isBomb(cards: string[]): CardPattern | null {
    if (cards.length !== 4) return null;
    
    const counts = this.countCards(cards);
    if (counts.size === 1 && counts.values().next().value === 4) {
      return {
        type: CardType.BOMB,
        value: this.getCardValue(cards[0]),
        cards
      };
    }
    
    return null;
  }

  /**
   * 王炸（大王+小王）
   */
  private static isRocket(cards: string[]): CardPattern | null {
    if (cards.length !== 2) return null;
    
    const ranks = cards.map(card => this.getCardRank(card)).sort();
    if (ranks[0] === '大王' && ranks[1] === '小王') {
      return {
        type: CardType.ROCKET,
        value: 17, // 王炸最大
        cards
      };
    }
    
    return null;
  }
}
