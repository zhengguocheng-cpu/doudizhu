/**
 * 出牌验证器
 * 负责验证出牌是否合法
 */

import { CardType, CardPattern, CardTypeDetector } from './CardTypeDetector';
import { CardComparator } from './CardComparator';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  pattern?: CardPattern;
}

export class CardPlayValidator {
  /**
   * 验证出牌是否合法
   */
  public static validate(
    playerCards: string[],
    playedCards: string[],
    lastPattern: CardPattern | null,
    isFirstPlay: boolean
  ): ValidationResult {
    // 1. 检查是否有牌
    if (!playedCards || playedCards.length === 0) {
      return { valid: false, error: '请选择要出的牌' };
    }

    // 2. 检查玩家是否拥有这些牌
    if (!this.hasCards(playerCards, playedCards)) {
      return { valid: false, error: '你没有这些牌' };
    }

    // 3. 识别牌型
    const pattern = CardTypeDetector.detect(playedCards);
    console.log('🔍 [牌型检测]', {
      cards: playedCards,
      detectedType: pattern.type,
      value: pattern.value,
      length: pattern.length
    });
    if (pattern.type === CardType.INVALID) {
      return { valid: false, error: '无效的牌型' };
    }

    // 4. 如果是首次出牌，任何合法牌型都可以
    if (isFirstPlay) {
      return { valid: true, pattern };
    }

    // 5. 如果不是首次出牌，必须能压过上家
    if (!lastPattern) {
      return { valid: false, error: '系统错误：缺少上家牌型' };
    }

    if (!this.canBeat(pattern, lastPattern)) {
      return { valid: false, error: '你的牌压不过上家' };
    }

    return { valid: true, pattern };
  }

  /**
   * 检查玩家是否拥有要出的牌
   */
  private static hasCards(playerCards: string[], playedCards: string[]): boolean {
    const playerCardsCopy = [...playerCards];
    
    for (const card of playedCards) {
      const index = playerCardsCopy.indexOf(card);
      if (index === -1) {
        return false;
      }
      playerCardsCopy.splice(index, 1);
    }
    
    return true;
  }

  /**
   * 判断新牌型是否能压过旧牌型
   */
  private static canBeat(newPattern: CardPattern, lastPattern: CardPattern): boolean {
    return CardComparator.canBeat(newPattern, lastPattern);
  }
}
