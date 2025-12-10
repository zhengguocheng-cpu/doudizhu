# Socket事件与设计模式详细文档

> Socket.IO事件交互规范和设计模式应用说明

---

## 📡 Socket事件完整列表

### 事件分类

```
连接类 → 房间类 → 游戏类 → 聊天类 → 提示类
```

---

## 1️⃣ 连接类事件

### connect
**方向**: 客户端自动
**触发时机**: WebSocket连接建立
**前端处理**:
```typescript
socket.on('connect', () => {
  console.log('Socket connected:', socket.id)
  setConnected(true)
})
```

### disconnect
**方向**: 客户端自动
**触发时机**: WebSocket连接断开
**前端处理**:
```typescript
socket.on('disconnect', () => {
  console.log('Socket disconnected')
  setConnected(false)
  navigate('/lobby')  // 返回大厅
})
```

---

## 2️⃣ 房间类事件

### join_game
**方向**: C→S
**数据结构**:
```typescript
{
  roomId: string
  userId: string
  userName: string
}
```
**后端处理**: `SocketEventHandler.handleJoinGame()`
**广播**: `player_joined` (通知其他玩家)

### player_joined
**方向**: S→C (广播)
**数据结构**:
```typescript
{
  playerId: string
  playerName: string
  players: Player[]  // 完整玩家列表
}
```
**前端处理**:
```typescript
socket.on('player_joined', (data) => {
  dispatch(updatePlayers(data.players))
  addChatMessage(`${data.playerName} 加入了游戏`)
})
```

### leave_game
**方向**: C→S
**数据结构**:
```typescript
{
  roomId: string
  userId: string
}
```

### player_left
**方向**: S→C (广播)
**数据结构**:
```typescript
{
  playerId: string
  playerName: string
  players: Player[]
}
```

### get_room_state
**方向**: C→S
**用途**: 断线重连时获取房间完整状态
**响应**: `room_state`

### room_state
**方向**: S→C
**数据结构**:
```typescript
{
  room: {
    id: string
    name: string
    status: 'waiting' | 'playing'
    players: Player[]
  },
  gameState: {
    status: 'waiting' | 'bidding' | 'playing' | 'finished'
    currentPlayerId: string
    landlordId: string
    lastPlayedCards: {...}
    // ... 完整游戏状态
  },
  myCards: string[]  // 该玩家的手牌
}
```

---

## 3️⃣ 游戏类事件

### player_ready
**方向**: C→S
**数据结构**:
```typescript
{
  roomId: string
  userId: string
}
```

### player_ready_status
**方向**: S→C (广播)
**数据结构**:
```typescript
{
  playerId: string
  isReady: boolean
  allReady: boolean  // 是否所有人都准备
}
```

### start_game
**方向**: S→C (广播)
**触发时机**: 所有玩家准备完成
**数据结构**:
```typescript
{
  gameId: string
  players: [
    {
      id: string
      name: string
      cards: string[]      // 只有自己能看到
      cardCount: number
      position: number
      role: null
    }
  ],
  currentPlayerId: string  // 第一个抢地主的玩家
  gameStatus: 'bidding'
}
```

### bid
**方向**: C→S
**数据结构**:
```typescript
{
  roomId: string
  userId: string
  isGrab: boolean  // true=抢, false=不抢
}
```

### bid_result
**方向**: S→C (广播)
**数据结构**:
```typescript
{
  playerId: string
  playerName: string
  isGrab: boolean
  nextPlayerId: string  // 下一个抢地主的玩家
}
```

### landlord_determined
**方向**: S→C (广播)
**触发时机**: 地主确定
**数据结构**:
```typescript
{
  landlordId: string
  landlordName: string
  landlordCards: string[]  // 3张底牌
  players: Player[]        // 更新后的玩家列表
  currentPlayerId: string  // 地主先出牌
  gameStatus: 'playing'
}
```

### play_cards
**方向**: C→S
**数据结构**:
```typescript
{
  roomId: string
  userId: string
  cards: string[]  // ['♠3', '♥3', '♦3']
}
```

