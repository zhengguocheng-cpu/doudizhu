#!/usr/bin/env node

/**
 * 简单的Phase 2验证脚本
 */

import { gameConfig } from './src/config';

async function simpleTest() {
  console.log('🔧 简单配置测试');

  try {
    console.log(`✅ 服务器端口: ${gameConfig.server.port}`);
    console.log(`✅ 最大玩家数: ${gameConfig.game.maxPlayers}`);
    console.log(`✅ 最小玩家数: ${gameConfig.game.minPlayers}`);
    console.log('✅ 配置加载成功');

    // 测试动态导入
    const { gameRoomsService } = await import('./src/services/game/gameRoomsService');
    console.log('✅ 游戏房间服务导入成功');

    const { socketEventHandler } = await import('./src/services/socket/SocketEventHandler');
    console.log('✅ Socket事件处理器导入成功');

    console.log('\n🎉 基本导入测试通过！');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

simpleTest();
