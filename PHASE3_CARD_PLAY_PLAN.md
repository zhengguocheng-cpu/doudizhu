# 🎴 阶段3：出牌逻辑实现计划

**开始时间**: 2025-10-26 13:30  
**当前进度**: 75% → 目标 90%  
**预计完成时间**: 2-3小时

---

## 📋 功能需求

### **核心功能**

1. **牌型识别**
   - 单张
   - 对子
   - 三张
   - 三带一
   - 三带二
   - 顺子（5张及以上连续单牌）
   - 连对（3对及以上连续对子）
   - 飞机（2个及以上连续三张）
   - 飞机带翅膀
   - 四带二
   - 炸弹（4张相同）
   - 王炸（大王+小王）

2. **牌型比较**
   - 相同牌型比较大小
   - 炸弹可以压任何牌（除了更大的炸弹）
   - 王炸最大

3. **出牌验证**
   - 验证玩家是否有这些牌
   - 验证牌型是否合法
   - 验证是否能压过上家（非首次出牌）
   - 首次出牌可以出任意合法牌型

4. **游戏流程**
   - 地主先出牌
   - 顺时针轮流出牌
   - 可以选择"不出"（跟牌）
   - 一轮结束后，最后出牌的玩家重新开始
   - 检测游戏结束（手牌为空）

---

## 🏗️ 架构设计

### **文件结构**

```
backend/src/services/game/
├── CardTypeDetector.ts      # 牌型识别
├── CardComparator.ts         # 牌型比较
├── CardPlayValidator.ts      # 出牌验证
└── CardPlayHandler.ts        # 出牌处理（整合上述功能）
```

### **类设计**

#### **1. CardTypeDetector（牌型识别器）**

```typescript
export enum CardType {
  SINGLE = 'single',           // 单张
  PAIR = 'pair',               // 对子
  TRIPLE = 'triple',           // 三张
  TRIPLE_WITH_SINGLE = 'triple_with_single',  // 三带一
  TRIPLE_WITH_PAIR = 'triple_with_pair',      // 三带二
  STRAIGHT = 'straight',       // 顺子
  CONSECUTIVE_PAIRS = 'consecutive_pairs',    // 连对
  AIRPLANE = 'airplane',       // 飞机
  AIRPLANE_WITH_WINGS = 'airplane_with_wings', // 飞机带翅膀
  FOUR_WITH_TWO = 'four_with_two',  // 四带二
  BOMB = 'bomb',               // 炸弹
  ROCKET = 'rocket',           // 王炸
  INVALID = 'invalid'          // 无效牌型
}

export interface CardPattern {
  type: CardType;
  value: number;      // 主牌值（用于比较大小）
  cards: string[];    // 牌面
  length?: number;    // 顺子/连对/飞机的长度
}

export class CardTypeDetector {
  public static detect(cards: string[]): CardPattern;
  private static isSingle(cards: string[]): CardPattern | null;
  private static isPair(cards: string[]): CardPattern | null;
  private static isTriple(cards: string[]): CardPattern | null;
  private static isStraight(cards: string[]): CardPattern | null;
  private static isBomb(cards: string[]): CardPattern | null;
  private static isRocket(cards: string[]): CardPattern | null;
  // ... 其他牌型检测方法
}
```

#### **2. CardComparator（牌型比较器）**

```typescript
export class CardComparator {
  /**
   * 比较两个牌型
   * @returns 1: pattern1大, -1: pattern2大, 0: 无法比较
   */
  public static compare(
    pattern1: CardPattern, 
    pattern2: CardPattern
  ): number;
  
  private static canCompare(
    pattern1: CardPattern, 
    pattern2: CardPattern
  ): boolean;
  
  private static getCardValue(card: string): number;
}
```

#### **3. CardPlayValidator（出牌验证器）**

```typescript
export class CardPlayValidator {
  /**
   * 验证出牌是否合法
   */
  public static validate(
    playerCards: string[],     // 玩家手牌
    playedCards: string[],      // 要出的牌
    lastPattern: CardPattern | null,  // 上家的牌型
    isFirstPlay: boolean        // 是否首次出牌
  ): { valid: boolean; error?: string };
  
  private static hasCards(
    playerCards: string[], 
    playedCards: string[]
  ): boolean;
  
  private static canBeat(
    newPattern: CardPattern, 
    lastPattern: CardPattern
  ): boolean;
}
```

#### **4. CardPlayHandler（出牌处理器）**

```typescript
export class CardPlayHandler {
  constructor(private io: Server);
  
  /**
   * 处理玩家出牌
   */
  public handlePlayCards(
    roomId: string,
    userId: string,
    cards: string[]
  ): void;
  
  /**
   * 处理玩家不出（跟牌）
   */
  public handlePass(
    roomId: string,
    userId: string
  ): void;
  
  /**
   * 检查游戏是否结束
   */
  private checkGameOver(roomId: string): boolean;
  
  /**
   * 切换到下一个玩家
   */
  private nextPlayer(roomId: string): void;
  
  /**
   * 开始新一轮
   */
  private startNewRound(roomId: string, startPlayerId: string): void;
}
```

---

## 🎯 实现步骤

### **步骤1: 实现牌型识别（CardTypeDetector）** ⏳

**优先级**: 最高  
**预计时间**: 1小时

**任务**:
1. 定义牌型枚举和接口
2. 实现卡牌值转换（3-K, A, 2, 小王, 大王）
3. 实现各种牌型的识别算法
4. 编写单元测试