### cards_played
**方向**: S→C (广播)
**数据结构**:
```typescript
{
  playerId: string
  playerName: string
  cards: string[]
  cardType: {
    type: 'SINGLE' | 'PAIR' | 'SEQUENCE' | 'BOMB' | ...
    description: string
    weight: number
    count: number
  },
  remainingCards: number  // 该玩家剩余手牌数
}
```

### play_cards_failed
**方向**: S→C (单播)
**数据结构**:
```typescript
{
  error: string  // 错误信息
}
```
**前端处理**:
```typescript
socket.on('play_cards_failed', (data) => {
  appendSystemMessage(`出牌失败：${data.error}`)
  playPendingRef.current = false
})
```

### pass_turn
**方向**: C→S
**数据结构**:
```typescript
{
  roomId: string
  userId: string
}
```

### player_passed
**方向**: S→C (广播)
**数据结构**:
```typescript
{
  playerId: string
  playerName: string
  nextPlayerId: string
  isNewRound: boolean  // 是否开始新一轮
}
```

### turn_to_play
**方向**: S→C (广播)
**触发时机**: 轮到某个玩家出牌
**数据结构**:
```typescript
{
  playerId: string
  playerName: string
  canPass: boolean  // 是否可以不出
  timeLimit: number  // 倒计时秒数
}
```

### turn_changed
**方向**: S→C (广播)
**数据结构**:
```typescript
{
  currentPlayerId: string
}
```

### game_ended / game_over
**方向**: S→C (广播)
**数据结构**:
```typescript
{
  winnerId: string
  winnerName: string
  winnerRole: 'landlord' | 'farmer'
  scores: [
    {
      playerId: string
      playerName: string
      role: 'landlord' | 'farmer'
      score: number  // 正数=赢，负数=输
      totalScore: number  // 累计积分
    }
  ],
  multiplier: number  // 总倍数
  bombCount: number
  rocketCount: number
  isSpring: boolean
  isAntiSpring: boolean
}
```

---

## 4️⃣ 聊天类事件

### send_message
**方向**: C→S
**数据结构**:
```typescript
{
  roomId: string
  userId: string
  message: string
}
```

### message_received
**方向**: S→C (广播)
**数据结构**:
```typescript
{
  senderId: string
  senderName: string
  message: string
  timestamp: number
}
```

**前端处理**:
```typescript
socket.on('message_received', (data) => {
  addChatMessage(`${data.senderName}: ${data.message}`)
})
```

---

## 5️⃣ 提示类事件

### request_hint
**方向**: C→S
**用途**: 请求AI出牌提示
**数据结构**:
```typescript
{
  roomId: string
  userId: string
  myCards: string[]
  lastPlayedCards: string[] | null
}
```

### hint_received
**方向**: S→C (单播)
**数据结构**:
```typescript
{
  suggestedCards: string[]
  reason: string  // AI的解释
  confidence: number  // 置信度 0-1
}
```

---

## 🎨 设计模式应用详解

### 1. 命令模式 (Command Pattern)

#### 目的
将游戏操作封装为对象，支持撤销、重做、日志记录。

#### 实现

**GameCommand接口**:
```typescript
interface GameCommand {
  execute(): void
  undo?(): void
  canExecute(): boolean
}
```

**PlayCardsCommand**:
```typescript
export class PlayCardsCommand implements GameCommand {
  constructor(
    private roomId: string,
    private userId: string,
    private cards: string[],
    private onSuccess: () => void,
    private onError: (msg: string) => void
  ) {}

  canExecute(): boolean {
    return this.cards.length > 0 && !!globalSocket.getSocket()
  }

  execute(): void {
    if (!this.canExecute()) {
      this.onError('无法执行出牌操作')
      return
    }

    const socket = globalSocket.getSocket()
    
    socket.emit('play_cards', {
      roomId: this.roomId,
      userId: this.userId,
      cards: this.cards
    })
    
    // 调用成功回调
    this.onSuccess()
  }
}
```

