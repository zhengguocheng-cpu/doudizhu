# 游戏完整流程文档

> 从发牌到结算的详细交互流程

---

## 📋 完整游戏流程

### 阶段概览

```
1. 准备阶段 → 2. 发牌阶段 → 3. 抢地主阶段 → 4. 游戏阶段 → 5. 结算阶段
```

---

## 1️⃣ 准备阶段 (Waiting)

### 流程步骤

```
玩家进入房间 → 标记准备 → 等待3人准备 → 触发游戏开始
```

### 前端交互

**用户操作**:
1. 进入房间页面 `/game/:roomId`
2. 点击"准备"按钮

**前端代码流程**:
```typescript
// 1. 用户点击准备
const handleReady = () => {
  socket.emit('player_ready', {
    roomId,
    userId: user.id
  })
}

// 2. 接收准备状态更新
socket.on('player_ready_status', (data) => {
  dispatch(updatePlayerStatus({
    playerId: data.playerId,
    isReady: true
  }))
})
```

### 后端处理

**SocketEventHandler.handlePlayerReady()**:
```typescript
1. 验证玩家在房间中
2. 更新玩家准备状态
3. 广播准备状态: io.to(`room_${roomId}`).emit('player_ready_status')
4. 检查是否所有玩家已准备
5. 如果都准备 → 自动触发开始游戏
```

### Socket事件

| 事件名 | 方向 | 数据 | 说明 |
|--------|------|------|------|
| `player_ready` | C→S | `{roomId, userId}` | 玩家标记准备 |
| `player_ready_status` | S→C | `{playerId, isReady}` | 广播准备状态 |
| `start_game` | S→C | 游戏开始数据 | 自动触发游戏开始 |

---

## 2️⃣ 发牌阶段 (Dealing)

### 流程步骤

```
所有玩家准备完成 → 开始游戏 → 洗牌 → 发牌(17张/人) → 留3张底牌
```

### 后端处理

**GameFlowHandler.startGame()**:
```typescript
1. 验证可以开始 (3人已准备)
2. 重置游戏状态
3. 洗牌: CardService.shuffleDeck()
   - 生成54张标准扑克牌
   - Fisher-Yates洗牌算法
4. 发牌: 每人17张
   cards[0] → Player 1
   cards[1] → Player 2
   cards[2] → Player 3
   cards[3] → Player 1
   ...
5. 底牌: 最后3张作为地主牌
6. 排序: 每个玩家的手牌按权重排序
7. 确定先手: 第一个玩家开始抢地主
8. 广播游戏状态
```

### 前端接收

**socket.on('game_started')**:
```typescript
{
  players: [
    { id, name, cards: ['♠3', '♥4', ...] },  // 17张
    { id, name, cardCount: 17 },             // 其他玩家只知道数量
  ],
  bottomCards: [],                           // 底牌暂不公开
  currentPlayerId: '...',                     // 第一个抢地主的玩家
  gameStatus: 'bidding'
}
```

### 前端动画

```typescript
useEffect(() => {
  if (gameStatus === 'bidding') {
    // 触发发牌动画
    startDealingAnimation()
    
    // 播放发牌音效
    soundManager.playSound('deal')
  }
}, [gameStatus])
```

---

## 3️⃣ 抢地主阶段 (Bidding)

### 流程步骤

```
第一个玩家 → 选择抢/不抢 → 第二个玩家 → 第三个玩家 → 确定地主
```

### 抢地主规则

1. **轮流选择**: 每个玩家按顺序选择
2. **抢地主**: 选择"抢"
3. **不抢**: 选择"不抢"
4. **确定地主**: 
   - 如果有人抢 → 最后一个抢的人成为地主
   - 如果都不抢 → 重新开始游戏

### 前端交互

**BiddingControls组件**:
```tsx
<div className="bidding-controls">
  <button onClick={() => handleBid(false)}>不抢</button>
  <button onClick={() => handleBid(true)}>抢地主</button>
</div>
```

**handleBid实现**:
```typescript
const handleBid = (isGrab: boolean) => {
  // 使用命令模式
  const command = new BidCommand(
    roomId,
    user.id,
    isGrab,
    () => {
      closeBiddingUI()  // 关闭抢地主UI
    },
    (msg) => {
      appendSystemMessage(msg)
    }
  )
  
  commandManager.execute(command)
}
```

### 后端处理

**CardPlayHandler.handleBidLandlord()**:
```typescript
1. 验证轮到该玩家
2. 记录抢地主选择
3. 判断是否结束抢地主:
   a. 所有人都选择了
   b. 确定地主 (最后抢的人)
4. 如果确定地主:
   - 将3张底牌分给地主
   - 更新游戏状态为 'playing'
   - 地主先出牌
5. 广播地主确定事件
```

