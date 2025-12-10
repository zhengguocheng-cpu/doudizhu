# 🏗️ 斗地主游戏架构文档索引

> **完整的系统架构、流程和设计文档集**

---

## 📚 文档清单

### 1. [系统架构总览](./SYSTEM_ARCHITECTURE.md)
**内容**:
- 系统概览
- 技术栈介绍
- 整体架构图
- 前端架构详解
- 后端架构详解

**适用对象**: 新成员、架构师、技术负责人

---

### 2. [游戏完整流程](./GAME_FLOW_DOCUMENTATION.md)
**内容**:
- 准备阶段流程
- 发牌阶段流程
- 抢地主阶段流程
- 游戏阶段流程 (出牌/不出)
- 结算阶段流程
- 完整时序图

**适用对象**: 产品经理、测试人员、开发人员

---

### 3. [Socket事件与设计模式](./SOCKET_EVENTS_AND_PATTERNS.md)
**内容**:
- Socket.IO事件完整列表
- 事件数据结构
- 5种设计模式详解:
  - 命令模式
  - 策略模式
  - 工厂模式
  - 状态模式
  - 观察者模式
- 设计模式使用示例

**适用对象**: 前后端开发人员、架构师

---

### 4. [目录结构与核心组件](./DIRECTORY_STRUCTURE.md)
**内容**:
- 前端目录完整结构
- 后端目录完整结构
- 核心组件详解
- 代码统计
- 关键路径追踪

**适用对象**: 开发人员、代码审查者

---

## 🚀 快速导航

### 我想了解...

#### 🎯 整体架构
→ 阅读 [系统架构总览](./SYSTEM_ARCHITECTURE.md)

#### 🎮 游戏是如何运行的
→ 阅读 [游戏完整流程](./GAME_FLOW_DOCUMENTATION.md)

#### 💬 前后端如何通信
→ 阅读 [Socket事件与设计模式](./SOCKET_EVENTS_AND_PATTERNS.md) 第一部分

#### 🎨 用了哪些设计模式
→ 阅读 [Socket事件与设计模式](./SOCKET_EVENTS_AND_PATTERNS.md) 第二部分

#### 📁 代码在哪里
→ 阅读 [目录结构与核心组件](./DIRECTORY_STRUCTURE.md)

#### 🐛 出牌逻辑在哪
→ 阅读 [目录结构与核心组件](./DIRECTORY_STRUCTURE.md) - CardPlayHandler章节

#### 🔧 如何扩展新功能
→ 阅读 [Socket事件与设计模式](./SOCKET_EVENTS_AND_PATTERNS.md) - 设计模式章节

---

## 📊 项目概览

### 技术栈
```
前端: React 18 + TypeScript + Redux Toolkit + Socket.IO Client
后端: Node.js + TypeScript + Socket.IO
```

### 核心特性
✅ 实时多人对战  
✅ AI机器人支持  
✅ 智能出牌提示  
✅ 完整积分系统  
✅ 5种设计模式  
✅ 高度模块化

### 代码统计
```
前端代码:  ~4540行
后端代码:  ~5300行
设计模式:   ~820行
文档:      ~2000行
总计:     ~12660行
```

---

## 🎯 关键模块速查

### 前端核心
| 模块 | 文件 | 行数 | 说明 |
|------|------|------|------|
| 主组件 | `GameRoom/index.tsx` | 1790 | 游戏主容器 |
| 命令模式 | `patterns/GameCommands.ts` | 148 | 出牌/不出/抢地主 |
| 策略模式 | `patterns/AutoPlayStrategies.ts` | 155 | 自动出牌 |
| UI管理 | `hooks/useGameUI.ts` | 200 | UI状态 |
| 计时器 | `hooks/useGameTimer.ts` | 150 | 倒计时 |

### 后端核心
| 模块 | 文件 | 行数 | 说明 |
|------|------|------|------|
| 出牌处理 | `CardPlayHandler.ts` | 1257 | 核心逻辑 |
| 事件处理 | `SocketEventHandler.ts` | 715 | Socket路由 |
| 牌型识别 | `CardTypeDetector.ts` | 428 | 13种牌型 |
| 分数计算 | `ScoreCalculator.ts` | 339 | 倍数/春天 |
| 游戏流程 | `GameFlowHandler.ts` | 300+ | 开始/结束 |

---

## 🔄 完整游戏流程图

```
用户进入房间
    ↓
标记准备
    ↓
所有人准备 → 自动开始游戏
    ↓
洗牌发牌 (每人17张 + 3张底牌)
    ↓
轮流抢地主
    ↓
确定地主 → 分配底牌
    ↓
地主先出牌
    ↓
┌─────────────────┐
│  游戏循环        │
│  ├─ 当前玩家出牌 │
│  ├─ 或选择不出   │
│  ├─ 验证牌型     │
│  ├─ 广播结果     │
│  └─ 下一个玩家   │
└─────────────────┘
    ↓
某玩家手牌为空 → 游戏结束
    ↓
计算分数 (基础分×倍数)
    ↓
显示结算面板
    ↓
5秒后准备下一局
```

---

## 🎨 设计模式应用图

