# RoomService - 房间管理服务模块

## 📖 概述

RoomService是斗地主游戏的核心服务模块，负责所有与房间相关的操作。采用模块化设计，将原本在GameService中的房间管理逻辑拆分到独立的服务中。

## 🏗️ 架构设计

```
room/
├── roomManager.ts     # 房间生命周期管理
├── roomValidator.ts   # 房间规则验证
├── defaultRooms.ts    # 默认房间配置
├── roomService.ts     # 主要服务接口
└── example.ts         # 使用示例 (待创建)
```

## 🎯 核心功能

### **RoomManager** - 房间生命周期管理
- ✅ 创建、删除房间
- ✅ 玩家加入、离开管理
- ✅ 房间状态管理
- ✅ 游戏开始条件检查

### **RoomValidator** - 房间规则验证
- ✅ 房间参数验证
- ✅ 玩家操作验证
- ✅ 游戏开始条件验证
- ✅ 房间状态检查

### **DefaultRoomConfig** - 默认房间配置
- ✅ 默认房间生成
- ✅ 房间命名规则
- ✅ 配置管理

### **RoomService** - 统一服务接口
- ✅ 房间CRUD操作
- ✅ 玩家生命周期管理
- ✅ 规则验证集成
- ✅ 统计信息获取

## 🚀 使用方法

### **创建房间**
```typescript
import { roomService } from './services/room/roomService';

// 创建新房间
const room = roomService.createRoom('我的房间', 3);
console.log(`房间创建成功: ${room.name} (${room.id})`);
```

### **玩家加入房间**
```typescript
// 玩家加入房间
const player = roomService.joinRoom('A01', '玩家名称');
console.log(`玩家加入成功: ${player.name} (${player.id})`);
```

### **玩家准备**
```typescript
// 切换准备状态
const success = roomService.togglePlayerReady('A01', player.id);
if (success) {
  console.log('准备成功');

  // 检查是否可以开始游戏
  if (roomService.canStartGame('A01')) {
    console.log('所有玩家已准备，可以开始游戏');
  }
}
```

### **房间验证**
```typescript
// 验证房间操作
const validation = roomService.validateRoomOperation('A01', 'join');
if (validation.valid) {
  console.log('可以加入房间');
} else {
  console.log('不能加入房间:', validation.error);
}
```

### **获取房间统计**
```typescript
// 获取房间统计信息
const stats = roomService.getRoomStats();
console.log(`总房间数: ${stats.total}`);
console.log(`等待中: ${stats.waiting}`);
console.log(`游戏中: ${stats.playing}`);
```

## 📊 房间状态管理

### **房间状态流转**
```
waiting (等待中)
    ↓ 所有玩家准备
playing (游戏中)
    ↓ 游戏结束
finished (已结束)
    ↓ 重置房间
waiting (等待中)
```

### **玩家状态管理**
```typescript
// 玩家状态示例
{
  id: "player123",
  name: "玩家名称",
  ready: false,        // 准备状态
  cards: [],           // 手牌
  cardCount: 0         // 手牌数量
}
```

## 🔧 业务规则

### **房间规则**
- 房间名称长度: 1-50字符
- 最大玩家数: 3-6人
- 默认房间: A01-A06

### **游戏规则**
- 最少玩家数: 3人
- 所有玩家必须准备才能开始
- 地主不能离开游戏进行中

## 🧪 验证功能

RoomService包含完整的验证机制：

```typescript
// 房间参数验证
const roomValidation = RoomValidator.validateRoomParams('房间名', 3);
if (!roomValidation.valid) {
  console.error(roomValidation.error);
}

// 玩家操作验证
const joinValidation = RoomValidator.validateRoomJoinable(room);
if (!joinValidation.valid) {
  console.error(joinValidation.error);
}
```

## 💡 设计优势

1. **单一职责**: 每个子服务专注于特定功能
2. **高内聚**: 房间相关操作集中管理
3. **易测试**: 独立模块便于单元测试
4. **可扩展**: 支持未来添加更多房间类型
5. **错误处理**: 完善的异常处理机制

## 🔄 迁移说明

从GameService迁移到RoomService的改动：

**之前**:
```typescript
// 在GameService中
joinRoom(roomId, playerName) { /* 100行代码 */ }
leaveRoom(roomId, playerId) { /* 50行代码 */ }
playerReady(roomId, playerId) { /* 30行代码 */ }
```

**现在**:
```typescript
// 使用RoomService
roomService.joinRoom(roomId, playerName);
roomService.leaveRoom(roomId, playerId);
roomService.togglePlayerReady(roomId, playerId);
```

## 🎮 实际应用

在斗地主游戏中的使用场景：

1. **房间大厅**: 显示所有可用房间状态
2. **加入游戏**: 验证并处理玩家加入
3. **游戏准备**: 管理玩家准备状态
4. **游戏开始**: 验证开始条件并初始化
5. **实时同步**: Socket.IO与房间状态同步

## 📈 性能特性

- **查询效率**: O(1)房间查找
- **验证速度**: O(n)线性验证（n为玩家数）
- **内存优化**: 高效的Map存储结构
- **状态一致性**: 原子性状态更新

---

**RoomService让房间管理变得安全、可靠和高效！** 🎯