**关键算法**:
- 单张/对子/三张：计数
- 顺子：排序后检查连续性
- 炸弹：4张相同
- 王炸：大王+小王

---

### **步骤2: 实现牌型比较（CardComparator）** ⏳

**优先级**: 高  
**预计时间**: 30分钟

**任务**:
1. 实现牌型比较逻辑
2. 处理特殊情况（炸弹、王炸）
3. 编写测试用例

**规则**:
- 相同牌型比较主牌值
- 炸弹 > 普通牌型
- 王炸 > 炸弹
- 不同牌型无法比较

---

### **步骤3: 实现出牌验证（CardPlayValidator）** ⏳

**优先级**: 高  
**预计时间**: 30分钟

**任务**:
1. 验证玩家是否拥有要出的牌
2. 验证牌型是否合法
3. 验证是否能压过上家
4. 编写测试用例

---

### **步骤4: 实现出牌处理（CardPlayHandler）** ⏳

**优先级**: 高  
**预计时间**: 45分钟

**任务**:
1. 整合上述三个模块
2. 实现出牌流程
3. 实现不出（跟牌）逻辑
4. 实现游戏结束检测
5. 实现下一个玩家切换

---

### **步骤5: 集成到GameFlowHandler** ⏳

**优先级**: 高  
**预计时间**: 15分钟

**任务**:
1. 在GameFlowHandler中初始化CardPlayHandler
2. 添加游戏状态管理
3. 连接抢地主和出牌阶段

---

### **步骤6: 前端UI和事件处理** ⏳

**优先级**: 中  
**预计时间**: 30分钟

**任务**:
1. 在测试页面添加出牌UI
2. 添加牌的选择功能
3. 添加"出牌"和"不出"按钮
4. 监听出牌相关事件
5. 显示当前出牌玩家
6. 显示上家的牌

---

### **步骤7: 测试和调试** ⏳

**优先级**: 高  
**预计时间**: 30分钟

**任务**:
1. 测试各种牌型
2. 测试出牌流程
3. 测试游戏结束
4. 修复发现的问题

---

## 📡 事件设计

### **客户端 → 服务器**

```typescript
// 出牌
'play_cards': {
  roomId: string,
  userId: string,
  cards: string[]  // 例如: ['♠3', '♥3', '♦3']
}

// 不出（跟牌）
'pass_turn': {
  roomId: string,
  userId: string
}
```

### **服务器 → 客户端**

```typescript
// 轮到某玩家出牌
'turn_to_play': {
  playerId: string,
  playerName: string,
  isFirstPlay: boolean,  // 是否是新一轮的首次出牌
  lastPattern: CardPattern | null  // 上家的牌型
}

// 出牌成功
'cards_played': {
  playerId: string,
  playerName: string,
  cards: string[],
  pattern: CardPattern,
  remainingCards: number  // 剩余手牌数
}

// 玩家不出
'player_passed': {
  playerId: string,
  playerName: string
}

// 新一轮开始
'new_round_started': {
  startPlayerId: string,
  startPlayerName: string
}

// 游戏结束
'game_over': {
  winnerId: string,
  winnerName: string,
  winnerRole: 'landlord' | 'farmer',
  landlordWin: boolean
}

// 出牌失败
'play_cards_failed': {
  error: string
}
```

---

## 🎮 牌值定义

```typescript
// 牌面值映射
const CARD_VALUES: { [key: string]: number } = {
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 11,
  'Q': 12,
  'K': 13,
  'A': 14,
  '2': 15,
  '小王': 16,
  '大王': 17
};

// 花色（用于显示，不影响大小）
const SUITS = ['♠', '♥', '♣', '♦'];
```

---

## 🧪 测试用例

### **牌型识别测试**

```typescript
// 单张
['♠3'] → { type: 'single', value: 3 }

// 对子
['♠3', '♥3'] → { type: 'pair', value: 3 }

// 三张
['♠3', '♥3', '♦3'] → { type: 'triple', value: 3 }

// 顺子
['♠3', '♥4', '♦5', '♠6', '♥7'] → { type: 'straight', value: 7, length: 5 }

// 炸弹
['♠3', '♥3', '♦3', '♣3'] → { type: 'bomb', value: 3 }

// 王炸
['小王', '大王'] → { type: 'rocket', value: 17 }
```

### **牌型比较测试**

```typescript
// 相同牌型
compare(['♠5'], ['♠3']) → 1  // 5 > 3

// 炸弹 vs 普通牌
compare(['♠3','♥3','♦3','♣3'], ['♠A','♥A']) → 1  // 炸弹大

// 王炸 vs 炸弹
compare(['小王','大王'], ['♠A','♥A','♦A','♣A']) → 1  // 王炸最大
```

---

## 📊 数据结构

### **房间游戏状态扩展**

```typescript
interface GameState {
  landlordId: string;
  currentPlayerId: string;
  lastPlayerId: string | null;      // 最后出牌的玩家
  lastPattern: CardPattern | null;  // 最后的牌型
  passCount: number;                // 连续不出的次数
  isNewRound: boolean;              // 是否是新一轮
}
```

---

## 🚀 开始实现

准备好了吗？让我们开始实现出牌逻辑！

**第一步**: 创建CardTypeDetector类，实现牌型识别。

你准备好了吗？我可以立即开始实现！🎯