### Socket事件

| 事件名 | 方向 | 数据 | 说明 |
|--------|------|------|------|
| `bid` | C→S | `{roomId, userId, isGrab}` | 抢地主选择 |
| `bid_result` | S→C | `{playerId, isGrab}` | 单次抢地主结果 |
| `landlord_determined` | S→C | 地主确定数据 | 地主已确定 |

**landlord_determined数据**:
```typescript
{
  landlordId: '...',
  landlordCards: ['♠3', '♥4', '♦5'],  // 3张底牌
  currentPlayerId: '...',              // 地主先出
  gameStatus: 'playing'
}
```

### 前端状态更新

```typescript
socket.on('landlord_determined', (data) => {
  // 1. 设置地主
  dispatch(setLandlord(data.landlordId))
  
  // 2. 显示底牌
  dispatch(setLandlordCards(data.landlordCards))
  
  // 3. 更新游戏状态
  dispatch(startGame())
  
  // 4. 播放音效
  soundManager.playVoice('叫地主')
  
  // 5. 底牌发牌动画
  animateBottomCards(data.landlordCards)
})
```

---

## 4️⃣ 游戏阶段 (Playing)

### 核心循环

```
当前玩家出牌 → 验证牌型 → 广播出牌 → 下一个玩家 → 检查胜利条件
```

### 4.1 出牌流程

#### 前端交互

**用户操作**:
1. 点击选择手牌 (高亮显示)
2. 点击"出牌"按钮
3. 如果没选牌但整手是单一牌型 → 自动全出

**handlePlayCards**:
```typescript
const handlePlayCards = () => {
  let cardsToPlay = selectedCards
  
  // 如果没选牌，尝试整手出
  if (cardsToPlay.length === 0) {
    const fullHand = CardOps.getFullHandIfSinglePattern(myCards)
    if (fullHand) {
      cardsToPlay = fullHand
    } else {
      appendSystemMessage('请选择要出的牌')
      return
    }
  }
  
  // 调用doPlayCards
  doPlayCards(cardsToPlay)
}
```

**doPlayCards** (使用命令模式):
```typescript
const doPlayCards = (cards: string[]) => {
  // 防重复提交
  if (playPendingRef.current) {
    appendSystemMessage('正在处理上一手出牌...')
    return
  }
  
  playPendingRef.current = true
  
  // 命令模式
  const command = new PlayCardsCommand(
    roomId,
    user.id,
    cards,
    () => {
      // 成功回调 - 重置pending
      playPendingRef.current = false
    },
    (msg) => {
      // 失败回调
      appendSystemMessage(msg)
      playPendingRef.current = false
    }
  )
  
  commandManager.execute(command)
  
  // 3秒超时保护
  setTimeout(() => {
    if (playPendingRef.current) {
      playPendingRef.current = false
    }
  }, 3000)
}
```

**PlayCardsCommand.execute()**:
```typescript
execute(): void {
  const socket = globalSocket.getSocket()
  
  // 发送Socket事件
  socket.emit('play_cards', {
    roomId: this.roomId,
    userId: this.userId,
    cards: this.cards
  })
  
  // 立即调用成功回调 (重置pending)
  this.onSuccess()
}
```

#### 后端处理

**CardPlayHandler.handlePlayCards()**:
```typescript
1. 验证玩家身份
2. 验证轮到该玩家
3. 验证出牌合法性:
   a. 玩家有这些牌
   b. 牌型识别: CardTypeDetector.detectType()
   c. 比较大小: CardComparator.compare()
4. 从玩家手牌移除出的牌
5. 更新游戏状态:
   - lastPlayedCards
   - lastPlayerId
   - passCount = 0
   - isNewRound = false
6. 记录出牌历史 (用于春天/反春计分)
7. 检查游戏是否结束:
   - 该玩家手牌为空 → 游戏结束
8. 确定下一个玩家
9. 广播出牌结果
```

**牌型识别 (CardTypeDetector)**:
```typescript
支持的牌型:
- SINGLE: 单牌
- PAIR: 对子
- TRIPLE: 三张
- TRIPLE_WITH_SINGLE: 三带一
- TRIPLE_WITH_PAIR: 三带二
- SEQUENCE: 顺子 (>=5张)
- PAIR_SEQUENCE: 连对 (>=3对)
- TRIPLE_SEQUENCE: 飞机 (>=2组三张)
- AIRPLANE_WITH_WINGS: 飞机带翅膀
- FOUR_WITH_TWO: 四带二
- BOMB: 炸弹 (4张相同)
- ROCKET: 火箭 (王炸)
```