```
命令模式 (Command)
├─ PlayCardsCommand    # 出牌
├─ PassCommand          # 不出
└─ BidCommand           # 抢地主

策略模式 (Strategy)
├─ FullHandStrategy     # 整手出牌
├─ TimeoutStrategy      # 超时自动
└─ NoValidCardsStrategy # 无牌自动不出

工厂模式 (Factory)
├─ PlayerJoinedHandler
├─ CardsPlayedHandler
└─ GameEndedHandler

状态模式 (State)
├─ WaitingState         # 等待
├─ BiddingState         # 抢地主
├─ PlayingState         # 游戏中
└─ FinishedState        # 已结束

观察者模式 (Observer)
├─ ScoreChangeObserver
├─ GameStateObserver
└─ ChatMessageObserver
```

---

## 📡 Socket事件速查

### 核心事件

| 事件名 | 方向 | 用途 | 文档位置 |
|--------|------|------|----------|
| `join_game` | C→S | 加入房间 | Socket事件文档 第2章 |
| `player_ready` | C→S | 标记准备 | Socket事件文档 第3章 |
| `start_game` | S→C | 游戏开始 | Socket事件文档 第3章 |
| `bid` | C→S | 抢地主 | Socket事件文档 第3章 |
| `landlord_determined` | S→C | 地主确定 | Socket事件文档 第3章 |
| `play_cards` | C→S | 出牌 | Socket事件文档 第3章 |
| `cards_played` | S→C | 出牌广播 | Socket事件文档 第3章 |
| `pass_turn` | C→S | 不出 | Socket事件文档 第3章 |
| `player_passed` | S→C | 不出广播 | Socket事件文档 第3章 |
| `game_ended` | S→C | 游戏结束 | Socket事件文档 第3章 |

**C→S**: 客户端到服务器  
**S→C**: 服务器到客户端

---

## 🛠️ 开发指南

### 新手上手路径

1. **第1天**: 阅读系统架构总览，了解整体设计
2. **第2天**: 阅读游戏完整流程，理解业务逻辑
3. **第3天**: 阅读Socket事件文档，熟悉通信协议
4. **第4天**: 阅读目录结构文档，定位核心代码
5. **第5天**: 实际运行项目，调试关键流程

### 开发新功能流程

1. **需求分析** → 确定需要修改哪些模块
2. **查阅文档** → 找到相关的事件和组件
3. **前端开发** → 修改组件和Socket监听
4. **后端开发** → 修改事件处理和业务逻辑
5. **联调测试** → 验证前后端交互
6. **更新文档** → 补充新增的事件和组件说明

### Bug排查路径

**前端Bug**:
1. 检查 Redux DevTools (状态)
2. 检查 Console (Socket事件)
3. 检查 `handleXXX` 方法
4. 检查设计模式集成

**后端Bug**:
1. 检查 Console日志
2. 检查 `CardPlayHandler`
3. 检查事件广播逻辑
4. 检查游戏状态

**Socket通信Bug**:
1. 对比事件名称 (大小写)
2. 检查数据结构
3. 检查房间ID
4. 检查事件回调

---

## 📝 文档维护

### 更新原则

- ✅ 新增功能 → 更新流程文档
- ✅ 新增事件 → 更新Socket文档
- ✅ 新增组件 → 更新目录文档
- ✅ 架构调整 → 更新架构文档

### 文档版本

| 文档 | 版本 | 更新日期 | 备注 |
|------|------|----------|------|
| 系统架构 | v1.0 | 2025-12-11 | 初始版本 |
| 游戏流程 | v1.0 | 2025-12-11 | 初始版本 |
| Socket事件 | v1.0 | 2025-12-11 | 初始版本 |
| 目录结构 | v1.0 | 2025-12-11 | 初始版本 |

---

## 🎓 学习建议

### 对于前端开发者

**必读**:
- ✅ 系统架构 (前端部分)
- ✅ Socket事件 (客户端事件)
- ✅ 设计模式 (命令/策略)
- ✅ 目录结构 (前端目录)

**选读**:
- 游戏流程 (前端交互部分)
- 后端架构 (了解API)

### 对于后端开发者

**必读**:
- ✅ 系统架构 (后端部分)
- ✅ 游戏流程 (全部)
- ✅ Socket事件 (服务端事件)
- ✅ 目录结构 (后端目录)

**选读**:
- 前端架构 (了解客户端)
- 设计模式 (可借鉴)

### 对于架构师

**必读**:
- ✅ 全部文档

**重点关注**:
- 设计模式应用
- Socket通信设计
- 状态管理方案
- 代码组织结构

---

## 📞 联系方式

- 项目路径: `e:\windsurf_prj\doudizhu`
- 前端路径: `e:\windsurf_prj\doudizhu\frontend-spa`
- 后端路径: `e:\windsurf_prj\doudizhu\backend`

---

## 🎉 总结

这套文档提供了斗地主游戏系统的**完整技术视图**，包括：

- 📐 **架构设计** - 前后端分离、模块化
- 🎮 **游戏流程** - 从准备到结算的全流程
- 💬 **通信协议** - Socket.IO事件规范
- 🎨 **设计模式** - 5种经典模式应用
- 📁 **代码组织** - 清晰的目录结构

**无论你是开发、测试、产品还是架构，都能在这里找到你需要的信息！** 🚀

---

*最后更新: 2025-12-11*
