# GameService - 游戏引擎服务模块

## 📖 概述

GameService是斗地主游戏的核心服务模块，负责所有与游戏逻辑相关的操作。采用模块化设计，将原本在GameService中的游戏流程控制逻辑拆分到独立的服务中。

## 🏗️ 架构设计

```
game/
├── gameEngine.ts      # 游戏流程控制引擎
├── gameRules.ts       # 游戏规则验证
├── gameState.ts       # 游戏状态管理
├── gameService.ts     # 统一服务接口
└── example.ts         # 使用示例 (待创建)
```

## 🎯 核心功能

### **GameEngine** - 游戏流程控制引擎
- ✅ 游戏开始、结束、重启
- ✅ 抢地主、出牌、跳过处理
- ✅ 游戏状态流转管理
- ✅ 胜负判定和分数计算

### **GameRules** - 游戏规则验证
- ✅ 游戏开始条件验证
- ✅ 出牌规则验证
- ✅ 抢地主规则验证
- ✅ 游戏配置管理

### **GameStateManager** - 游戏状态管理
- ✅ 玩家顺序管理
- ✅ 游戏阶段计算
- ✅ 统计信息获取
- ✅ 状态重置功能

### **GameService** - 统一服务接口
- ✅ 游戏事件处理
- ✅ 状态查询接口
- ✅ 规则验证集成
- ✅ 完整API封装

## 🚀 使用方法

### **开始游戏**
```typescript
import { gameEngineService } from './services/game/gameService';

// 开始游戏
const result = gameEngineService.startGame('A01');
if (result.success) {
  console.log('游戏开始成功');
} else {
  console.log('游戏开始失败:', result.error);
}
```

### **处理抢地主**
```typescript
// 抢地主
const result = gameEngineService.handleGrabLandlord('A01', 'player123', true);
if (result.success) {
  console.log('抢地主成功');
  if (result.gameFinished) {
    console.log('游戏结束');
  }
}
```

### **处理出牌**
```typescript
// 出牌
const result = gameEngineService.handlePlayCards('A01', 'player123', ['hearts3', 'hearts4']);
if (result.success) {
  console.log('出牌成功');
  if (result.nextPlayer) {
    console.log('下一位玩家:', result.nextPlayer.name);
  }
}
```

### **获取游戏状态**
```typescript
// 获取完整游戏状态
const gameState = gameEngineService.getGameState('A01');
if (gameState.success) {
  console.log('当前玩家:', gameState.data?.currentPlayer?.name);
  console.log('游戏阶段:', gameState.data?.phase);
  console.log('地主:', gameState.data?.landlord?.name);
}
```

### **验证游戏操作**
```typescript
// 验证出牌操作
const validation = gameEngineService.validateGameOperation(room, 'play_cards', playerId, { cards });
if (validation.valid) {
  console.log('可以出牌');
} else {
  console.log('不能出牌:', validation.error);
}
```

## 📊 游戏流程管理

### **游戏阶段流转**
```
等待准备 → 开始游戏 → 抢地主 → 游戏进行 → 结束游戏
    ↓           ↓        ↓        ↓        ↓
   重置       发牌     确定地主  出牌轮转  判定胜负
```

### **游戏事件处理**
```typescript
// 支持的事件类型
{
  start_game: '开始新游戏',
  grab_landlord: '抢地主操作',
  play_cards: '出牌操作',
  pass_turn: '跳过回合',
  end_game: '结束游戏',
  restart_game: '重启游戏'
}
```

## 🔧 游戏规则

### **开始条件**
- 房间状态：等待中
- 玩家数量：3-6人
- 所有玩家已准备
- 玩家名称唯一

### **出牌规则**
- 必须轮到该玩家
- 玩家必须有这些牌
- 牌型必须符合规则
- 必须大于上一轮出牌

### **抢地主规则**
- 游戏进行中
- 地主未确定
- 轮到该玩家
- 玩家有手牌