**牌型比较规则**:
```typescript
1. 王炸 > 炸弹 > 普通牌型
2. 相同牌型比较权重
3. 不同牌型无法比较 (除非是炸弹/王炸)
```

#### 前端接收

**socket.on('cards_played')**:
```typescript
{
  playerId: '...',
  playerName: '...',
  cards: ['♠3', '♥4', '♦5'],
  cardType: {
    type: 'SEQUENCE',
    description: '顺子',
    weight: 5
  },
  remainingCards: 14  // 剩余手牌数
}
```

**handleCardsPlayed**:
```typescript
const handleCardsPlayed = (data) => {
  // 1. 播放音效
  soundManager.playCardTypeSound(data.cardType)
  
  // 2. 更新Redux状态
  dispatch(playCardsAction({
    playerId: data.playerId,
    playerName: data.playerName,
    cards: data.cards,
    type: data.cardType
  }))
  
  // 3. 如果是自己出的牌
  if (data.playerId === user.id) {
    setTurnState(false, false)
    playPendingRef.current = false
  }
  
  // 4. 清空选中状态
  dispatch(clearSelection())
  
  // 5. 清空所有人的"不出"标记
  clearAllPassedPlayers()
  
  // 6. 炸弹/火箭统计
  if (data.cardType.type === 'BOMB') {
    setCurrentBombCount(prev => prev + 1)
  } else if (data.cardType.type === 'ROCKET') {
    setCurrentRocketCount(prev => prev + 1)
  }
}
```

### 4.2 不出流程

**前端handlePass**:
```typescript
const handlePass = () => {
  // 验证轮到自己
  if (!isMyTurn) {
    appendSystemMessage('还没轮到你出牌')
    return
  }
  
  // 验证可以不出
  if (!canPass) {
    appendSystemMessage('当前轮次不能选择不出')
    return
  }
  
  // 命令模式
  const command = new PassCommand(
    roomId,
    user.id,
    () => {
      dispatch(clearSelection())
    },
    (msg) => {
      appendSystemMessage(msg)
    }
  )
  
  commandManager.execute(command)
}
```

**后端处理**:
```typescript
CardPlayHandler.handlePass():
1. 验证可以不出 (不是新一轮)
2. passCount++
3. 记录pass到历史 (cards: [])
4. 检查是否新一轮:
   - 如果passCount === 2 → 新一轮开始
   - isNewRound = true
   - 当前玩家可以随意出牌
5. 下一个玩家
6. 广播不出结果
```

**前端接收**:
```typescript
socket.on('player_passed', (data) => {
  dispatch(passAction(data.playerId))
  
  // 标记该玩家"不出"
  markPlayerAsPassed(data.playerId)
  
  // 播放"不要"音效
  soundManager.playVoice('不要')
})
```

### 4.3 计时器机制

**前端useGameTimer**:
```typescript
const { 
  turnTimer,
  startTurnTimer,
  stopTurnTimer 
} = useGameTimer()

// 监听turn_to_play事件
socket.on('turn_to_play', (data) => {
  if (data.playerId === user.id) {
    startTurnTimer(30)  // 30秒倒计时
  }
})

// 超时处理
useEffect(() => {
  if (turnTimer === 0 && isMyTurn) {
    handleTimeout()
  }
}, [turnTimer, isMyTurn])
```

**超时自动出牌 (策略模式)**:
```typescript
const handleTimeout = () => {
  const manager = new AutoPlayStrategyManager()
  
  const context = {
    myCards,
    lastPlayedCards,
    canPass,
    isMyTurn: true,
    turnTimer: 0
  }
  
  const result = manager.execute(context)
  
  if (result) {
    // 自动出牌
    doPlayCards(result.cards)
  } else if (canPass) {
    // 自动不出
    handlePass()
  }
}
```

---

## 5️⃣ 结算阶段 (Finished)

### 触发条件

某个玩家手牌为空 → 游戏结束

### 后端结算

**CardPlayHandler.checkGameOver()**:
```typescript
1. 确定获胜者
2. 计算分数: ScoreCalculator.calculateGameScore()
   a. 基础分
   b. 倍数计算:
      - 炸弹: ×2 per bomb
      - 王炸: ×4
      - 春天: ×16 (地主赢，农民没出过牌)
      - 反春: ×16 (农民赢，地主没出过牌)
   c. 地主:农民 = 2:1
3. 更新玩家积分
4. 记录对局历史
5. 广播game_ended
```

