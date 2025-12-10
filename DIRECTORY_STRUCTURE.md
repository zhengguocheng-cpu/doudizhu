# 目录结构与关键组件说明

> 完整的项目目录结构和核心模块详解

---

## 📁 项目总体结构

```
doudizhu/
├── frontend-spa/          # 前端SPA应用
├── backend/               # 后端Node.js服务
├── SYSTEM_ARCHITECTURE.md # 系统架构文档
├── GAME_FLOW_DOCUMENTATION.md  # 游戏流程文档
├── SOCKET_EVENTS_AND_PATTERNS.md  # Socket事件和设计模式
└── DIRECTORY_STRUCTURE.md # 本文档
```

---

## 🎨 前端目录结构

### 完整结构树

```
frontend-spa/src/
├── pages/
│   └── GameRoom/                    # 游戏主页面 (核心)
│       ├── index.tsx                # 主组件 (1790行)
│       ├── index.backup.tsx         # 备份文件
│       ├── components/              # UI组件
│       │   ├── AiHintPanel/        # AI提示面板 (已移除)
│       │   ├── BottomCards/        # 底牌展示
│       │   ├── BottomPlayedCards/  # 底部出牌区
│       │   ├── BottomPlayerInfo/   # 底部玩家信息
│       │   ├── CenterResultPanel/  # 中央结算面板
│       │   ├── ChatContainer/      # 聊天容器
│       │   ├── GameActions/        # 操作按钮
│       │   ├── HandCards/          # 手牌展示
│       │   ├── PlayerDisplay/      # 玩家信息展示
│       │   ├── SettlementPanel/    # 结算面板
│       │   ├── TopPlayersArea/     # 上方玩家区域
│       │   └── index.ts            # 组件导出
│       ├── hooks/                   # 自定义Hooks
│       │   ├── index.ts
│       │   ├── useAutoPlay.ts      # 自动出牌Hook (180行)
│       │   ├── useGameSocket.ts    # Socket Hook
│       │   ├── useGameTimer.ts     # 游戏计时器 (150行)
│       │   ├── useGameUI.ts        # UI状态管理 (200行)
│       │   └── useWalletScore.ts   # 积分钱包 (100行)
│       ├── logic/                   # 业务逻辑
│       │   ├── cardOperations.ts   # 卡牌操作
│       │   ├── gameFlow.ts         # 游戏流程 (已弃用)
│       │   ├── helpers.ts          # 辅助函数
│       │   ├── playerHelper.ts     # 玩家辅助
│       │   ├── voiceHelper.ts      # 语音辅助
│       │   └── walletHelper.ts     # 钱包辅助
│       ├── patterns/                # 设计模式 ⭐
│       │   ├── AutoPlayStrategies.ts   # 策略模式 (155行)
│       │   ├── EventHandlerFactory.ts  # 工厂模式 (111行)
│       │   ├── GameCommands.ts         # 命令模式 (148行)
│       │   ├── GameEventObserver.ts    # 观察者模式 (205行)
│       │   ├── GameStateMachine.ts     # 状态模式 (201行)
│       │   ├── index.ts                # 模式导出
│       │   └── README.md               # 模式说明 (329行)
│       ├── events/                  # 事件处理
│       │   ├── gameEvents.ts
│       │   ├── roomEvents.ts
│       │   └── index.ts
│       ├── utils/                   # 工具函数
│       │   ├── cardUtils.ts
│       │   ├── formatUtils.ts
│       │   └── index.ts
│       ├── style.css                # 样式文件 (50KB)
│       ├── game.css                 # 游戏样式 (14KB)
│       └── ai-panel.css             # AI面板样式 (8KB)
├── store/                           # Redux状态管理
│   ├── index.ts
│   └── slices/
│       ├── gameSlice.ts            # 游戏状态切片
│       └── userSlice.ts            # 用户状态切片
├── services/                        # 服务层
│   ├── socket.ts                   # Socket.IO客户端
│   └── api.ts                      # HTTP API
├── utils/                           # 全局工具
│   ├── cardHintHelper.ts           # 出牌提示算法
│   ├── sound.ts                    # 音效管理
│   ├── llmSettings.ts              # LLM配置
│   └── gameSettings.ts             # 游戏配置
├── context/                         # React Context
│   └── AuthContext.tsx             # 认证上下文
├── hooks/                           # 全局Hooks
│   ├── useAppDispatch.ts
│   └── useSocketStatus.ts
├── styles/                          # 全局样式
│   └── avatars.css                 # 头像样式
├── games/                           # 游戏特定组件
│   └── doudizhu/
│       └── components/
│           └── BiddingControls.tsx # 抢地主UI
├── App.tsx                          # 应用入口
├── main.tsx                         # React入口
└── package.json                     # 依赖配置
```

