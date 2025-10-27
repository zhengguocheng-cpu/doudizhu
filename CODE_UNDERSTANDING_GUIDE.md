# 斗地主游戏 - 代码理解指南

## 📚 文档导航

本指南包含3个核心文档，帮助您快速理解项目代码：

### 1. 程序架构文档 📐
**文件**: `PROGRAM_ARCHITECTURE.md`

**内容**：
- 整体架构图
- 后端目录结构和核心类
- 前端页面结构和核心类
- Socket.IO事件列表
- 关键数据结构

**适合**：
- 初次了解项目
- 理解整体架构
- 查找文件位置

---

### 2. 事件流程详解 🔄
**文件**: `EVENT_FLOW_GUIDE.md`

**内容**：
- 完整游戏时序图
- 详细事件流程（带代码示例）
- 前后端数据流向图
- 关键代码位置索引

**适合**：
- 理解事件如何触发
- 追踪数据流向
- 调试问题

---

### 3. 开发计划 🚀
**文件**: `GAME_DEVELOPMENT_PLAN.md`

**内容**：
- 已完成功能清单
- 待开发功能规划
- 开发顺序和时间估算
- 测试策略

**适合**：
- 了解项目进度
- 规划新功能
- 制定开发计划

---

## 🎯 快速开始

### 第一步：理解整体架构
阅读 `PROGRAM_ARCHITECTURE.md`，了解：
1. 前后端如何通信（Socket.IO）
2. 后端有哪些核心类
3. 前端有哪些页面和类
4. 数据如何存储（RoomService）

### 第二步：追踪事件流程
阅读 `EVENT_FLOW_GUIDE.md`，理解：
1. 用户点击按钮后发生什么
2. 前端如何发送事件
3. 后端如何处理事件
4. 后端如何广播给所有人

### 第三步：查看具体代码
根据文档中的代码位置，打开对应文件：
- 后端事件处理：`backend/src/services/socket/SocketEventHandler.ts`
- 游戏流程控制：`backend/src/services/socket/GameFlowHandler.ts`
- 前端房间逻辑：`frontend/public/room/js/room-simple.js`

---

## 💡 关键概念

### 1. Socket.IO房间机制
```
概念：
- 每个游戏房间对应一个Socket.IO房间
- 房间名格式：`room_${roomId}`
- 玩家加入房间：socket.join('room_A01')
- 广播给房间：io.to('room_A01').emit('event')

优势：
- 消息只发给房间内的玩家
- 不需要手动管理玩家列表
- 自动处理玩家离开
```

### 2. 房间广播 vs Socket单播
```
❌ 单播（有问题）：
io.to(socketId).emit('event')
问题：需要通过userId查找socketId，但Socket重连后没有认证信息

✅ 广播（推荐）：
io.to('room_A01').emit('event', {
    playerId: 'player1',
    data: ...
})
前端自己判断是否是自己的数据
```

### 3. 数据管理（单例模式）
```
RoomService（单例）：
- 所有房间数据存储在这里
- rooms: Map<roomId, GameRoom>
- 提供统一的数据访问接口

为什么用单例：
- 确保数据唯一性
- 避免数据不一致
- 方便全局访问
```

### 4. 前端状态管理
```
DoudizhuRoomClient：
- currentRoom: 当前房间信息
- playerHand: 玩家手牌
- isMyTurn: 是否轮到我
- selectedCards: 选中的牌

状态更新：
- 收到Socket事件 → 更新状态 → 更新UI
```

---

## 🔍 代码阅读路径

### 路径1：从用户操作开始
```
1. 用户点击"开始游戏"按钮
   ↓
2. frontend/public/room/js/room-simple.js
   readyGame() 方法
   ↓
3. emit('player_ready')
   ↓
4. backend/src/services/socket/SocketEventHandler.ts
   handlePlayerReady() 方法
   ↓
5. backend/src/services/socket/GameFlowHandler.ts
   startGame() 方法
   ↓
6. io.to(room).emit('game_started')
   ↓
7. frontend/public/room/js/room-simple.js
   onGameStarted() 方法
```

### 路径2：从数据流向开始
```
1. 房间数据创建
   backend/src/services/room/defaultRooms.ts
   ↓
2. 房间数据存储
   backend/src/services/room/roomService.ts
   rooms: Map<roomId, GameRoom>
   ↓
3. 玩家加入房间
   roomService.addPlayer()
   ↓
4. 游戏开始，发牌
   GameFlowHandler.dealCards()
   room.players[].cards = [...]
   ↓
5. 广播给前端
   io.to(room).emit('deal_cards_all')
   ↓
6. 前端接收并显示
   onDealCardsAll() → renderPlayerHand()
```

### 路径3：从Socket连接开始
```
1. 前端创建Socket
   frontend/public/room/js/socket-manager.js
   GlobalSocketManager.connect()
   ↓
2. 后端接收连接
   backend/src/app.ts
   io.on('connection', (socket) => {...})
   ↓
3. 绑定事件处理器
   SocketEventHandler.setupSocketEvents(socket)
   ↓
4. 前端发送事件
   socket.emit('join_game')
   ↓
5. 后端处理事件
   SocketEventHandler.handleJoinGame()
```