**PassCommand**:
```typescript
export class PassCommand implements GameCommand {
  constructor(
    private roomId: string,
    private userId: string,
    private onSuccess: () => void,
    private onError: (msg: string) => void
  ) {}

  canExecute(): boolean {
    return !!globalSocket.getSocket()
  }

  execute(): void {
    if (!this.canExecute()) {
      this.onError('无法连接服务器')
      return
    }

    const socket = globalSocket.getSocket()
    socket.emit('pass_turn', {
      roomId: this.roomId,
      userId: this.userId
    })
    
    this.onSuccess()
  }
}
```

**BidCommand**:
```typescript
export class BidCommand implements GameCommand {
  constructor(
    private roomId: string,
    private userId: string,
    private isGrab: boolean,
    private onSuccess: () => void,
    private onError: (msg: string) => void
  ) {}

  canExecute(): boolean {
    return !!globalSocket.getSocket()
  }

  execute(): void {
    if (!this.canExecute()) {
      this.onError('无法连接服务器')
      return
    }

    const socket = globalSocket.getSocket()
    socket.emit('bid', {
      roomId: this.roomId,
      userId: this.userId,
      isGrab: this.isGrab
    })
    
    this.onSuccess()
  }
}
```

**CommandManager** (命令管理器):
```typescript
export class CommandManager {
  private history: GameCommand[] = []
  private maxHistory = 50

  execute(command: GameCommand): void {
    if (!command.canExecute()) {
      console.warn('命令无法执行')
      return
    }

    command.execute()
    
    // 记录到历史
    this.history.push(command)
    
    // 限制历史记录大小
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    }
  }

  getHistory(): GameCommand[] {
    return [...this.history]
  }

  clear(): void {
    this.history = []
  }
}
```

#### 使用场景

```typescript
// 在GameRoom/index.tsx中
const commandManager = useRef(new CommandManager())

const doPlayCards = (cards: string[]) => {
  const command = new PlayCardsCommand(
    roomId,
    user.id,
    cards,
    () => {
      playPendingRef.current = false
      setPlayPending(false)
    },
    (msg) => {
      appendSystemMessage(msg)
      playPendingRef.current = false
    }
  )
  
  commandManager.current.execute(command)
}
```

#### 优势
- ✅ 解耦调用者和执行者
- ✅ 支持命令历史记录
- ✅ 便于添加日志和审计
- ✅ 统一的错误处理

---

### 2. 策略模式 (Strategy Pattern)

#### 目的
定义一系列自动出牌算法，使它们可以相互替换。

#### 实现

**AutoPlayStrategy接口**:
```typescript
export interface AutoPlayStrategy {
  canApply(context: AutoPlayContext): boolean
  execute(context: AutoPlayContext): string[]
  getName(): string
  getPriority(): number
}

export interface AutoPlayContext {
  myCards: string[]
  lastPlayedCards: string[] | null
  canPass: boolean
  isMyTurn: boolean
  turnTimer: number
}
```

**FullHandStrategy** (整手出牌):
```typescript
export class FullHandStrategy implements AutoPlayStrategy {
  getName(): string {
    return 'FullHandStrategy'
  }

  getPriority(): number {
    return 10  // 最高优先级
  }

  canApply(context: AutoPlayContext): boolean {
    if (!context.isMyTurn) return false
    if (context.myCards.length === 0) return false
    
    // 检查是否是单一牌型
    const fullHand = CardHintHelper.getFullHandIfSinglePattern(
      context.myCards
    )
    
    return fullHand !== null
  }

  execute(context: AutoPlayContext): string[] {
    const fullHand = CardHintHelper.getFullHandIfSinglePattern(
      context.myCards
    )
    
    return fullHand || []
  }
}
```

**TimeoutStrategy** (超时自动出):
```typescript
export class TimeoutStrategy implements AutoPlayStrategy {
  getName(): string {
    return 'TimeoutStrategy'
  }

  getPriority(): number {
    return 5
  }

  canApply(context: AutoPlayContext): boolean {
    return context.turnTimer === 0 && context.isMyTurn
  }

  execute(context: AutoPlayContext): string[] {
    // 尝试获取提示牌
    const hint = CardHintHelper.getAllHints(
      context.myCards,
      context.lastPlayedCards
    )
    
    if (hint && hint.length > 0) {
      return hint[0]  // 返回第一个提示
    }
    
    return []
  }
}
```

