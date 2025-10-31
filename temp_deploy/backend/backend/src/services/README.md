# GameFacade - 游戏门面服务

## 📖 概述

GameFacade是斗地主游戏的统一入口服务，提供高级、便捷的游戏管理接口。它整合了所有子服务（CardService、RoomService、PlayerService、GameEngine），为客户端提供简洁易用的API。

## 🏗️ 架构设计

GameFacade作为所有游戏服务的门面模式实现：

```
┌─────────────────────────────────────┐
│           GameFacade                 │  ← 统一入口
├─────────────────────────────────────┤
│  CardService  │  RoomService  │      │
│  PlayerService│  GameEngine   │      │  ← 子服务层
└─────────────────────────────────────┘
```

## 🎯 核心功能

### **统一入口**
- ✅ 所有游戏操作的单一入口
- ✅ 简化API调用复杂度
- ✅ 统一的错误处理和响应格式

### **高级操作**
- ✅ 快速加入游戏
- ✅ 一键开始游戏
- ✅ 通用操作执行
- ✅ 完整游戏快照

### **系统管理**
- ✅ 系统统计信息
- ✅ 健康状态检查
- ✅ 资源清理功能
- ✅ 性能监控

## 🚀 使用方法

### **快速开始游戏**
```typescript
import { gameFacade } from './services/gameFacade';

// 1. 创建房间
const room = gameFacade.createGameRoom('快速房间');

// 2. 玩家快速加入
const player1 = gameFacade.quickJoinGame(room.id, '玩家1');
const player2 = gameFacade.quickJoinGame(room.id, '玩家2');
const player3 = gameFacade.quickJoinGame(room.id, '玩家3');

// 3. 所有玩家准备
gameFacade.executeGameAction(room.id, 'ready', player1.player!.id);
gameFacade.executeGameAction(room.id, 'ready', player2.player!.id);
gameFacade.executeGameAction(room.id, 'ready', player3.player!.id);

// 4. 开始游戏
const startResult = gameFacade.executeGameAction(room.id, 'start', player1.player!.id);
if (startResult.success) {
  console.log('游戏开始成功！');
}
```

### **通用操作接口**
```typescript
// 抢地主
const grabResult = gameFacade.executeGameAction(roomId, 'grab_landlord', playerId, {
  isGrab: true
});

// 出牌
const playResult = gameFacade.executeGameAction(roomId, 'play_cards', playerId, {
  cards: ['hearts3', 'hearts4']
});

// 跳过
const passResult = gameFacade.executeGameAction(roomId, 'pass_turn', playerId);
```

### **获取完整状态**
```typescript
// 获取游戏快照
const snapshot = gameFacade.getGameSnapshot(roomId);
if (snapshot.success) {
  console.log('房间信息:', snapshot.snapshot?.room);
  console.log('游戏状态:', snapshot.snapshot?.game);
  console.log('系统统计:', snapshot.snapshot?.system);
}
```

### **系统监控**
```typescript
// 获取系统统计
const stats = gameFacade.getSystemStats();
console.log('房间统计:', stats.rooms);
console.log('玩家统计:', stats.players);
console.log('游戏统计:', stats.games);

// 健康检查
const health = gameFacade.healthCheck();
if (health.healthy) {
  console.log('系统运行正常');
} else {
  console.log('系统存在问题:', health.services);
}
```

## 📊 统一API响应格式

所有GameFacade API都遵循统一的响应格式：

```typescript
{
  success: boolean,      // 操作是否成功
  message?: string,      // 成功消息
  error?: string,        // 错误信息
  data?: any            // 响应数据
}
```

## 🔧 高级特性

### **错误处理**
- 统一的异常捕获和处理
- 详细的错误信息和日志
- 优雅降级和恢复机制

### **性能优化**
- 批量操作优化
- 缓存机制
- 异步处理
- 资源管理

### **扩展性**
- 插件化架构
- 动态配置
- 自定义规则
- API版本管理

## 🎮 实际应用场景

