# PlayerService - 玩家管理服务模块

## 📖 概述

PlayerService是斗地主游戏的核心服务模块，负责所有与玩家相关的操作。采用模块化设计，将原本在GameService中的玩家管理逻辑拆分到独立的服务中。

## 🏗️ 架构设计

```
player/
├── playerManager.ts   # 玩家生命周期管理
├── playerValidator.ts # 玩家操作验证
├── playerSession.ts   # 玩家会话管理
├── playerService.ts   # 统一服务接口
└── example.ts         # 使用示例 (待创建)
```

## 🎯 核心功能

### **PlayerManager** - 玩家生命周期管理
- ✅ 玩家创建、删除
- ✅ 玩家状态管理（准备、手牌、位置）
- ✅ 玩家权限验证
- ✅ 地主设置管理

### **PlayerValidator** - 玩家操作验证
- ✅ 玩家操作权限验证
- ✅ 玩家状态检查
- ✅ 手牌验证
- ✅ 游戏规则验证

### **PlayerSession** - 玩家会话管理
- ✅ 在线状态跟踪
- ✅ 活动时间记录
- ✅ 会话清理
- ✅ 统计信息

### **PlayerService** - 统一服务接口
- ✅ 玩家CRUD操作
- ✅ 状态管理集成
- ✅ 验证机制集成
- ✅ 统计信息获取

## 🚀 使用方法

### **创建玩家**
```typescript
import { playerService } from './services/player/playerService';

// 创建新玩家
const player = playerService.createPlayer('玩家名称');
console.log(`玩家创建成功: ${player.name} (${player.id})`);
```

### **添加玩家到房间**
```typescript
// 添加玩家到房间
const room = roomService.getRoom('A01');
if (room) {
  const player = playerService.addPlayerToRoom(room, '新玩家');
  console.log(`玩家加入房间成功: ${player.name}`);
}
```

### **切换准备状态**
```typescript
// 切换准备状态
const success = playerService.togglePlayerReady(room, player.id);
if (success) {
  console.log('准备状态切换成功');

  // 检查是否所有玩家都准备
  if (playerService.areAllPlayersReady(room)) {
    console.log('所有玩家已准备，可以开始游戏');
  }
}
```

### **设置地主**
```typescript
// 设置地主
const success = playerService.setLandlord(room, player.id);
if (success) {
  console.log('地主设置成功');
}
```

### **验证玩家操作**
```typescript
// 验证玩家操作权限
const validation = playerService.validatePlayerOperation(room, playerId, 'play');
if (validation.valid) {
  console.log('玩家可以出牌');
} else {
  console.log('玩家不能出牌:', validation.error);
}
```

### **获取玩家状态**
```typescript
// 获取玩家状态描述
const status = playerService.getPlayerStatusDescription(room, playerId);
console.log(`玩家状态: ${status}`);

// 检查玩家状态
const isReady = playerService.isPlayerReady(room, playerId);
const isLandlord = playerService.isPlayerLandlord(room, playerId);
const isCurrentTurn = playerService.isPlayerCurrentTurn(room, playerId);
```

## 📊 玩家状态管理

### **玩家状态流转**
```
未准备 → 准备 → 游戏中
  ↓       ↓      ↓
 离开    取消   结束
```

### **玩家权限验证**
```typescript
// 不同操作的验证条件
{
  ready: '房间等待中 + 玩家在房间中 + 没有手牌',
  leave: '玩家在房间中 + (不是地主 或 游戏未开始)',
  play: '游戏进行中 + 轮到该玩家 + 有手牌',
  grab_landlord: '游戏进行中 + 没有地主 + 有手牌',
  pass: '游戏进行中 + 轮到该玩家'
}
```

## 🔧 业务规则

### **玩家名称规则**
- 长度: 1-20字符
- 不允许前后空格
- 不能包含特殊字符: `<>"'/\\|?*`

### **游戏规则**
- 房间最多6人，最少3人
- 所有玩家准备才能开始
- 地主不能离开游戏进行中
- 只有当前玩家才能出牌

## 🧪 验证功能

PlayerService包含完整的验证机制：

```typescript
// 玩家操作验证
const readyValidation = PlayerValidator.validatePlayerCanReady(room, playerId);
if (!readyValidation.valid) {
  console.error('不能准备:', readyValidation.error);
}

// 手牌验证
const cardValidation = PlayerValidator.validatePlayerCards(playerCards, playedCards);
if (!cardValidation.valid) {
  console.error('手牌验证失败:', cardValidation.error);
}
```

## 💡 设计优势

1. **状态一致性**: 统一管理玩家状态，避免数据不一致
2. **权限控制**: 细粒度的操作权限验证
3. **会话管理**: 完整的在线状态跟踪
4. **错误处理**: 完善的异常处理和业务验证
5. **易测试**: 独立模块便于单元测试

## 🔄 迁移说明

从GameService迁移到PlayerService的改动：

**之前**:
```typescript
// 在GameService中
player.ready = !player.ready;
room.updatedAt = new Date();
```

**现在**:
```typescript
// 使用PlayerService
playerService.togglePlayerReady(room, playerId);
```

## 🎮 实际应用

在斗地主游戏中的使用场景：

1. **玩家大厅**: 显示所有在线玩家状态
2. **房间管理**: 玩家加入、离开、准备管理
3. **游戏过程**: 权限验证、出牌验证、状态更新
4. **实时同步**: Socket.IO与玩家状态同步
5. **会话管理**: 在线状态跟踪、超时清理

## 📈 性能特性

- **查询效率**: O(1)玩家查找
- **验证速度**: O(n)线性验证（n为房间玩家数）
- **内存优化**: 高效的Map存储结构
- **会话清理**: 自动清理离线会话

## 🔧 API接口

### **HTTP API**
```http
POST /api/games/rooms/{roomId}/join
Content-Type: application/json

{
  "playerName": "玩家名称"
}
```

```http
POST /api/games/rooms/{roomId}/ready
Content-Type: application/json

{
  "playerId": "player123"
}
```

```http
GET /api/games/rooms/{roomId}/players
```

```http
GET /api/games/rooms/{roomId}/players/{playerId}/status
```

**响应格式**:
```json
{
  "success": true,
  "data": {
    "player": { "id": "xxx", "name": "玩家", "ready": true },
    "status": "已准备",
    "isReady": true,
    "isLandlord": false,
    "isCurrentTurn": false
  }
}
```

---

**PlayerService让玩家管理变得安全、可靠和高效！** 🎯