## 🧪 验证功能

GameEngine包含完整的验证机制：

```typescript
// 游戏开始验证
const startValidation = GameRules.validateGameStartConditions(room);
if (!startValidation.valid) {
  console.error('不能开始游戏:', startValidation.error);
}

// 出牌验证
const playValidation = GameRules.validatePlayCards(room, playerId, cards);
if (!playValidation.valid) {
  console.error('不能出牌:', playValidation.error);
}
```

## 💡 设计优势

1. **流程控制**: 清晰的游戏状态机和事件驱动
2. **规则引擎**: 完整的游戏规则验证和执行
3. **状态管理**: 统一的状态计算和查询接口
4. **事件处理**: 灵活的事件处理机制
5. **易测试**: 独立模块便于单元测试

## 🔄 迁移说明

从GameService迁移到GameEngine的改动：

**之前**:
```typescript
// 在GameService中
private startGame(roomId) { /* 200行代码 */ }
private handlePlayCards() { /* 150行代码 */ }
```

**现在**:
```typescript
// 使用GameEngine
gameEngineService.startGame(roomId);
gameEngineService.handlePlayCards(roomId, playerId, cards);
```

## 🎮 实际应用

在斗地主游戏中的使用场景：

1. **游戏管理**: 开始、结束、重启游戏控制
2. **规则执行**: 出牌、抢地主、跳过规则验证
3. **状态同步**: 实时游戏状态更新和广播
4. **事件处理**: 玩家操作事件统一处理
5. **统计分析**: 游戏数据统计和胜负判定

## 📈 性能特性

- **状态计算**: O(1)状态查询效率
- **规则验证**: O(n)线性验证速度（n为玩家数）
- **事件处理**: 异步事件处理机制
- **内存管理**: 高效的状态存储结构

## 🔧 API接口

### **HTTP API**
```http
POST /api/games/rooms/{roomId}/start
```

```http
POST /api/games/rooms/{roomId}/grab-landlord
Content-Type: application/json

{
  "playerId": "player123",
  "isGrab": true
}
```

```http
POST /api/games/rooms/{roomId}/play-cards
Content-Type: application/json

{
  "playerId": "player123",
  "cards": ["hearts3", "hearts4"]
}
```

```http
POST /api/games/rooms/{roomId}/pass-turn
Content-Type: application/json

{
  "playerId": "player123"
}
```

```http
GET /api/games/rooms/{roomId}/game-state
```

**响应格式**:
```json
{
  "success": true,
  "data": {
    "status": "playing",
    "phase": "游戏进行中",
    "currentPlayer": { "id": "xxx", "name": "玩家", "cardCount": 15 },
    "landlord": { "id": "xxx", "name": "地主" },
    "players": [...],
    "gameFinished": false
  }
}
```

## 🎯 完整示例

```typescript
// 完整游戏流程示例
import { gameEngineService } from './services/game/gameService';

// 1. 开始游戏
const startResult = gameEngineService.startGame('A01');
if (!startResult.success) throw new Error(startResult.error);

// 2. 处理抢地主
const grabResult = gameEngineService.handleGrabLandlord('A01', 'player1', true);
if (!grabResult.success) throw new Error(grabResult.error);

// 3. 出牌循环
let gameFinished = false;
while (!gameFinished) {
  // 获取当前游戏状态
  const gameState = gameEngineService.getGameState('A01');

  if (gameState.data?.gameFinished) {
    gameFinished = true;
    console.log('游戏结束，胜者:', gameState.data.winner?.name);
    break;
  }

  // 处理玩家出牌
  const currentPlayer = gameState.data?.currentPlayer;
  if (currentPlayer) {
    const playResult = gameEngineService.handlePlayCards('A01', currentPlayer.id, ['hearts3']);
    if (!playResult.success) {
      console.log('出牌失败:', playResult.error);
    }
  }
}
```

---

**GameEngine让游戏流程变得清晰、可控和高效！** 🎯