**NoValidCardsStrategy** (无牌可出自动不出):
```typescript
export class NoValidCardsStrategy implements AutoPlayStrategy {
  getName(): string {
    return 'NoValidCardsStrategy'
  }

  getPriority(): number {
    return 1
  }

  canApply(context: AutoPlayContext): boolean {
    if (!context.isMyTurn) return false
    if (!context.canPass) return false
    
    // 检查是否有牌可以出
    const hints = CardHintHelper.getAllHints(
      context.myCards,
      context.lastPlayedCards
    )
    
    return hints.length === 0
  }

  execute(context: AutoPlayContext): string[] {
    // 返回空数组表示不出
    return []
  }
}
```

**AutoPlayStrategyManager**:
```typescript
export class AutoPlayStrategyManager {
  private strategies: AutoPlayStrategy[] = []

  constructor() {
    // 注册所有策略
    this.strategies = [
      new FullHandStrategy(),
      new TimeoutStrategy(),
      new NoValidCardsStrategy()
    ]
    
    // 按优先级排序
    this.strategies.sort((a, b) => b.getPriority() - a.getPriority())
  }

  execute(context: AutoPlayContext): {
    strategy: AutoPlayStrategy
    cards: string[]
  } | null {
    // 找到第一个可应用的策略
    for (const strategy of this.strategies) {
      if (strategy.canApply(context)) {
        const cards = strategy.execute(context)
        
        console.log(`[Strategy] 使用策略: ${strategy.getName()}`, cards)
        
        return { strategy, cards }
      }
    }
    
    return null
  }

  addStrategy(strategy: AutoPlayStrategy): void {
    this.strategies.push(strategy)
    this.strategies.sort((a, b) => b.getPriority() - a.getPriority())
  }
}
```

#### 使用场景

```typescript
// 在index.tsx中
const autoPlayManager = useRef(new AutoPlayStrategyManager())

useEffect(() => {
  if (turnTimer === 0 && isMyTurn) {
    const result = autoPlayManager.current.execute({
      myCards,
      lastPlayedCards,
      canPass,
      isMyTurn: true,
      turnTimer: 0
    })
    
    if (result) {
      if (result.cards.length > 0) {
        doPlayCards(result.cards)
      } else {
        handlePass()
      }
    }
  }
}, [turnTimer, isMyTurn])
```

#### 优势
- ✅ 消除复杂的if-else判断
- ✅ 易于添加新策略
- ✅ 每个策略独立测试
- ✅ 策略可以动态切换

---

### 3. 工厂模式 (Factory Pattern)

#### 目的
集中管理Socket事件处理器的创建。

#### 实现

**EventHandler接口**:
```typescript
interface EventHandler {
  getEventName(): string
  handle(data: any): void
}
```

**具体Handler**:
```typescript
class PlayerJoinedHandler implements EventHandler {
  constructor(private context: EventContext) {}

  getEventName(): string {
    return 'player_joined'
  }

  handle(data: any): void {
    this.context.dispatch(updatePlayers(data.players))
    this.context.addMessage(`${data.playerName} 加入了游戏`)
  }
}

class CardsPlayedHandler implements EventHandler {
  constructor(private context: EventContext) {}

  getEventName(): string {
    return 'cards_played'
  }

  handle(data: any): void {
    this.context.dispatch(playCardsAction(data))
    // 播放音效等...
  }
}
```

**EventHandlerFactory**:
```typescript
export class EventHandlerFactory {
  private handlers: Map<string, EventHandler> = new Map()

  constructor(context: EventContext) {
    // 注册所有处理器
    this.registerHandler(new PlayerJoinedHandler(context))
    this.registerHandler(new CardsPlayedHandler(context))
    this.registerHandler(new PlayerPassedHandler(context))
    this.registerHandler(new GameEndedHandler(context))
    // ... 更多处理器
  }

  private registerHandler(handler: EventHandler): void {
    this.handlers.set(handler.getEventName(), handler)
  }

  handleEvent(eventName: string, data: any): void {
    const handler = this.handlers.get(eventName)
    
    if (handler) {
      handler.handle(data)
    } else {
      console.warn(`未找到事件处理器: ${eventName}`)
    }
  }
}
```