### **客户端集成**
```javascript
// 前端快速集成示例
const gameFacadeAPI = {
  // 快速开始游戏
  async quickStart(roomName, players) {
    const room = await this.createRoom(roomName);
    const joinedPlayers = [];

    for (const playerName of players) {
      const result = await this.joinRoom(room.id, playerName);
      if (result.success) {
        joinedPlayers.push(result.player);
      }
    }

    // 准备并开始
    for (const player of joinedPlayers) {
      await this.ready(room.id, player.id);
    }

    return await this.startGame(room.id);
  },

  // 通用操作
  async executeAction(roomId, action, playerId, data = {}) {
    const response = await fetch(`/api/games/rooms/${roomId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, playerId, data })
    });

    return await response.json();
  }
};
```

### **自动化测试**
```typescript
// 自动化游戏流程测试
async function testGameFlow() {
  const room = gameFacade.createGameRoom('测试房间');

  // 添加玩家
  const players = [];
  for (let i = 1; i <= 3; i++) {
    const result = gameFacade.quickJoinGame(room.id, `测试玩家${i}`);
    players.push(result.player!);
  }

  // 准备并开始
  for (const player of players) {
    gameFacade.executeGameAction(room.id, 'ready', player.id);
  }

  const startResult = gameFacade.executeGameAction(room.id, 'start', players[0].id);
  console.log('游戏开始测试:', startResult.success ? '通过' : '失败');

  // 测试抢地主
  const grabResult = gameFacade.executeGameAction(room.id, 'grab_landlord', players[0].id, { isGrab: true });
  console.log('抢地主测试:', grabResult.success ? '通过' : '失败');

  return true;
}
```

## 💡 设计优势

1. **简化使用**: 统一接口，降低学习成本
2. **错误处理**: 完善的异常处理和错误恢复
3. **性能优化**: 批量操作和缓存机制
4. **扩展性**: 易于添加新功能和修改现有逻辑
5. **可维护性**: 清晰的职责分离和模块化设计

## 🔄 架构演进

### **服务拆分前后对比**

**拆分前 (单体)**:
```
GameService (800+行)
├── 房间管理逻辑
├── 玩家管理逻辑
├── 扑克牌逻辑
└── 游戏引擎逻辑
```

**拆分后 (模块化)**:
```
GameFacade (门面)
├── CardService (扑克牌)
├── RoomService (房间)
├── PlayerService (玩家)
└── GameEngine (游戏逻辑)
```

### **API调用对比**

**之前**:
```typescript
// 复杂的多步骤操作
const room = gameService.createRoom(name, maxPlayers);
const player1 = gameService.joinRoom(room.id, 'player1');
const player2 = gameService.joinRoom(room.id, 'player2');
gameService.playerReady(room.id, player1.id);
gameService.playerReady(room.id, player2.id);
// ... 更多步骤
```

**现在**:
```typescript
// 简洁的统一调用
const result = gameFacade.quickStartGame('房间名', ['玩家1', '玩家2', '玩家3']);
```

## 📈 性能特性

- **响应时间**: 统一接口减少网络往返
- **内存使用**: 智能缓存和资源管理
- **并发处理**: 异步操作和队列管理
- **监控告警**: 实时性能监控和异常告警

## 🔧 API接口

### **核心API**
```http
POST /api/games/rooms/{roomId}/action
Content-Type: application/json

{
  "action": "join|ready|start|grab_landlord|play_cards|pass_turn",
  "playerId": "player123",
  "data": { ... }
}
```

### **状态查询**
```http
GET /api/games/rooms/{roomId}/snapshot
GET /api/games/stats
GET /api/games/health
```

### **响应示例**
```json
{
  "success": true,
  "message": "操作执行成功",
  "data": {
    "room": { "id": "A01", "name": "房间A01" },
    "game": { "status": "playing", "phase": "游戏进行中" },
    "players": [...],
    "stats": { "totalRounds": 5, "currentRound": 2 }
  }
}
```

## 🎯 最佳实践

### **客户端使用建议**
1. **优先使用通用接口**: `POST /action` 减少API调用数量
2. **批量操作**: 多个操作时使用统一接口
3. **状态同步**: 定期获取游戏快照保持状态同步
4. **错误处理**: 完善的错误处理和用户提示

### **服务端使用建议**
1. **监控健康状态**: 定期检查系统健康
2. **资源清理**: 调用cleanup方法释放资源
3. **性能调优**: 根据统计信息优化性能
4. **日志记录**: 完整的操作日志和错误追踪

---

**GameFacade让游戏开发变得简单、高效和优雅！** 🎯
