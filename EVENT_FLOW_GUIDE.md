# 斗地主游戏 - 事件流程详解

## 📋 目录
1. [事件触发时序](#事件触发时序)
2. [详细事件流程](#详细事件流程)
3. [数据流向图](#数据流向图)
4. [关键代码位置](#关键代码位置)

---

## ⏱️ 事件触发时序

### 完整游戏时序图
```
时间  前端事件                后端处理                     后端广播
────────────────────────────────────────────────────────────────
0s    用户点击"开始游戏"
      ↓
      emit('player_ready')  → handlePlayerReady()
                              检查所有人准备
                              ↓
                              startGame()              → game_started
                              ↓
                              dealCards()
                              生成54张牌
                              洗牌
                              分配17+17+17+3           → deal_cards_all
                              
1s    收到deal_cards_all
      找到自己的牌
      ↓
      showCenterDealingAnimation()
      (桌面中央3张牌飞入)
      
3s    发牌动画完成
      renderPlayerHand()
      显示17张手牌
                              ↓
                              startBidding()
                              随机选第一个玩家          → bidding_start
                              
3.5s  收到bidding_start
      如果是第一个玩家
      ↓
      showBiddingActions()
      显示"抢地主"/"不抢"按钮
      startBiddingTimer(15秒)
      
Xs    用户点击"抢地主"
      ↓
      emit('bid', {bid: true}) → handleBidLandlord()
                                 记录选择
                                 检查是否所有人都选择   → bid_result
                                 
Xs    收到bid_result
      显示"XXX 选择：抢"
      如果是下一个玩家
      ↓
      showBiddingActions()
      
Xs    第三个玩家选择后
                              → determineLandlord()
                                确定地主
                                地主获得底牌(20张)
                                设置角色              → landlord_determined
                                
Xs    收到landlord_determined
      显示"XXX 成为地主！"
      ↓
      showBottomCardsAnimation()
      (显示3张底牌，停留1.5秒)
      
Xs    如果我是地主
      更新手牌为20张
      renderPlayerHand()
      显示地主👑标记
                              延迟2秒
                              ↓                       → turn_to_play
                              
Xs    收到turn_to_play
      如果轮到我
      ↓
      showGameActions()
      显示"出牌"/"不出"按钮
```

---

## 📝 详细事件流程

### 1. 连接建立流程

#### 前端代码位置
```javascript
// frontend/public/room/js/socket-manager.js
class GlobalSocketManager {
    connect() {
        this.socket = io('http://localhost:3000', {
            transports: ['websocket'],
            reconnection: true
        });
        
        this.socket.on('connect', () => {
            console.log('✅ Socket连接成功');
            this.authenticated = true;
        });
    }
}
```

#### 后端代码位置
```typescript
// backend/src/app.ts
private setupSocketIO() {
    this.io.on('connection', (socket) => {
        console.log(`✅ 新Socket连接: ${socket.id}`);
        
        // 绑定事件处理器
        this.eventHandler.setupSocketEvents(socket);
    });
}
```

#### 数据流
```
前端                          后端
│                             │
├─ socket.connect()           │
│  ────────────────────────→ │
│                             ├─ connection事件
│                             ├─ 创建Socket实例
│                             ├─ socket.id = "abc123"
│  ←────────────────────────┤─ emit('connect')
├─ connect事件触发            │
├─ authenticated = true       │
└─ 准备发送请求               │
```

---

### 2. 加入房间流程

#### 前端代码
```javascript
// frontend/public/room/js/room-simple.js
joinRoom() {
    console.log('🚪 发送加入房间请求');
    
    this.socket.emit('join_game', {
        roomId: this.currentRoom.id,
        userId: this.currentPlayerId,
        userName: this.currentPlayer
    });
}
```

#### 后端代码
```typescript
// backend/src/services/socket/SocketEventHandler.ts
public async handleJoinGame(socket, data) {
    const { roomId, userId, userName } = data;
    
    // 1. 验证房间
    const room = roomService.getRoom(roomId);
    if (!room) {
        socket.emit('join_game_error', { message: '房间不存在' });
        return;
    }
    
    // 2. 检查房间是否已满
    if (room.players.length >= 3) {
        socket.emit('join_game_error', { message: '房间已满' });
        return;
    }
    
    // 3. 加入Socket.IO房间
    await socket.join(`room_${roomId}`);
    console.log(`✅ Socket ${socket.id} 已加入房间 room_${roomId}`);
    
    // 4. 添加玩家到房间数据
    const player = {
        id: userId,
        name: userName,
        ready: false,
        cards: []
    };
    roomService.addPlayer(roomId, player);
    
    // 5. 广播给房间内所有人
    this.io.to(`room_${roomId}`).emit('player_joined', {
        playerId: userId,
        playerName: userName,
        players: room.players
    });
    
    // 6. 发送成功响应给当前玩家
    socket.emit('join_game_success', {
        roomId: roomId,
        players: room.players,
        room: room
    });
}
```

#### 数据流
```
前端                                    后端
│                                       │
├─ emit('join_game', {                  │
│     roomId: 'A01',                    │
│     userId: 'player1',                │
│     userName: '玩家1'                 │
│   })  ────────────────────────────→  │
│                                       ├─ handleJoinGame()
│                                       ├─ 验证房间存在
│                                       ├─ 检查房间未满
│                                       ├─ socket.join('room_A01')
│                                       ├─ roomService.addPlayer()
│                                       │
│                                       ├─ 广播给房间所有人
│  ←────────────────────────────────── ├─ io.to('room_A01')
│                                       │    .emit('player_joined', {
│                                       │      playerId: 'player1',
│                                       │      players: [...]
│                                       │    })
├─ 触发player_joined事件                │
├─ 更新玩家列表显示                     │
│                                       │
│  ←────────────────────────────────── ├─ socket.emit('join_game_success')
├─ 触发join_game_success事件            │
└─ 显示房间界面                         │
```

---

### 3. 游戏开始流程

#### 前端代码
```javascript
// 点击"开始游戏"按钮
readyGame() {
    console.log('🎮 发送准备请求');
    
    this.socket.emit('player_ready', {
        roomId: this.currentRoom.id,
        userId: this.currentPlayerId
    });
    
    // 立即更新本地状态
    this.updateReadyButton(true);
}
```

#### 后端代码
```typescript
// backend/src/services/socket/SocketEventHandler.ts
public async handlePlayerReady(socket, data) {
    const { roomId, userId } = data;
    
    // 1. 更新玩家准备状态
    roomService.updatePlayerReady(roomId, userId, true);
    
    // 2. 广播给房间所有人
    const player = room.players.find(p => p.id === userId);
    this.io.to(`room_${roomId}`).emit('player_ready', {
        playerId: userId,
        playerName: player.name,
        ready: true
    });
    
    // 3. 检查是否所有人都准备
    const allReady = room.players.every(p => p.ready);
    if (allReady && room.players.length === 3) {
        console.log('🎮 所有玩家已准备，开始游戏');
        gameFlowHandler.startGame(roomId);
    }
}

// backend/src/services/socket/GameFlowHandler.ts
public startGame(roomId: string) {
    // 1. 广播游戏开始
    this.io.to(`room_${roomId}`).emit('game_started', {
        roomId: roomId,
        players: room.players
    });
    
    // 2. 发牌
    this.dealCards(roomId);
}

private dealCards(roomId: string) {
    // 1. 生成54张牌
    const deck = cardGenerator.generateDeck();
    
    // 2. 洗牌
    const shuffled = cardShuffler.shuffle(deck);
    
    // 3. 分配牌
    const playerCards = [
        shuffled.slice(0, 17),
        shuffled.slice(17, 34),
        shuffled.slice(34, 51)
    ];
    const bottomCards = shuffled.slice(51, 54);
    
    // 4. 保存到房间数据
    room.players.forEach((player, index) => {
        player.cards = playerCards[index];
        this.sortCards(player.cards);
    });
    room.bottomCards = bottomCards;
    
    // 5. 广播发牌事件（房间广播，避免Socket查找问题）
    this.io.to(`room_${roomId}`).emit('deal_cards_all', {
        players: room.players.map((player, index) => ({
            playerId: player.id,
            playerName: player.name,
            cards: playerCards[index],
            cardCount: 17
        })),
        bottomCards: bottomCards,
        bottomCardCount: 3
    });
    
    // 6. 开始抢地主
    setTimeout(() => {
        this.startBidding(roomId);
    }, 2000);
}
```

#### 数据流
```
前端                                    后端
│                                       │
├─ 点击"开始游戏"                       │
├─ emit('player_ready')  ─────────────→│
│                                       ├─ updatePlayerReady()
│  ←──────────────────────────────────┤─ io.to(room).emit('player_ready')
├─ 更新准备状态显示                     │
│                                       ├─ 检查所有人准备
│                                       ├─ startGame()
│  ←──────────────────────────────────┤─ io.to(room).emit('game_started')
├─ 隐藏准备按钮                         │
├─ 显示游戏区域                         │
│                                       ├─ dealCards()
│                                       ├─ 生成54张牌
│                                       ├─ 洗牌
│                                       ├─ 分配17+17+17+3
│  ←──────────────────────────────────┤─ io.to(room).emit('deal_cards_all', {
│                                       │     players: [{
│                                       │       playerId: 'player1',
│                                       │       cards: [...]
│                                       │     }],
│                                       │     bottomCards: [...]
│                                       │   })
├─ 触发deal_cards_all事件               │
├─ 找到自己的牌                         │
├─ dealCardsWithAnimation()             │
│   ├─ showCenterDealingAnimation()     │
│   │   (桌面中央3张牌飞入)             │
│   └─ renderPlayerHand()               │
│       (显示17张手牌)                   │
│                                       ├─ 延迟2秒
│                                       ├─ startBidding()
│  ←──────────────────────────────────┤─ io.to(room).emit('bidding_start')
├─ 触发bidding_start事件                │
└─ showBiddingActions()                 │
    (显示抢地主按钮)                     │
```

---

### 4. 抢地主流程

#### 前端代码
```javascript
handleBid(bid) {
    console.log('选择抢地主:', bid);
    
    this.socket.emit('bid', {
        roomId: this.currentRoom.id,
        userId: this.currentPlayerId,
        bid: bid
    });
    
    this.hideBiddingActions();
    const bidText = bid ? '抢地主' : '不抢';
    this.addGameMessage(`您选择：${bidText}`, 'game');
}
```

#### 后端代码
```typescript
// backend/src/services/socket/GameFlowHandler.ts
public handleBidLandlord(roomId, userId, bid) {
    // 1. 验证是否轮到该玩家
    if (room.biddingState.currentBidderId !== userId) {
        console.error(`不是玩家${userId}的回合`);
        return;
    }
    
    // 2. 记录抢地主结果
    room.biddingState.bids.push({ userId, bid });
    
    // 3. 如果选择抢，记录为潜在地主
    if (bid) {
        room.biddingState.landlordId = userId;
    }
    
    // 4. 广播抢地主结果
    const nextIndex = (currentIndex + 1) % 3;
    const nextBidderId = room.biddingState.biddingOrder[nextIndex];
    
    this.io.to(`room_${roomId}`).emit('bid_result', {
        userId: userId,
        userName: currentPlayer.name,
        bid: bid,
        nextBidderId: room.biddingState.bids.length < 3 ? nextBidderId : null
    });
    
    // 5. 检查是否所有人都已抢地主
    if (room.biddingState.bids.length === 3) {
        this.determineLandlord(roomId);
    } else {
        room.biddingState.currentBidderId = nextBidderId;
    }
}

private determineLandlord(roomId) {
    const landlordId = room.biddingState.landlordId;
    
    // 如果没有人抢地主，重新发牌
    if (!landlordId) {
        this.io.to(`room_${roomId}`).emit('no_landlord');
        setTimeout(() => this.startGame(roomId), 2000);
        return;
    }
    
    // 1. 地主获得底牌
    const landlord = room.players.find(p => p.id === landlordId);
    landlord.cards = landlord.cards.concat(room.bottomCards);
    this.sortCards(landlord.cards);
    
    // 2. 设置角色
    room.players.forEach(p => {
        p.role = p.id === landlordId ? 'landlord' : 'farmer';
    });
    
    // 3. 设置游戏状态
    room.gameState = {
        landlordId: landlordId,
        currentPlayerId: landlordId
    };
    
    // 4. 广播地主确定（包含地主的完整手牌）
    this.io.to(`room_${roomId}`).emit('landlord_determined', {
        landlordId: landlordId,
        landlordName: landlord.name,
        bottomCards: room.bottomCards,
        landlordCards: landlord.cards,  // 20张牌
        landlordCardCount: 20,
        roles: room.players.reduce((acc, p) => {
            acc[p.id] = p.role;
            return acc;
        }, {})
    });
    
    // 5. 延迟2秒后通知地主先出牌
    setTimeout(() => {
        this.io.to(`room_${roomId}`).emit('turn_to_play', {
            playerId: landlordId,
            playerName: landlord.name,
            isFirst: true
        });
    }, 2000);
}
```

#### 数据流
```
前端                                    后端
│                                       │
├─ 用户点击"抢地主"                     │
├─ emit('bid', {bid: true})  ─────────→│
│                                       ├─ handleBidLandlord()
│                                       ├─ 验证轮次
│                                       ├─ 记录选择
│                                       ├─ 更新潜在地主
│  ←──────────────────────────────────┤─ io.to(room).emit('bid_result', {
│                                       │     userId, bid, nextBidderId
│                                       │   })
├─ 显示"XXX 选择：抢"                   │
├─ 如果是下一个玩家                     │
├─ showBiddingActions()                 │
│                                       ├─ 检查3人都选择
│                                       ├─ determineLandlord()
│                                       ├─ 地主获得底牌(20张)
│                                       ├─ 设置角色
│  ←──────────────────────────────────┤─ io.to(room).emit('landlord_determined', {
│                                       │     landlordId,
│                                       │     landlordCards: [20张牌],
│                                       │     bottomCards: [3张牌],
│                                       │     roles: {...}
│                                       │   })
├─ 触发landlord_determined事件          │
├─ 显示"XXX 成为地主！"                 │
├─ showBottomCardsAnimation()           │
│   (显示3张底牌，停留1.5秒)            │
├─ 如果我是地主                         │
│   ├─ playerHand = landlordCards       │
│   └─ renderPlayerHand()               │
│       (显示20张牌)                     │
├─ updatePlayerRoles()                  │
│   (显示地主👑标记)                     │
│                                       ├─ 延迟2秒
│  ←──────────────────────────────────┤─ io.to(room).emit('turn_to_play', {
│                                       │     playerId: landlordId
│                                       │   })
├─ 触发turn_to_play事件                 │
├─ 如果轮到我                           │
└─ showGameActions()                    │
    (显示"出牌"/"不出"按钮)              │
```

---

## 🎯 关键代码位置

### 后端
```
事件处理入口：
backend/src/services/socket/SocketEventHandler.ts
- handleJoinGame(): 加入房间
- handlePlayerReady(): 玩家准备

游戏流程控制：
backend/src/services/socket/GameFlowHandler.ts
- startGame(): 开始游戏
- dealCards(): 发牌
- startBidding(): 开始抢地主
- handleBidLandlord(): 处理抢地主
- determineLandlord(): 确定地主

数据管理：
backend/src/services/room/roomService.ts
- getAllRooms(): 获取房间列表
- addPlayer(): 添加玩家
- updatePlayerReady(): 更新准备状态
```

### 前端
```
Socket管理：
frontend/public/room/js/socket-manager.js
- GlobalSocketManager: 全局Socket单例

房间逻辑：
frontend/public/room/js/room-simple.js
- DoudizhuRoomClient: 房间主类
  - joinRoom(): 加入房间
  - readyGame(): 准备游戏
  - handleBid(): 抢地主
  - onDealCardsAll(): 处理发牌
  - onLandlordDetermined(): 处理地主确定
  - dealCardsWithAnimation(): 发牌动画
  - showBottomCardsAnimation(): 底牌动画
```

---

**文档版本**: v1.0
**更新时间**: 2025-10-27
