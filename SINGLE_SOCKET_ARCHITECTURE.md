# 统一Socket连接架构设计

## 📋 架构概述

### 设计原则
**一次认证，全局复用**
- 用户首次登录时建立Socket连接并认证
- 认证信息保存到localStorage
- 所有页面共享同一个Socket连接
- 页面跳转时自动恢复认证状态

---

## 🏗️ 架构设计

### 核心组件

#### **GlobalSocketManager** (单例模式)
```javascript
class GlobalSocketManager {
  - socket: Socket实例（全局唯一）
  - isConnected: 连接状态
  - userName: 用户名
  - userId: 用户ID
  
  + connect(userName?, userId?): Socket
  + disconnect(): void
  + clearAuth(): void
  + joinGame(data): boolean
  + leaveGame(roomId): boolean
  + sendChat(roomId, message): boolean
  + getConnectionStatus(): Object
}
```

---

## 🔄 工作流程

### 1. 首次登录流程

```
用户输入名称
  ↓
调用 GlobalSocketManager.connect(userName, userId)
  ↓
创建新的Socket连接
  ↓
传递auth参数 { userId, userName }
  ↓
后端自动认证
  ↓
保存到localStorage
  - localStorage.setItem('userId', userId)
  - localStorage.setItem('userName', userName)
  ↓
保存到实例变量
  - this.userId = userId
  - this.userName = userName
  ↓
返回Socket实例
```

### 2. 页面跳转流程

```
用户从大厅跳转到房间
  ↓
房间页面初始化
  ↓
调用 GlobalSocketManager.getInstance()
  ↓
调用 connect() 方法（不传参数）
  ↓
检查是否已有连接
  ├─ 是：直接复用现有Socket
  └─ 否：从localStorage恢复用户信息
      ↓
      创建新的Socket连接
      ↓
      使用恢复的用户信息认证
  ↓
返回Socket实例
```

### 3. 登出流程

```
用户点击登出
  ↓
调用 GlobalSocketManager.clearAuth()
  ↓
清除localStorage
  - removeItem('userId')
  - removeItem('userName')
  - removeItem('lastGameSettlement')
  ↓
断开Socket连接
  - socket.disconnect()
  - socket = null
  ↓
清除实例变量
  - userName = null
  - userId = null
  ↓
跳转到登录页面
```

---

## 💾 数据持久化

### localStorage存储

```javascript
{
  "userId": "player_123",           // 用户ID
  "userName": "玩家A",              // 用户名
  "lastGameSettlement": "{...}"     // 最后一局结算数据（可选）
}
```

### 用途
1. **跨页面认证**: 页面跳转时恢复用户信息
2. **刷新恢复**: 页面刷新后自动重新连接
3. **个人中心**: 提供userId用于数据查询

---

## 🔌 Socket连接管理

### 连接状态

```javascript
// 状态1: 未连接
socket = null
isConnected = false

// 状态2: 已连接
socket = Socket实例
isConnected = true

// 状态3: 断线重连中
socket = Socket实例
isConnected = false
```

### 自动重连配置

```javascript
io('http://localhost:3000', {
  auth: { userId, userName },
  reconnection: true,           // 启用自动重连
  reconnectionDelay: 1000,      // 重连延迟1秒
  reconnectionAttempts: 5       // 最多尝试5次
})
```

---

## 📊 各页面使用方式

### 首页 (index.html)

```javascript
// 用户登录
const userName = '玩家A';
const userId = 'player_123';

// 建立连接并认证
const socketManager = GlobalSocketManager.getInstance();
socketManager.connect(userName, userId);

// 跳转到大厅
window.location.href = '/lobby/index.html';
```

### 大厅页面 (lobby/index.html)

```javascript
// 获取Socket管理器实例
const socketManager = GlobalSocketManager.getInstance();

// 复用已有连接（自动从localStorage恢复）
const socket = socketManager.connect();

// 使用Socket
socket.on('room_list', (data) => {
  // 处理房间列表
});

// 加入房间
socketManager.joinGame({
  roomId: 'room_123',
  userId: socketManager.userId,
  playerName: socketManager.userName
});
```