---

## 📊 核心数据结构

### GameRoom（房间）
```typescript
{
  id: 'A01',                    // 房间ID
  name: '房间A01',              // 房间名称
  players: [                    // 玩家列表
    {
      id: 'player1',
      name: '玩家1',
      ready: true,
      cards: ['♠3', '♥4', ...], // 手牌
      role: 'landlord'          // 角色
    }
  ],
  maxPlayers: 3,                // 最大玩家数
  status: 'playing',            // 房间状态
  gameState: {                  // 游戏状态
    landlordId: 'player1',
    currentPlayerId: 'player1',
    lastPlayedCards: ['♠3']
  },
  bottomCards: ['♠A', '♥K', '♦Q'],  // 底牌
  biddingState: {               // 抢地主状态
    bids: [
      {userId: 'player1', bid: true},
      {userId: 'player2', bid: false}
    ],
    landlordId: 'player1'
  }
}
```

### 前端状态
```javascript
{
  currentRoom: {id: 'A01'},     // 当前房间
  currentPlayerId: 'player1',   // 当前玩家ID
  playerHand: ['♠3', '♥4'],     // 手牌
  selectedCards: ['♠3'],        // 选中的牌
  isMyTurn: true,               // 是否轮到我
  gameStarted: true             // 游戏是否开始
}
```

---

## 🎮 游戏流程总结

```
1. 登录 (index.html)
   - 输入用户名
   - 选择头像
   ↓
2. 大厅 (lobby.html)
   - 显示房间列表
   - 选择房间加入
   ↓
3. 房间 (room.html)
   - 等待3人
   - 所有人准备
   ↓
4. 游戏开始
   - 发牌动画（桌面中央3张牌）
   - 每人17张牌
   ↓
5. 抢地主
   - 第一个玩家选择（15秒倒计时）
   - 第二个玩家选择
   - 第三个玩家选择
   ↓
6. 确定地主
   - 显示底牌动画（3张牌）
   - 地主获得底牌（20张）
   - 显示地主👑标记
   ↓
7. 出牌循环（待实现）
   - 地主先出
   - 下家出牌/不出
   - 重复
   ↓
8. 游戏结束（待实现）
   - 显示胜负
   - 显示得分
   - "再来一局"
```

---

## 🔧 调试技巧

### 1. 查看后端日志
```bash
# 后端终端会显示：
🎮 所有玩家已准备，开始游戏
📢 向房间 room_A01 广播发牌事件
👑 确定地主: 玩家1
```

### 2. 查看前端日志
```javascript
// 浏览器控制台会显示：
🎯 [发牌事件-广播] 收到数据: {...}
🎴 [底牌动画] 开始显示底牌: [...]
✅ 我是地主，更新手牌
```

### 3. 手动触发事件
```javascript
// 在浏览器控制台：
window.roomClient.socket.emit('bid', {
    roomId: 'A01',
    userId: 'player1',
    bid: true
});
```

### 4. 查看当前状态
```javascript
// 查看手牌
window.roomClient.playerHand

// 查看房间信息
window.roomClient.currentRoom

// 查看是否轮到我
window.roomClient.isMyTurn
```

---

## 📝 常见问题

### Q1: 为什么页面跳转后需要重新加入房间？
A: 因为页面跳转会创建新的Socket连接，旧的Socket已断开。新Socket需要重新join Socket.IO房间。

### Q2: 为什么使用房间广播而不是单播？
A: 因为Socket重连后没有携带认证信息，后端无法通过userId查找socketId。使用房间广播，前端自己判断数据。

### Q3: 数据存储在哪里？
A: 所有房间数据存储在 `RoomService` 的 `rooms: Map` 中，这是一个内存数据库（单例模式）。

### Q4: 如何添加新功能？
A: 
1. 后端：在 `GameFlowHandler` 添加处理方法
2. 后端：使用 `io.to(room).emit()` 广播事件
3. 前端：在 `DoudizhuRoomClient` 添加事件监听
4. 前端：更新UI显示

---

## 🎓 学习建议

### 第1天：理解架构
- 阅读 `PROGRAM_ARCHITECTURE.md`
- 了解前后端如何通信
- 理解Socket.IO房间机制

### 第2天：追踪流程
- 阅读 `EVENT_FLOW_GUIDE.md`
- 跟踪一个完整的事件流程
- 理解数据如何流动

### 第3天：阅读代码
- 打开 `SocketEventHandler.ts`
- 打开 `GameFlowHandler.ts`
- 打开 `room-simple.js`
- 对照文档理解代码

### 第4天：实践
- 修改一个小功能
- 添加一个新的日志
- 测试并观察效果

---

**祝您学习愉快！有问题随时查阅这些文档。** 📚✨
