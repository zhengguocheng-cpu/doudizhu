/**
 * 测试三带一牌型识别
 * 测试3个A带1个3的情况
 */

const { CardTypeDetector } = require('./dist/src/services/game/CardTypeDetector');

console.log('🧪 测试三带一牌型识别\n');

// 测试用例1: 3个A + 1个3
const testCase1 = ['♠A', '♥A', '♣A', '♦3'];
console.log('测试用例1: 3个A + 1个3');
console.log('输入:', testCase1);

try {
  const result1 = CardTypeDetector.detect(testCase1);
  console.log('结果:', result1);
  console.log('牌型:', result1.type);
  console.log('值:', result1.value);
  console.log('✅ 测试通过\n');
} catch (error) {
  console.error('❌ 测试失败:', error.message);
  console.error('错误详情:', error);
  console.log('');
}

// 测试用例2: 3个7 + 1个4
const testCase2 = ['♠7', '♥7', '♣7', '♦4'];
console.log('测试用例2: 3个7 + 1个4');
console.log('输入:', testCase2);

try {
  const result2 = CardTypeDetector.detect(testCase2);
  console.log('结果:', result2);
  console.log('牌型:', result2.type);
  console.log('值:', result2.value);
  console.log('✅ 测试通过\n');
} catch (error) {
  console.error('❌ 测试失败:', error.message);
  console.error('错误详情:', error);
  console.log('');
}

// 测试用例3: 3个K + 1个2
const testCase3 = ['♠K', '♥K', '♣K', '♦2'];
console.log('测试用例3: 3个K + 1个2');
console.log('输入:', testCase3);

try {
  const result3 = CardTypeDetector.detect(testCase3);
  console.log('结果:', result3);
  console.log('牌型:', result3.type);
  console.log('值:', result3.value);
  console.log('✅ 测试通过\n');
} catch (error) {
  console.error('❌ 测试失败:', error.message);
  console.error('错误详情:', error);
  console.log('');
}

// 测试用例4: 错误的牌型（4个相同）
const testCase4 = ['♠A', '♥A', '♣A', '♦A'];
console.log('测试用例4: 4个A（应该识别为炸弹）');
console.log('输入:', testCase4);

try {
  const result4 = CardTypeDetector.detect(testCase4);
  console.log('结果:', result4);
  console.log('牌型:', result4.type);
  console.log('值:', result4.value);
  if (result4.type === 'bomb') {
    console.log('✅ 正确识别为炸弹\n');
  } else {
    console.log('❌ 应该识别为炸弹\n');
  }
} catch (error) {
  console.error('❌ 测试失败:', error.message);
  console.error('错误详情:', error);
  console.log('');
}

console.log('🎯 测试完成');