### 房间页面 (room/room.html)

```javascript
// 获取Socket管理器实例
const socketManager = GlobalSocketManager.getInstance();

// 复用已有连接（自动从localStorage恢复）
const socket = socketManager.connect();

// 使用Socket
socket.on('game_started', (data) => {
  // 处理游戏开始
});

// 发送游戏事件
socket.emit('play_cards', {
  roomId: this.roomId,
  cards: selectedCards
});
```

### 个人中心 (profile/index.html)

```javascript
// 从localStorage获取userId
const userId = localStorage.getItem('userId');

if (!userId) {
  alert('请先登录');
  window.location.href = '/';
  return;
}

// 加载个人数据
fetch(`/api/score/${userId}`)
  .then(res => res.json())
  .then(data => {
    // 显示个人信息
  });
```

---

## 🔍 调试方法

### 1. 查看连接状态

```javascript
// 在控制台执行
const socketManager = GlobalSocketManager.getInstance();
console.log(socketManager.getConnectionStatus());

// 输出:
// {
//   connected: true,
//   userId: 'player_123',
//   userName: '玩家A',
//   socketId: 'abc123'
// }
```

### 2. 查看localStorage

```javascript
console.log('userId:', localStorage.getItem('userId'));
console.log('userName:', localStorage.getItem('userName'));
```

### 3. 监听Socket事件

```javascript
const socket = socketManager.socket;

socket.onAny((eventName, ...args) => {
  console.log('📨 Socket事件:', eventName, args);
});
```

---

## ⚠️ 注意事项

### 1. 单例模式
- `GlobalSocketManager` 使用单例模式
- 整个应用只有一个实例
- 通过 `getInstance()` 获取

### 2. 连接复用
- 已有连接时不会创建新连接
- 自动检测连接状态
- 断线时自动重连

### 3. 认证信息
- 首次登录时保存到localStorage
- 页面跳转时自动恢复
- 登出时完全清除

### 4. 错误处理
- 无法获取用户信息时跳转到首页
- 连接失败时显示错误提示
- 重连失败时提示用户

---

## 🚀 优势

### 1. 性能优化
- ✅ 减少连接数量（1个连接 vs 多个连接）
- ✅ 减少认证次数（1次认证 vs 每页认证）
- ✅ 减少服务器负载

### 2. 状态一致
- ✅ 全局共享连接状态
- ✅ 避免多连接冲突
- ✅ 统一的事件处理

### 3. 用户体验
- ✅ 页面跳转无需重新登录
- ✅ 刷新页面自动恢复
- ✅ 断线自动重连

### 4. 代码维护
- ✅ 集中管理Socket连接
- ✅ 统一的API接口
- ✅ 易于调试和测试

---

## 📈 性能对比

### 旧架构（多连接）

```
首页: 创建Socket1 → 认证
  ↓
大厅: 创建Socket2 → 认证
  ↓
房间: 创建Socket3 → 认证

总计: 3个连接，3次认证
问题: 
- 资源浪费
- 状态不一致
- 可能的事件冲突
```

### 新架构（单连接）

```
首页: 创建Socket1 → 认证 → 保存到localStorage
  ↓
大厅: 复用Socket1（从localStorage恢复）
  ↓
房间: 复用Socket1（从localStorage恢复）

总计: 1个连接，1次认证
优势:
- 资源节省
- 状态一致
- 无事件冲突
```

---

## 🧪 测试用例

### 测试1: 首次登录

```javascript
// 1. 清除localStorage
localStorage.clear();

// 2. 登录
const socketManager = GlobalSocketManager.getInstance();
socketManager.connect('测试玩家', 'test_123');

// 3. 验证
console.assert(localStorage.getItem('userId') === 'test_123');
console.assert(socketManager.isConnected === true);
```

### 测试2: 页面跳转