---

## 🔧 后端目录结构

### 完整结构树

```
backend/src/
├── services/                        # 服务层 (核心)
│   ├── game/                       # 游戏服务 ⭐
│   │   ├── gameEngine.ts           # 游戏引擎 (流程控制)
│   │   ├── gameRules.ts            # 游戏规则
│   │   ├── gameState.ts            # 状态管理
│   │   ├── gameService.ts          # 统一接口
│   │   ├── gameRoomsService.ts     # 房间管理
│   │   ├── CardPlayHandler.ts      # 出牌处理 (1257行) ⭐
│   │   ├── CardPlayValidator.ts    # 出牌验证
│   │   ├── CardTypeDetector.ts     # 牌型识别
│   │   ├── CardComparator.ts       # 牌型比较
│   │   ├── ScoreCalculator.ts      # 分数计算
│   │   ├── README.md               # 游戏服务文档
│   │   └── index.ts
│   ├── socket/                     # Socket服务 ⭐
│   │   ├── SocketEventHandler.ts   # 事件处理器 (715行)
│   │   └── index.ts
│   ├── room/                       # 房间服务
│   │   ├── RoomService.ts
│   │   ├── RoomManager.ts
│   │   ├── RoomStateManager.ts
│   │   └── index.ts
│   ├── player/                     # 玩家服务
│   │   ├── PlayerService.ts
│   │   ├── PlayerManager.ts
│   │   ├── AIPlayerService.ts      # AI机器人
│   │   └── index.ts
│   ├── card/                       # 扑克牌服务
│   │   ├── CardService.ts          # 基础服务
│   │   ├── CardDeck.ts             # 牌堆
│   │   ├── CardPattern.ts          # 牌型
│   │   ├── CardTypes.ts            # 类型定义
│   │   └── index.ts
│   ├── llm/                        # LLM服务
│   │   ├── LLMService.ts           # 大模型调用
│   │   └── prompts.ts              # 提示词
│   ├── state/                      # 状态服务
│   │   ├── GameFlowHandler.ts      # 游戏流程 (重要)
│   │   └── StateManager.ts
│   ├── gameFacade.ts               # 游戏门面 (统一入口)
│   ├── README.md                   # 服务文档
│   └── index.ts
├── routes/                          # 路由
│   ├── gameRoutes.ts
│   └── index.ts
├── types/                           # 类型定义
│   ├── game.types.ts
│   ├── player.types.ts
│   └── room.types.ts
├── utils/                           # 工具函数
│   └── logger.ts
├── app.ts                           # Express应用 ⭐
└── server.ts                        # 服务器入口
```

---

## 🎯 核心组件详解

### 前端核心

#### 1. GameRoom/index.tsx (1790行)
**职责**: 游戏主容器组件

**关键功能**:
- Redux状态管理
- Socket事件监听
- 游戏UI渲染
- 用户交互处理

**主要State**:
```typescript
const [isMyTurn, setIsMyTurn] = useState(false)
const [canPass, setCanPass] = useState(false)
const [playPendingRef, setPlayPending] = useState(false)
const [showResultPanel, setShowResultPanel] = useState(false)
const [chatVisible, setChatVisible] = useState(false)
```

**关键Hooks使用**:
```typescript
const gameUI = useGameUI()            // UI状态
const { turnTimer, startTurnTimer } = useGameTimer()  // 计时器
const { walletScore, updateWalletScore } = useWalletScore()  // 积分
```

**核心方法**:
- `doPlayCards(cards)` - 出牌
- `handlePass()` - 不出
- `handleBid(isGrab)` - 抢地主
- `handleCardsPlayed(data)` - 接收出牌
- `handleGameEnded(data)` - 游戏结束

---

#### 2. patterns/ (设计模式目录)

##### GameCommands.ts (148行)
**实现**: 命令模式

**类**:
- `GameCommand` 接口
- `PlayCardsCommand` - 出牌命令
- `PassCommand` - 不出命令
- `BidCommand` - 抢地主命令
- `CommandManager` - 命令管理器

**集成状态**: ✅ 已完全集成

---

##### AutoPlayStrategies.ts (155行)
**实现**: 策略模式

**类**:
- `AutoPlayStrategy` 接口
- `FullHandStrategy` - 整手出牌策略
- `TimeoutStrategy` - 超时策略
- `NoValidCardsStrategy` - 无牌策略
- `AutoPlayStrategyManager` - 策略管理器

**集成状态**: ✅ 已完全集成

---

##### EventHandlerFactory.ts (111行)
**实现**: 工厂模式