#### 优势
- ✅ 集中管理事件处理
- ✅ 易于扩展新事件
- ✅ 降低代码耦合度

---

### 4. 状态模式 (State Pattern)

#### 目的
管理游戏的状态转换。

#### 实现

**GameState接口**:
```typescript
interface GameState {
  getName(): string
  canTransitionTo(state: string): boolean
  onEnter(): void
  onExit(): void
}
```

**具体状态**:
```typescript
class WaitingState implements GameState {
  getName(): string {
    return 'waiting'
  }

  canTransitionTo(state: string): boolean {
    return state === 'bidding'
  }

  onEnter(): void {
    console.log('进入等待状态')
  }

  onExit(): void {
    console.log('离开等待状态')
  }
}
```

**GameStateMachine**:
```typescript
export class GameStateMachine {
  private currentState: GameState
  private states: Map<string, GameState> = new Map()

  constructor(initialState: string = 'waiting') {
    // 注册所有状态
    this.registerState(new WaitingState())
    this.registerState(new BiddingState())
    this.registerState(new PlayingState())
    this.registerState(new FinishedState())
    
    // 设置初始状态
    this.currentState = this.states.get(initialState)!
    this.currentState.onEnter()
  }

  transition(newStateName: string): boolean {
    if (!this.currentState.canTransitionTo(newStateName)) {
      console.warn(`非法状态转换: ${this.currentState.getName()} -> ${newStateName}`)
      return false
    }

    const newState = this.states.get(newStateName)
    if (!newState) {
      console.error(`未找到状态: ${newStateName}`)
      return false
    }

    this.currentState.onExit()
    this.currentState = newState
    this.currentState.onEnter()
    
    return true
  }

  getCurrentState(): string {
    return this.currentState.getName()
  }

  private registerState(state: GameState): void {
    this.states.set(state.getName(), state)
  }
}
```

---

### 5. 观察者模式 (Observer Pattern)

#### 目的
建立事件发布订阅系统。

#### 实现

**Observer接口**:
```typescript
export interface GameObserver {
  update(event: GameEvent): void
  getObserverId(): string
}

export interface GameEvent {
  type: string
  data: any
  timestamp: number
}
```

**具体Observer**:
```typescript
export class ScoreChangeObserver implements GameObserver {
  constructor(
    private onScoreChange: (playerId: string, newScore: number) => void
  ) {}

  getObserverId(): string {
    return 'score-change-observer'
  }

  update(event: GameEvent): void {
    if (event.type === 'score_changed') {
      this.onScoreChange(event.data.playerId, event.data.newScore)
    }
  }
}
```

**Subject**:
```typescript
export class GameEventSubject {
  private observers: Map<string, GameObserver> = new Map()

  attach(observer: GameObserver): void {
    const id = observer.getObserverId()
    this.observers.set(id, observer)
  }

  detach(observerId: string): void {
    this.observers.delete(observerId)
  }

  notify(event: GameEvent): void {
    this.observers.forEach(observer => {
      try {
        observer.update(event)
      } catch (error) {
        console.error(`观察者 ${observer.getObserverId()} 处理事件失败:`, error)
      }
    })
  }

  publishEvent(type: string, data: any): void {
    this.notify({
      type,
      data,
      timestamp: Date.now()
    })
  }
}
```

---

## 📊 设计模式总结

| 模式 | 应用场景 | 行数 | 集成状态 |
|------|----------|------|----------|
| 命令模式 | 出牌、不出、抢地主 | 128 | ✅ 已集成 |
| 策略模式 | 自动出牌逻辑 | 155 | ✅ 已集成 |
| 工厂模式 | Socket事件处理 | 111 | 📦 可用 |
| 状态模式 | 游戏状态管理 | 201 | 📦 可用 |
| 观察者模式 | 事件发布订阅 | 205 | 📦 可用 |

**总计**: 800行高质量设计模式代码

---

这份文档详细说明了所有Socket事件和设计模式的应用，便于理解整个系统的交互机制。
