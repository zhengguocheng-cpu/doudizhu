"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cardService_1 = require("./cardService");
console.log('=== 智能发牌示例 ===');
try {
    const dealResult = cardService_1.cardService.dealCards(3);
    console.log(`为3个玩家发牌:`);
    dealResult.playerCards.forEach((cards, index) => {
        console.log(`玩家${index + 1}: ${cards.length}张牌`);
        console.log(`手牌: ${cardService_1.cardService.getCardsDisplayNames(cards.map((c) => `${c.suit}${c.rank}`))}`);
    });
    console.log(`底牌: ${cardService_1.cardService.getCardsDisplayNames(dealResult.bottomCards.map((c) => `${c.suit}${c.rank}`))}`);
}
catch (error) {
    console.error('发牌失败:', error);
}
console.log('\n=== 出牌验证示例 ===');
const sampleCards = ['hearts3', 'hearts4', 'hearts5'];
const validation = cardService_1.cardService.validatePlay(sampleCards, ['hearts3', 'hearts4']);
console.log(`验证出牌 [${sampleCards.join(', ')}]:`);
console.log(`结果: ${validation.valid ? '✅ 有效' : '❌ 无效'}`);
if (!validation.valid) {
    console.log(`错误: ${validation.error}`);
}
console.log('\n=== 牌面显示示例 ===');
const cardStrings = ['heartsA', 'spadesK', 'clubsQ', 'diamondsJ', '🃏'];
console.log('原始牌:', cardStrings);
console.log('友好显示:', cardStrings.map(card => cardService_1.cardService.getCardDisplayName(card)));
console.log('\n=== 洗牌公平性验证 ===');
const isFair = cardService_1.cardService.validateShuffleFairness(1000);
console.log(`洗牌算法公平性测试 (1000次洗牌): ${isFair ? '✅ 通过' : '❌ 失败'}`);
//# sourceMappingURL=example.js.map