**类**:
- `EventHandler` 接口
- `PlayerJoinedHandler`
- `CardsPlayedHandler`
- `GameEndedHandler`
- `EventHandlerFactory` - 工厂类

**集成状态**: 📦 已创建，可选集成

---

##### GameStateMachine.ts (201行)
**实现**: 状态模式

**类**:
- `GameState` 接口
- `WaitingState`
- `BiddingState`
- `PlayingState`
- `FinishedState`
- `GameStateMachine` - 状态机

**集成状态**: 📦 已创建，可选集成

---

##### GameEventObserver.ts (205行)
**实现**: 观察者模式

**类**:
- `GameObserver` 接口
- `ScoreChangeObserver`
- `GameStateObserver`
- `ChatMessageObserver`
- `GameHistoryObserver`
- `GameEventSubject` - 主题类

**集成状态**: 📦 已创建，可选集成

---

#### 3. hooks/ (自定义Hooks)

##### useGameUI.ts (200行)
**职责**: 管理所有UI状态

**导出**:
```typescript
{
  // 聊天
  chatVisible, toggleChat, chatMessage, updateChatInput,
  chatMessages, addChatMessage, clearChatInput,
  
  // 抢地主
  showBiddingUI, openBiddingUI, closeBiddingUI,
  
  // 动画
  isDealingAnimation, startDealingAnimation,
  
  // 底牌
  hideBottomCards, toggleBottomCards,
  
  // 结算
  showResultPanel, openResultPanel, closeResultPanel,
  
  // 玩家标记
  passedPlayers, markPlayerAsPassed, clearAllPassedPlayers
}
```

---

##### useGameTimer.ts (150行)
**职责**: 游戏倒计时管理

**导出**:
```typescript
{
  turnTimer: number,           // 当前倒计时
  startTurnTimer: (seconds) => void,  // 开始计时
  stopTurnTimer: () => void,   // 停止计时
  resetTurnTimer: () => void   // 重置计时
}
```

**实现**:
```typescript
useEffect(() => {
  if (turnTimer > 0) {
    const timer = setTimeout(() => {
      setTurnTimer(prev => prev - 1)
    }, 1000)
    
    return () => clearTimeout(timer)
  }
}, [turnTimer])
```

---

##### useWalletScore.ts (100行)
**职责**: 积分钱包管理

**导出**:
```typescript
{
  walletScore: number,                    // 当前积分
  updateWalletScore: (delta) => void,     // 更新积分
  baseScore: number,                      // 基础分
  multiplier: number,                     // 倍数
  setBaseScore: (score) => void,
  setMultiplier: (mult) => void
}
```

---

#### 4. components/ (UI组件)

##### CenterResultPanel (结算面板)
**职责**: 显示游戏结算结果

**Props**:
```typescript
{
  visible: boolean
  winnerId: string
  scores: PlayerScore[]
  multiplier: number
  onClose: () => void
}
```

---

##### ChatContainer (聊天容器)
**职责**: 聊天功能封装

**包含**:
- 聊天消息列表
- 输入框
- 显示/隐藏切换按钮

**行数**: 约100行

---

##### GameActions (操作按钮)
**职责**: 游戏操作按钮

**按钮**:
- 提示
- 出牌
- 不出

**Props**:
```typescript
{
  isMyTurn: boolean
  canPass: boolean
  onHint: () => void
  onPlay: () => void
  onPass: () => void
}
```

---

##### HandCards (手牌组件)
**职责**: 显示和选择手牌

**功能**:
- 手牌展示
- 点击选择
- 选中高亮
- 排序显示

---

### 后端核心

#### 1. CardPlayHandler.ts (1257行) ⭐
**职责**: 核心出牌逻辑处理

**关键方法**:

##### handlePlayCards()
```typescript
public handlePlayCards(
  roomId: string, 
  userId: string, 
  cards: string[], 
  requestSocketId?: string
): void
```
**流程**:
1. 验证玩家和轮次
2. 验证出牌合法性 (`CardPlayValidator`)
3. 识别牌型 (`CardTypeDetector`)
4. 比较大小 (`CardComparator`)
5. 更新游戏状态
6. 检查游戏是否结束
7. 广播出牌结果

---

##### handlePass()
```typescript
public handlePass(
  roomId: string, 
  userId: string, 
  requestSocketId?: string
): void
```
**流程**:
1. 验证可以不出
2. passCount++
3. 记录pass历史
4. 检查是否新一轮
5. 确定下一个玩家
6. 广播不出结果

---

##### handleBidLandlord()
```typescript
public handleBidLandlord(
  roomId: string, 
  userId: string, 
  isGrab: boolean
): void
```
**流程**:
1. 验证抢地主条件
2. 记录抢地主选择
3. 判断是否结束
4. 确定地主
5. 分配底牌
6. 开始游戏
7. 广播结果

