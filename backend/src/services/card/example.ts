/**
 * CardService使用示例
 *
 * 这个文件展示了如何使用新拆分的CardService模块
 */

import { cardService } from './cardService';

// 示例1: 智能发牌
console.log('=== 智能发牌示例 ===');
try {
  const dealResult = cardService.dealCards(3);
  console.log(`为3个玩家发牌:`);
  dealResult.playerCards.forEach((cards: any, index: number) => {
    console.log(`玩家${index + 1}: ${cards.length}张牌`);
    console.log(`手牌: ${cardService.getCardsDisplayNames(cards.map((c: any) => `${c.suit}${c.rank}`))}`);
  });
  console.log(`底牌: ${cardService.getCardsDisplayNames(dealResult.bottomCards.map((c: any) => `${c.suit}${c.rank}`))}`);
} catch (error) {
  console.error('发牌失败:', error);
}

// 示例2: 出牌验证
console.log('\n=== 出牌验证示例 ===');
const sampleCards = ['hearts3', 'hearts4', 'hearts5'];
const validation = cardService.validatePlay(sampleCards, ['hearts3', 'hearts4']);

console.log(`验证出牌 [${sampleCards.join(', ')}]:`);
console.log(`结果: ${validation.valid ? '✅ 有效' : '❌ 无效'}`);
if (!validation.valid) {
  console.log(`错误: ${validation.error}`);
}

// 示例3: 牌面显示
console.log('\n=== 牌面显示示例 ===');
const cardStrings = ['heartsA', 'spadesK', 'clubsQ', 'diamondsJ', '🃏'];
console.log('原始牌:', cardStrings);
console.log('友好显示:', cardStrings.map(card => cardService.getCardDisplayName(card)));

// 示例4: 洗牌公平性验证
console.log('\n=== 洗牌公平性验证 ===');
const isFair = cardService.validateShuffleFairness(1000);
console.log(`洗牌算法公平性测试 (1000次洗牌): ${isFair ? '✅ 通过' : '❌ 失败'}`);

export {};