```javascript
// 1. 登录
socketManager.connect('测试玩家', 'test_123');
const socket1 = socketManager.socket;

// 2. 模拟跳转（重新获取实例）
const socketManager2 = GlobalSocketManager.getInstance();
const socket2 = socketManager2.connect();

// 3. 验证是同一个Socket
console.assert(socket1 === socket2);
```

### 测试3: 刷新页面

```javascript
// 1. 登录
socketManager.connect('测试玩家', 'test_123');

// 2. 刷新页面（模拟）
window.location.reload();

// 3. 页面加载后
const socketManager = GlobalSocketManager.getInstance();
const socket = socketManager.connect();

// 4. 验证用户信息恢复
console.assert(socketManager.userId === 'test_123');
console.assert(socketManager.userName === '测试玩家');
```

### 测试4: 登出

```javascript
// 1. 登录
socketManager.connect('测试玩家', 'test_123');

// 2. 登出
socketManager.clearAuth();

// 3. 验证
console.assert(localStorage.getItem('userId') === null);
console.assert(socketManager.socket === null);
console.assert(socketManager.isConnected === false);
```

---

## 🔧 故障排除

### 问题1: 页面跳转后提示"请先登录"

**原因**: localStorage中没有用户信息

**解决**:
```javascript
// 检查localStorage
console.log(localStorage.getItem('userId'));

// 如果为null，重新登录
window.location.href = '/';
```

### 问题2: Socket连接失败

**原因**: 服务器未启动或网络问题

**解决**:
```javascript
// 检查服务器状态
fetch('http://localhost:3000')
  .then(() => console.log('服务器正常'))
  .catch(() => console.log('服务器未启动'));
```

### 问题3: 重复连接

**原因**: 多次调用connect()且未检查状态

**解决**:
```javascript
// 正确的调用方式
const socketManager = GlobalSocketManager.getInstance();
const socket = socketManager.connect(); // 自动检查并复用

// 错误的调用方式
const socket1 = io('http://localhost:3000'); // ❌ 不要直接创建
const socket2 = io('http://localhost:3000'); // ❌ 不要直接创建
```

---

## 📚 相关文档

- [GlobalSocketManager源码](frontend/public/js/global-socket.js)
- [大厅页面实现](frontend/public/lobby/js/lobby.js)
- [房间页面实现](frontend/public/room/js/room-simple.js)
- [个人中心实现](frontend/public/profile/js/profile.js)

---

## 🎯 最佳实践

### 1. 始终使用GlobalSocketManager

```javascript
// ✅ 正确
const socketManager = GlobalSocketManager.getInstance();
const socket = socketManager.connect();

// ❌ 错误
const socket = io('http://localhost:3000');
```

### 2. 页面初始化时调用connect()

```javascript
// 页面加载时
document.addEventListener('DOMContentLoaded', () => {
  const socketManager = GlobalSocketManager.getInstance();
  const socket = socketManager.connect(); // 自动恢复或复用
});
```

### 3. 登出时调用clearAuth()

```javascript
// 登出按钮点击
logoutBtn.addEventListener('click', () => {
  const socketManager = GlobalSocketManager.getInstance();
  socketManager.clearAuth(); // 清除所有认证信息
  window.location.href = '/';
});
```

### 4. 使用统一的事件发送方法

```javascript
// ✅ 使用封装的方法
socketManager.joinGame({ roomId, userId, playerName });
socketManager.sendChat(roomId, message);

// ❌ 直接使用socket.emit
socket.emit('join_game', { ... }); // 不推荐
```

---

## 📝 更新日志

### v2.0.0 (2025-10-30)
- ✅ 实现统一Socket连接架构
- ✅ 支持从localStorage恢复认证
- ✅ 添加自动重连机制
- ✅ 优化连接复用逻辑
- ✅ 添加clearAuth方法
- ✅ 完善错误处理

---

**架构优化完成！现在整个应用使用统一的Socket连接。** ✅

**创建时间**: 2025-10-30 08:15  
**版本**: v2.0.0  
**作者**: AI Assistant