---

#### 2. SocketEventHandler.ts (715行) ⭐
**职责**: Socket事件路由和处理

**关键方法**:
- `handleJoinGame()` - 加入游戏
- `handlePlayerReady()` - 玩家准备
- `handlePlayCards()` - 处理出牌
- `handlePassTurn()` - 处理不出
- `handleBidLandlord()` - 处理抢地主
- `handleSendMessage()` - 处理聊天
- `handleRequestHint()` - 处理AI提示

**事件注册**:
```typescript
// 在app.ts中
socket.on('join_game', (data) => 
  eventHandler.handleJoinGame(socket, data))
socket.on('play_cards', (data) => 
  eventHandler.handlePlayCards(socket, data))
socket.on('pass_turn', (data) => 
  eventHandler.handlePassTurn(socket, data))
// ...
```

---

#### 3. ScoreCalculator.ts (10199 bytes)
**职责**: 游戏分数计算

**核心方法**:

##### calculateGameScore()
```typescript
public static calculateGameScore(
  players: any[],
  winnerId: string,
  gameHistory: any[]
): GameScore
```

**计算逻辑**:
1. 确定获胜方 (地主 vs 农民)
2. 统计炸弹/火箭
3. 检查春天/反春
4. 计算倍数
5. 分配分数

**倍数规则**:
- 炸弹: ×2 (每个)
- 王炸: ×4
- 春天: ×16 (地主赢且农民没出过牌)
- 反春: ×16 (农民赢且地主没出过牌)

---

#### 4. GameFlowHandler.ts
**职责**: 游戏流程控制

**关键方法**:
- `startGame()` - 开始游戏
  - 洗牌
  - 发牌
  - 确定先手
- `endGame()` - 结束游戏
  - 计算分数
  - 更新积分
  - 重置状态

---

#### 5. CardTypeDetector.ts (12883 bytes)
**职责**: 识别牌型

**支持牌型**:
- SINGLE - 单牌
- PAIR - 对子
- TRIPLE - 三张
- TRIPLE_WITH_SINGLE - 三带一
- TRIPLE_WITH_PAIR - 三带二
- SEQUENCE - 顺子
- PAIR_SEQUENCE - 连对
- TRIPLE_SEQUENCE - 飞机
- AIRPLANE_WITH_WINGS - 飞机带翅膀
- FOUR_WITH_TWO - 四带二
- BOMB - 炸弹
- ROCKET - 火箭

**核心方法**:
```typescript
public static detectType(cards: string[]): CardPattern | null
```

---

## 📊 代码统计

### 前端统计

| 模块 | 文件数 | 总行数 | 说明 |
|------|--------|--------|------|
| GameRoom主组件 | 1 | 1790 | 核心组件 |
| 设计模式 | 6 | 820 | 5种模式 |
| 自定义Hooks | 5 | 630 | UI/Timer/Wallet等 |
| UI组件 | 11 | ~800 | 可复用组件 |
| 业务逻辑 | 6 | ~500 | 辅助函数 |
| **总计** | **29** | **~4540** | - |

### 后端统计

| 模块 | 文件数 | 总行数 | 说明 |
|------|--------|--------|------|
| 游戏服务 | 10 | ~3000 | 核心逻辑 |
| Socket服务 | 2 | ~800 | 事件处理 |
| 房间服务 | 4 | ~600 | 房间管理 |
| 玩家服务 | 4 | ~500 | 玩家/AI |
| 扑克牌服务 | 5 | ~400 | 牌逻辑 |
| **总计** | **25** | **~5300** | - |

### 项目总计

- **前端**: ~4540行
- **后端**: ~5300行
- **文档**: ~2000行
- **总代码**: ~11840行

---

## 🎯 关键路径

### 用户出牌完整路径

```
用户点击"出牌"
  ↓
handlePlayCards() [index.tsx]
  ↓
doPlayCards(cards) [index.tsx]
  ↓
PlayCardsCommand.execute() [patterns/GameCommands.ts]
  ↓
socket.emit('play_cards') [globalSocket]
  ↓
[后端] SocketEventHandler.handlePlayCards() [backend]
  ↓
CardPlayHandler.handlePlayCards() [backend]
  ↓
CardPlayValidator.validate() - 验证
CardTypeDetector.detectType() - 识别
CardComparator.compare() - 比较
  ↓
io.emit('cards_played') [广播]
  ↓
[前端] socket.on('cards_played')
  ↓
handleCardsPlayed(data) [index.tsx]
  ↓
dispatch(playCardsAction()) [Redux]
  ↓
UI更新
```

---

这份文档提供了完整的目录结构和核心组件说明，便于快速定位和理解代码。
