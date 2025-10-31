#!/usr/bin/env ts-node

/**
 * Phase 1 测试脚本
 * 运行所有基础设施组件的测试
 */

import Phase1Tester from './src/core/Phase1Tester';

async function main() {
  console.log('🔧 斗地主服务器重构 - Phase 1 测试');
  console.log('=====================================\n');

  const tester = new Phase1Tester();

  try {
    await tester.runAllTests();

    console.log(tester.generateReport());

    console.log('\n🎉 Phase 1 测试完成！可以开始Phase 2了。');
    process.exit(0);

  } catch (error) {
    console.error('\n💥 Phase 1 测试失败:', error);
    console.log('\n需要修复问题后再继续...');
    process.exit(1);
  }
}

main();
