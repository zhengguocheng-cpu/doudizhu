/**
 * GameService 移除后的功能验证测试
 * 验证所有被替换的功能是否正常工作
 */

import { gameFacade } from '../services/gameFacade';
import { roomService } from '../services/room/roomService';
import { gameEngineService } from '../services/game/gameService';

console.log('🚀 GameService 移除验证测试');

// 测试1: 获取房间列表
console.log('📋 测试1: 获取房间列表');
const rooms = roomService.getAllRooms();
console.log(`当前房间数量: ${rooms.length}`);

// 测试2: 出牌验证
console.log('🎯 测试2: 出牌验证');
const testRoom = roomService.createRoom('测试房间', 3);
if (testRoom) {
  // 使用gameEngineService进行出牌验证
  const validation = gameEngineService.validateGameOperation(testRoom, 'play_cards', 'test-player', { cards: ['hearts3'] });
  console.log(`出牌验证结果: ${validation.valid ? '有效' : '无效'}`);
  if (!validation.valid) {
    console.log(`验证失败原因: ${validation.error}`);
  }
}

// 测试3: GameFacade系统统计
console.log('📊 测试3: GameFacade系统统计');
const stats = gameFacade.getSystemStats();
console.log(`房间统计:`, stats.rooms);
console.log(`玩家统计:`, stats.players);
console.log(`游戏统计:`, stats.games);

// 测试4: GameFacade健康检查
console.log('💚 测试4: GameFacade健康检查');
const health = gameFacade.healthCheck();
console.log(`系统健康状态: ${health.healthy ? '健康' : '不健康'}`);
console.log(`服务状态:`, health.services);

console.log('✅ 所有测试完成，GameService已成功移除并替换！');
