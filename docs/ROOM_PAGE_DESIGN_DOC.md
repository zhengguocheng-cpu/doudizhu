# 斗地主游戏房间页面设计文档

## 📋 目录
- [概述](#概述)
- [页面架构](#页面架构)
- [流程设计](#流程设计)
- [代码逻辑](#代码逻辑)
- [CSS布局](#css布局)
- [动态效果](#动态效果)
- [事件系统](#事件系统)

---

## 概述

### 功能定位
房间页面是斗地主游戏的核心界面，包含：
- **游戏桌面**：3个玩家位置、手牌、底牌展示
- **实时聊天**：房间内玩家交流
- **游戏控制**：开始、出牌、抢地主等操作
- **状态显示**：连接状态、准备状态、游戏进度

### 技术栈
- **HTML5** + **CSS3 Grid/Flexbox** + **JavaScript ES6+**
- **Socket.IO**：实时双向通信
- **全局Socket管理器**：单连接架构

---

## 页面架构

### 整体布局结构

```
┌─────────────────────────────────────────────────────┐
│         顶部标题栏 (60px固定高度)                    │
│  游戏房间 - [房间ID]              [连接状态]         │
├───────────────────────────────┬─────────────────────┤
│                               │                     │
│    游戏区域 (1fr)              │  聊天侧边栏 (0.3fr) │
│                               │                     │
│  ┌─────────────────────────┐ │  ┌───────────────┐ │
│  │   游戏桌面 (绿色背景)    │ │  │  聊天标题     │ │
│  │                         │ │  ├───────────────┤ │
│  │  [玩家2]    [玩家3]     │ │  │               │ │
│  │                         │ │  │  消息列表     │ │
│  │    [底牌/控制按钮]      │ │  │  (自动滚动)   │ │
│  │                         │ │  │               │ │
│  │  [当前玩家]             │ │  ├───────────────┤ │
│  └─────────────────────────┘ │  │  输入框+发送  │ │
│                               │  └───────────────┘ │
│  ┌─────────────────────────┐ │                     │
│  │   手牌区域 (重叠显示)    │ │                     │
│  └─────────────────────────┘ │                     │
└───────────────────────────────┴─────────────────────┘
```

### CSS Grid 层次结构

#### 第一层：主容器
```css
.main-container {
    display: grid;
    grid-template-rows: 60px auto;      /* 标题栏 + 内容区 */
    grid-template-columns: 1fr 0.3fr;   /* 游戏区 + 聊天区 */
    height: calc(100vh - 20px);
}
```

#### 第二层：游戏区域
```css
.game-area {
    display: grid;
    grid-template-rows: 100px 1fr 150px;    /* 顶部玩家 + 桌面 + 手牌 */
    grid-template-columns: 100px 1fr 100px; /* 左中右布局 */
}
```

#### 第三层：游戏桌面
```css
.game-table {
    grid-area: 1 / 1 / 4 / 4;  /* 占据整个game-area */
    position: relative;         /* 子元素绝对定位参考 */
    background: linear-gradient(135deg, #2d5f3f 0%, #1e4d2b 100%);
}
```

---

## 流程设计

### 1. 页面初始化流程

```
用户点击"加入房间" (从大厅页面)
    ↓
URL携带参数: ?roomId=xxx&playerName=xxx&playerAvatar=xxx
    ↓
DoudizhuRoomClient 构造函数
    ↓
initializeFromUrl() - 解析URL参数
    ├─ 验证 roomId 和 playerName 是否存在
    └─ 设置 currentPlayer, currentPlayerId, currentRoom
    ↓
connectToServer()
    ├─ 获取全局Socket管理器的Socket连接
    ├─ 设置Socket认证属性 (userId, userName)
    └─ 调用 joinRoom() 发送加入请求
    ↓
setupSocketEventListeners() - 注册所有事件监听
    ↓
等待服务器响应 'room_joined' 事件
    ↓
onRoomJoined(data)
    ├─ 更新 currentRoom 信息
    ├─ showRoomActions() - 显示"开始游戏"和"返回大厅"按钮
    └─ bindEvents() - 绑定UI事件
    ↓
页面就绪，等待用户操作
```

### 2. 游戏开始流程

```
玩家点击"开始游戏"按钮
    ↓
emit('start_game', { roomId, userId })
    ↓
服务器验证：房间人数是否为3人
    ↓
服务器发牌并广播 'cards_dealt' 事件
    ↓
onCardsDealt(data)
    ├─ 更新 playerHand 数组
    ├─ renderPlayerHand() - 渲染手牌UI
    ├─ hideRoomActions() - 隐藏房间按钮
    └─ showGameActions() - 显示游戏按钮
    ↓
进入抢地主阶段
```

### 3. 出牌流程

```
服务器发送 'turn_changed' 事件
    ↓
onTurnChanged(data)
    ├─ 判断是否轮到当前玩家 (isMyTurn = true/false)
    └─ showGameActions() 或 hideGameActions()
    ↓
玩家点击卡牌选择
    ↓
toggleCardSelection(cardElement)
    └─ 切换 .selected 类名
    ↓
玩家点击"出牌"按钮
    ↓
playCards()
    ├─ 收集所有 .selected 的卡牌
    ├─ emit('play_cards', { roomId, userId, cards })
    └─ 移除 .selected 类名
    ↓
服务器验证牌型合法性
    ↓
广播 'cards_played' 事件
    ↓
onCardsPlayed(data) - 更新游戏状态
    ↓
等待下一个玩家
```

### 4. 聊天消息流程

```
玩家输入消息并点击"发送"
    ↓
sendMessage(message)
    ├─ 验证消息非空
    └─ emit('send_message', { roomId, message, userId, userName })
    ↓
服务器广播 'message_received' 事件
    ↓
onMessageReceived(data)
    └─ addMessageToChat(playerName, message, timestamp)
        ├─ 创建 <div class="chat-message"> 元素
        ├─ 设置时间、玩家名、消息内容
        ├─ appendChild 到 #roomMessageLog
        └─ scrollTop = scrollHeight (自动滚动到底部)
```

---

## 代码逻辑

### 核心类：DoudizhuRoomClient

```javascript
class DoudizhuRoomClient {
    constructor() {
        // 核心属性
        this.socketManager = window.GlobalSocketManager.getInstance();
        this.socket = null;
        this.currentRoom = null;
        this.currentPlayer = null;
        this.currentPlayerId = null;
        this.playerHand = [];
        this.gameStarted = false;
        this.isMyTurn = false;
        
        // 初始化
        this.initializeFromUrl();
        this.connectToServer();
    }
}
```

### 关键方法

#### 1. URL参数解析
```javascript
initializeFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('roomId');
    const playerName = urlParams.get('playerName');
    const playerAvatar = urlParams.get('playerAvatar');
    
    if (!roomId || !playerName) {
        alert('缺少房间或玩家信息');
        this.backToLobby();
        return;
    }
    
    this.completeRoomInitialization(roomId, playerName, playerAvatar);
}
```

#### 2. Socket连接（单连接架构）
```javascript
connectToServer() {
    // 复用全局Socket连接
    this.socket = this.socketManager.socket;
    
    // 设置认证属性
    this.socket.authenticated = true;
    this.socket.userId = this.currentPlayerId;
    this.socket.userName = this.currentPlayer;
    
    // 加入房间
    this.joinRoom();
    
    // 设置事件监听
    this.setupSocketEventListeners();
}
```

#### 3. 事件监听注册
```javascript
setupSocketEventListeners() {
    // 房间事件
    this.socket.on('room_joined', (data) => this.onRoomJoined(data));
    this.socket.on('player_joined', (data) => this.onPlayerJoined(data));
    
    // 游戏事件
    this.socket.on('cards_dealt', (data) => this.onCardsDealt(data));
    this.socket.on('turn_changed', (data) => this.onTurnChanged(data));
    this.socket.on('game_ended', (data) => this.onGameEnded(data));
    
    // 聊天事件
    this.socket.on('message_received', (data) => this.onMessageReceived(data));
    
    // 连接状态
    this.socket.on('connect', () => this.updateConnectionStatus(true));
    this.socket.on('disconnect', () => this.updateConnectionStatus(false));
}
```

#### 4. 手牌渲染
```javascript
renderPlayerHand() {
    const container = document.getElementById('playerHand');
    container.innerHTML = '';
    
    this.playerHand.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.textContent = card;
        cardElement.dataset.index = index;
        
        // 绑定点击事件
        cardElement.addEventListener('click', () => 
            this.toggleCardSelection(cardElement)
        );
        
        container.appendChild(cardElement);
    });
}
```

#### 5. 聊天消息显示
```javascript
addMessageToChat(playerName, message, timestamp) {
    const messageLog = document.getElementById('roomMessageLog');
    
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.innerHTML = `
        <span class="time">${new Date(timestamp).toLocaleTimeString()}</span>
        <span class="player">${playerName}</span>
        <span class="message">${message}</span>
    `;
    
    messageLog.appendChild(messageElement);
    messageLog.scrollTop = messageLog.scrollHeight;  // 自动滚动
}
```

---

## CSS布局

### 1. Grid布局核心

#### 主容器
```css
.main-container {
    display: grid;
    grid-template-rows: 60px auto;
    grid-template-columns: 1fr 0.3fr;
    gap: 10px;
    height: calc(100vh - 20px);
}
```

#### 顶部标题栏（跨两列）
```css
.top-header {
    grid-area: 1 / 1 / 2 / 3;  /* 起始行/起始列/结束行/结束列 */
    display: grid;
    grid-template-columns: 1fr 1fr 100px;
    background-color: #2c3e50;
}
```

#### 游戏区域（3x3网格）
```css
.game-area {
    grid-area: 2 / 1 / 3 / 2;
    display: grid;
    grid-template-rows: 100px 1fr 150px;
    grid-template-columns: 100px 1fr 100px;
}
```

### 2. 游戏桌面布局

#### 桌面背景
```css
.game-table {
    grid-area: 1 / 1 / 4 / 4;  /* 占据整个game-area */
    position: relative;
    background: linear-gradient(135deg, #2d5f3f 0%, #1e4d2b 100%);
    border: 10px solid #8b7355;
    border-radius: 20px;
}
```

#### 玩家位置（绝对定位）
```css
.player-position {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 12px;
}

.top-left-player { top: 20px; left: 20px; }
.top-right-player { top: 20px; right: 20px; }
.bottom-player { bottom: 20px; left: 20px; }
```

#### 控制按钮覆盖层
```css
.game-controls-overlay {
    grid-area: 2 / 1 / 3 / 4;
    display: grid;
    justify-content: center;
    align-items: center;
    z-index: 100;
    pointer-events: none;  /* 不阻挡鼠标事件 */
}

.game-controls-overlay > * {
    pointer-events: auto;  /* 子元素恢复鼠标事件 */
}
```

### 3. 手牌区域

#### 重叠卡牌效果
```css
.player-hand {
    display: flex;
    flex-wrap: nowrap;
    overflow: visible;
}

.card {
    width: 110px;
    height: 150px;
    margin-left: -60px;  /* 负margin实现重叠 */
    position: relative;
    transition: all 0.3s ease;
}

.card:first-child {
    margin-left: 0;  /* 第一张不重叠 */
}

.card:hover {
    transform: translateY(-15px) scale(1.05);
    z-index: 100;  /* 悬停时在最上层 */
}
```

### 4. 聊天侧边栏

```css
.chat-sidebar {
    display: grid;
    grid-template-rows: 50px 1fr 50px;  /* 标题/消息/输入 */
    height: 100%;
}

.chat-messages {
    grid-row: 2;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.chat-input-container {
    display: grid;
    grid-template-columns: 1fr 50px;  /* 输入框/按钮 */
    height: 100%;
}
```

### 5. 响应式设计

```css
/* 平板 */
@media (max-width: 1024px) {
    .main-content {
        grid-template-columns: 1fr 250px;
    }
}

/* 移动端 */
@media (max-width: 768px) {
    .main-content {
        grid-template-columns: 1fr;
        grid-template-rows: 1fr auto;
    }
    .chat-sidebar {
        height: 300px;
    }
}
```

---

## 动态效果

### 1. 发牌动画

```css
@keyframes dealCard {
    from {
        transform: translateY(-200px) rotate(180deg);
        opacity: 0;
    }
    to {
        transform: translateY(0) rotate(0deg);
        opacity: 1;
    }
}

.dealing-card {
    animation: dealCard 0.5s ease-out;
}
```

### 2. 卡牌选择

```css
.card {
    transition: all 0.3s ease;
    cursor: pointer;
}

.card:hover {
    transform: translateY(-15px) scale(1.05);
    box-shadow: 0 8px 16px rgba(0,0,0,0.4);
}

.card.selected {
    border-color: #e74c3c;
    background-color: #ffebee;
    transform: translateY(-20px);
}
```

### 3. 地主徽章脉动

```css
@keyframes landlord-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.15); }
}

.landlord-badge {
    animation: landlord-pulse 1.5s ease-in-out infinite;
}
```

### 4. 消息滑入

```css
@keyframes messageSlideIn {
    from {
        opacity: 0;
        transform: translateX(-10px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.chat-message {
    animation: messageSlideIn 0.3s ease-out;
}
```

### 5. 倒计时脉动

```css
@keyframes timerPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

.bidding-timer {
    animation: timerPulse 1s infinite;
}
```

---

## 事件系统

### Socket.IO事件

#### 客户端发送
```javascript
// 加入房间
socket.emit('join_game', { roomId, userId, playerName });

// 开始游戏
socket.emit('start_game', { roomId, userId });

// 出牌
socket.emit('play_cards', { roomId, userId, cards });

// 发送消息
socket.emit('send_message', { roomId, message, userId, userName });
```

#### 服务器广播
```javascript
// 房间事件
socket.on('room_joined', (data) => { /* { room, players } */ });
socket.on('player_joined', (data) => { /* { playerName, playerId } */ });
socket.on('player_left', (data) => { /* { playerName } */ });

// 游戏事件
socket.on('cards_dealt', (data) => { /* { playerId, cards, gameState } */ });
socket.on('turn_changed', (data) => { /* { currentPlayer, nextPlayer } */ });
socket.on('game_ended', (data) => { /* { winner } */ });

// 聊天事件
socket.on('message_received', (data) => { /* { playerName, message, timestamp } */ });

// 连接事件
socket.on('connect', () => { /* 重新连接 */ });
socket.on('disconnect', () => { /* 断开连接 */ });
```

### UI事件绑定

```javascript
bindEvents() {
    // 聊天
    document.getElementById('sendChatBtn').addEventListener('click', () => {
        this.sendMessage(chatInput.value);
    });
    
    // 回车发送
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.sendMessage(e.target.value);
    });
    
    // 游戏控制
    document.getElementById('startGameBtn').addEventListener('click', () => {
        this.socket.emit('start_game', { roomId, userId });
    });
    
    document.getElementById('playCardsBtn').addEventListener('click', () => {
        this.playCards();
    });
    
    document.getElementById('passBtn').addEventListener('click', () => {
        this.passTurn();
    });
}
```

---

## 最佳实践

### 1. 单连接架构
- 使用全局Socket管理器，避免重复连接
- 跨页面共享Socket状态

### 2. 状态管理
- 集中管理游戏状态（playerHand, gameStarted, isMyTurn）
- 通过事件驱动更新UI

### 3. 错误处理
- URL参数验证
- Socket连接检查
- 消息非空验证

### 4. 性能优化
- 使用 `pointer-events: none` 避免阻挡鼠标事件
- 卡牌重叠使用负margin而非绝对定位
- 聊天消息自动滚动使用 `scrollTop`

### 5. 用户体验
- 平滑过渡动画（transition）
- 悬停反馈（hover效果）
- 自动滚动到最新消息
- 连接状态实时显示

---

## 学习要点总结

### CSS Grid布局
- `grid-template-rows/columns` 定义网格结构
- `grid-area` 定位网格项
- `fr` 单位实现弹性布局

### 绝对定位
- `position: relative` 作为参考点
- `position: absolute` 精确定位子元素

### 动画效果
- `@keyframes` 定义动画
- `animation` 应用动画
- `transition` 实现平滑过渡

### Socket.IO通信
- `emit()` 发送事件
- `on()` 监听事件
- 事件驱动的状态更新

### 面向对象设计
- 类封装相关功能
- 方法职责单一
- 事件处理统一管理

---

**文档版本**：v1.0  
**最后更新**：2025-01-28  
**适用版本**：斗地主游戏 Phase 2