**ScoreCalculator**:
```typescript
calculateGameScore(players, winnerId, gameHistory) {
  // 1. 确定角色
  const landlord = players.find(p => p.role === 'landlord')
  const farmers = players.filter(p => p.role === 'farmer')
  const landlordWin = winnerId === landlord.id
  
  // 2. 计数倍数
  const { bombCount, rocketCount } = countBombsAndRockets(gameHistory)
  const isSpring = checkSpring(players, landlordWin, gameHistory)
  const isAntiSpring = checkAntiSpring(players, landlordWin, gameHistory)
  
  // 3. 计算倍数
  let multiplier = 1
  multiplier *= Math.pow(2, bombCount)    // 炸弹
  multiplier *= Math.pow(4, rocketCount)  // 王炸
  if (isSpring) multiplier *= 16
  if (isAntiSpring) multiplier *= 16
  
  // 4. 计算分数
  const baseScore = 100
  const totalScore = baseScore * multiplier
  
  // 5. 分配分数
  if (landlordWin) {
    landlord.score += totalScore * 2
    farmers.forEach(f => f.score -= totalScore)
  } else {
    landlord.score -= totalScore * 2
    farmers.forEach(f => f.score += totalScore)
  }
  
  return { scores, multiplier, isSpring, isAntiSpring }
}
```

### 前端展示

**socket.on('game_ended')**:
```typescript
{
  winnerId: '...',
  winnerName: '...',
  scores: [
    { playerId, playerName, score: +200, role: 'landlord' },
    { playerId, playerName, score: -100, role: 'farmer' },
    { playerId, playerName, score: -100, role: 'farmer' }
  ],
  multiplier: 4,
  bombCount: 1,
  rocketCount: 0,
  isSpring: false,
  isAntiSpring: false
}
```

**handleGameEnded**:
```typescript
const handleGameEnded = (data) => {
  // 1. 更新Redux
  dispatch(endGame({
    winnerId: data.winnerId,
    scores: data.scores
  }))
  
  // 2. 显示结算面板
  setShowResultPanel(true)
  
  // 3. 播放胜利/失败音效
  if (data.winnerId === user.id) {
    soundManager.playVoice('胜利')
  } else {
    soundManager.playVoice('失败')
  }
  
  // 4. 更新钱包积分
  const myScore = data.scores.find(s => s.playerId === user.id)
  if (myScore) {
    updateWalletScore(myScore.score)
  }
  
  // 5. 自动准备下一局 (5秒后)
  setTimeout(() => {
    dispatch(prepareNextGame())
  }, 5000)
}
```

**CenterResultPanel组件**:
```tsx
<div className="result-panel">
  <h2>{winnerId === user.id ? '胜利！' : '失败'}</h2>
  <div className="scores">
    {scores.map(s => (
      <div key={s.playerId}>
        <span>{s.playerName}</span>
        <span className={s.score > 0 ? 'win' : 'lose'}>
          {s.score > 0 ? '+' : ''}{s.score}
        </span>
      </div>
    ))}
  </div>
  <div className="multiplier">
    倍数: ×{multiplier}
    {isSpring && <span>春天</span>}
    {isAntiSpring && <span>反春</span>}
  </div>
</div>
```

---

## 🔄 状态转换图

```
WAITING → BIDDING → PLAYING → FINISHED
   ↑                              ↓
   └──────────────────────────────┘
         (准备下一局)
```

---

## 📊 完整时序图

```
用户1        用户2        用户3        前端         后端
  │            │            │            │            │
  ├─准备──────→│            │            ├──ready────→│
  │            ├─准备──────→│            ├──ready────→│
  │            │            ├─准备──────→├──ready────→│
  │            │            │            │   ↓        │
  │            │            │            │ 验证3人准备 │
  │            │            │            │←start_game─┤
  │←─────────发牌动画──────────────────→│            │
  │            │            │            │            │
  │←─抢地主UI→│            │            │            │
  ├─抢────────→│            │            ├──bid──────→│
  │            ├─不抢──────→│            ├──bid──────→│
  │            │            ├─抢────────→├──bid──────→│
  │            │            │            │←landlord───┤
  │←─────────地主确定，显示底牌────────→│            │
  │            │            │            │            │
  │←─出牌轮──→│            │            │            │
  ├─出牌──────→│            │            ├─play_cards→│
  │            │←──────────────────cards_played───────┤
  │            ├─不出──────→│            ├─pass_turn─→│
  │            │            │←──────player_passed─────┤
  │            │            ├─出牌──────→├─play_cards→│
  │            │            │  ↓手牌为0  │            │
  │←─────────────结算面板───────────game_ended────────┤
  │            │            │            │            │
```

---

这份文档详细描述了从准备到结算的完整游戏流程，包括每个阶段的前后端交互细节。
