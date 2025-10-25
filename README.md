# 斗地主游戏项目

**版本**: v2.0.0 - 企业级模块化架构完成 🎉
**更新日期**: 2025年1月22日

### **🔥 热重载开发（新功能）**

项目现在支持完整的热重载开发环境！

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 🔥 启动热重载开发模式（推荐）
npm run dev:watch
```

**热重载特性**：
- ✅ 修改 `.ts` 文件自动重启服务器
- ✅ 500ms 延迟重启，避免频繁操作
- ✅ 彩色控制台输出，状态清晰
- ✅ 智能忽略 `node_modules` 和 `dist` 目录
- ✅ 支持环境变量热重载

**开发工作流程**：
1. 启动 `npm run dev:watch`
2. 修改任何源代码文件
3. 自动检测并重启服务器
4. 浏览器刷新查看效果

#### **房间数据统一管理** ✅

修复了房间数据存储不一致的问题：
- **之前**: `Application` 类和 `GameService` 类分别维护房间数据
- **现在**: 统一由 `GameService` 管理所有房间数据
- **解决**: 前端 `GET /api/games/rooms` 现在能正确获取默认房间列表

#### **🔧 CardService模块拆分完成** ✅

成功将GameService中的扑克牌相关功能拆分到独立的服务模块：

**拆分的文件结构**：
```
backend/src/services/card/
├── index.ts           # 统一导出
├── cardGenerator.ts   # 扑克牌生成器 ✨
├── cardShuffler.ts    # 洗牌算法服务 ✨
├── cardValidator.ts   # 牌型验证器 ✨
└── cardService.ts     # 主要服务接口 ✨
```

**功能特性**：
- ✅ **智能发牌**: 自动为玩家分配17张手牌 + 3张底牌
- ✅ **多种洗牌算法**: Fisher-Yates算法 + 多次洗牌
- ✅ **牌型验证**: 出牌合法性检查
- ✅ **显示优化**: 花色和牌面友好显示
- ✅ **公平性验证**: 洗牌算法公平性测试

**API接口**：
- `POST /api/games/rooms/{roomId}/validate-play` - 出牌验证 ✨

#### **🏗️ RoomService模块拆分完成** ✅

成功将GameService中的房间管理功能拆分到独立的服务模块：

**拆分的文件结构**：
```
backend/src/services/room/
├── index.ts           # 统一导出
├── roomManager.ts     # 房间生命周期管理 ✨
├── roomValidator.ts   # 房间规则验证 ✨
├── defaultRooms.ts    # 默认房间配置 ✨
└── roomService.ts     # 主要服务接口 ✨
```

**功能特性**：
- ✅ **房间CRUD**: 完整的房间创建、读取、更新、删除
- ✅ **玩家管理**: 玩家加入、离开、准备状态管理
- ✅ **规则验证**: 房间容量、游戏开始条件验证
- ✅ **状态管理**: 房间状态机和生命周期管理
- ✅ **默认房间**: 自动初始化6个默认房间

**技术改进**：
- ✅ **统一API**: 所有房间操作通过RoomService统一处理
- ✅ **错误处理**: 完善的异常处理和错误信息
- ✅ **类型安全**: 完整的TypeScript类型定义
- ✅ **Socket.IO集成**: 实时通信与房间状态同步

#### **👤 PlayerService模块拆分完成** ✅

成功将GameService中的玩家管理功能拆分到独立的服务模块：

**拆分的文件结构**：
```
backend/src/services/player/
├── index.ts           # 统一导出
├── playerManager.ts   # 玩家生命周期管理 ✨
├── playerValidator.ts # 玩家操作验证 ✨
├── playerSession.ts   # 玩家会话管理 ✨
└── playerService.ts   # 主要服务接口 ✨
```

**功能特性**：
- ✅ **玩家CRUD**: 完整的玩家创建、读取、更新、删除
- ✅ **状态管理**: 玩家准备状态、手牌、权限管理
- ✅ **权限验证**: 出牌、准备、离开等操作权限验证
- ✅ **会话跟踪**: 在线状态、活动时间、自动清理
- ✅ **规则引擎**: 完整的游戏规则和业务逻辑验证

**API接口**：
- `GET /api/games/rooms/{roomId}/players` - 获取房间玩家列表 ✨
- `GET /api/games/rooms/{roomId}/players/{playerId}/status` - 获取玩家状态 ✨

**技术改进**：
- ✅ **状态一致性**: 统一管理玩家状态，避免数据不一致
- ✅ **权限控制**: 细粒度的操作权限验证
- ✅ **会话管理**: 完整的在线状态跟踪
- ✅ **错误处理**: 完善的异常处理和业务验证

#### **🎮 GameEngine模块拆分完成** ✅

成功将GameService中的游戏逻辑功能拆分到独立的服务模块：

**拆分的文件结构**：
```
backend/src/services/game/
├── index.ts           # 统一导出
├── gameEngine.ts      # 游戏流程控制引擎 ✨
├── gameRules.ts       # 游戏规则验证 ✨
├── gameState.ts       # 游戏状态管理 ✨
└── gameService.ts     # 主要服务接口 ✨
```

**功能特性**：
- ✅ **流程控制**: 游戏开始、结束、重启完整流程
- ✅ **事件处理**: 抢地主、出牌、跳过统一处理
- ✅ **状态管理**: 游戏阶段、回合、胜负状态计算
- ✅ **规则执行**: 完整的斗地主规则验证和执行
- ✅ **数据统计**: 游戏数据统计和分析

**API接口**：
- `GET /api/games/rooms/{roomId}/game-state` - 获取游戏状态 ✨
- `POST /api/games/rooms/{roomId}/start` - 开始游戏 ✨
- `POST /api/games/rooms/{roomId}/grab-landlord` - 抢地主 ✨
- `POST /api/games/rooms/{roomId}/play-cards` - 出牌 ✨
- `POST /api/games/rooms/{roomId}/pass-turn` - 跳过回合 ✨

**技术改进**：
- ✅ **流程清晰**: 明确的状态机和事件驱动设计
- ✅ **规则完整**: 完整的游戏规则和业务逻辑
- ✅ **状态准确**: 统一的状态计算和查询
- ✅ **事件灵活**: 灵活的事件处理机制

#### **🏛️ GameFacade统一接口完成** ✅

成功创建游戏门面服务，整合所有模块：

**核心特性**：
- ✅ **统一入口**: 所有游戏操作的单一接口
- ✅ **高级操作**: 快速开始、批量操作、状态快照
- ✅ **系统管理**: 统计信息、健康检查、资源清理
- ✅ **错误处理**: 统一的异常处理和响应格式

**API接口**：
- `GET /api/games/rooms/{roomId}/snapshot` - 获取游戏快照 ✨
- `POST /api/games/rooms/{roomId}/action` - 通用游戏操作 ✨
- `GET /api/games/stats` - 获取系统统计 ✨
- `GET /api/games/health` - 系统健康检查 ✨

**技术改进**：
- ✅ **简化使用**: 统一接口，降低学习成本
- ✅ **性能优化**: 批量操作和缓存机制
- ✅ **扩展性**: 易于添加新功能
- ✅ **可维护性**: 清晰的职责分离

## 🌐 访问地址

- **大厅页面**: http://localhost:3000/lobby/
- **房间页面**: http://localhost:3000/room/
- **API文档**: http://localhost:3000/api

## 📋 项目结构

```
doudizhu/
├── backend/
│   ├── src/
│   │   ├── types/           # 模块化类型定义
│   │   │   ├── index.ts     # 统一导出
│   │   │   ├── player.ts    # 玩家类型
│   │   │   └── room.ts      # 房间类型
│   │   ├── services/        # 业务逻辑服务 ✨
│   │   │   ├── index.ts     # 统一导出所有服务
│   │   │   ├── gameService.ts # 游戏主服务（已优化）
│   │   │   ├── gameFacade.ts # 游戏门面服务 ✨
│   │   │   ├── card/        # 扑克牌服务模块 ✨
│   │   │   │   ├── index.ts     # Card服务导出
│   │   │   │   ├── cardGenerator.ts  # 扑克牌生成器
│   │   │   │   ├── cardShuffler.ts   # 洗牌算法服务
│   │   │   │   ├── cardValidator.ts  # 牌型验证器
│   │   │   │   └── cardService.ts    # 主要服务接口
│   │   │   ├── room/        # 房间管理服务模块 ✨
│   │   │   │   ├── index.ts     # Room服务导出
│   │   │   │   ├── roomManager.ts   # 房间生命周期管理
│   │   │   │   ├── roomValidator.ts # 房间规则验证
│   │   │   │   ├── defaultRooms.ts  # 默认房间配置
│   │   │   │   └── roomService.ts    # 主要服务接口
│   │   │   ├── player/       # 玩家管理服务模块 ✨
│   │   │   │   ├── index.ts     # Player服务导出
│   │   │   │   ├── playerManager.ts   # 玩家生命周期管理
│   │   │   │   ├── playerValidator.ts # 玩家操作验证
│   │   │   │   ├── playerSession.ts   # 玩家会话管理
│   │   │   │   └── playerService.ts    # 主要服务接口
│   │   │   └── game/        # 游戏引擎服务模块 ✨
│   │   │       ├── index.ts     # Game服务导出
│   │   │       ├── gameEngine.ts   # 游戏流程控制引擎
│   │   │       ├── gameRules.ts     # 游戏规则验证
│   │   │       ├── gameState.ts     # 游戏状态管理
│   │   │       └── gameService.ts    # 主要服务接口
│   │   ├── app.ts           # 主要应用逻辑
│   │   └── routes/          # API路由
│   ├── server.ts           # 服务器启动文件 ✨
│   ├── nodemon.json        # 热重载配置 ✨
│   └── package.json        # 项目配置
├── frontend/
│   └── public/             # 前端静态文件
├── start.bat               # Windows启动脚本
├── start.sh                # Linux/Mac启动脚本
└── VERSION.md              # 版本历史
```

## 🎯 v1.0.0 版本特性

- ✅ **前端界面布局完成** - 专业的斗地主游戏界面
- ✅ **模块化类型系统** - TypeScript接口按功能分组
- ✅ **实时聊天系统** - 支持长消息背景色完整覆盖
- ✅ **响应式设计** - 桌面、平板、移动端完美适配
- ✅ **Socket.IO集成** - 实时通信系统
- ✅ **代码结构优化** - 清晰的模块化组织
- ✅ **热重载开发环境** - 修改文件自动重启服务器 ✨
- ✅ **房间数据统一管理** - 修复API和Socket.IO数据一致性问题 ✨
- ✅ **默认房间预创建** - 服务器启动时自动创建6个房间 ✨
- ✅ **CardService模块拆分** - 扑克牌工具服务独立化 ✨
- ✅ **RoomService模块拆分** - 房间管理服务独立化 ✨
- ✅ **PlayerService模块拆分** - 玩家管理服务独立化 ✨
- ✅ **GameEngine模块拆分** - 游戏引擎服务独立化 ✨
- ✅ **GameFacade统一接口** - 高级游戏管理门面服务 ✨

## 🛠️ 开发环境配置

### **热重载设置**

项目配置了完整的热重载开发环境，支持以下特性：

#### **自动监听文件变化**
- **源代码**: `src/**/*` 目录下的所有文件
- **配置文件**: `server.ts`、`nodemon.json`、`.env`
- **文件类型**: `.ts`、`.js`、`.json` 文件

#### **智能忽略**
- **依赖包**: `node_modules/**/*`
- **编译输出**: `dist/**/*`
- **测试文件**: `test/**/*`、`*.test.ts`、`*.spec.ts`

#### **开发脚本**
```bash
# 热重载开发（推荐）
npm run dev:watch

# 普通开发
npm run dev

# 调试模式
npm run dev:debug

# 使用nodemon配置
npm run dev:nodemon
```

### **IDE集成**

#### **VS Code配置**
项目包含完整的VS Code配置：
- **调试配置**: `.vscode/launch.json` - 支持断点调试
- **任务配置**: `.vscode/tasks.json` - IDE内运行任务
- **热重载**: 自动监听文件变化并重启

#### **使用方法**
1. 打开项目文件夹
2. 按 `F5` 启动调试
3. 修改文件自动重启服务器

### **开发工作流程**
1. **启动开发服务器**: `npm run dev:watch`
2. **修改代码**: 编辑任何 `.ts` 文件
3. **自动重启**: nodemon检测变化并重启
4. **查看结果**: 浏览器刷新查看效果

## 🔧 技术栈

- **后端**: TypeScript + Express + Socket.IO
- **前端**: HTML5 + CSS3 + JavaScript + Socket.IO客户端
- **类型系统**: 模块化TypeScript接口定义
- **布局系统**: CSS Grid + Flexbox
- **构建工具**: TypeScript编译器
- **业务服务**: 完整的模块化服务架构（CardService + RoomService + PlayerService + GameEngine + GameFacade）✨
- **开发工具**: Nodemon热重载 + VS Code调试集成 ✨

## 🔧 配置说明

### 前端路径配置

项目支持灵活的前端路径配置，你可以通过以下方式自定义路径：

#### 环境变量配置（推荐）

在 `backend/.env` 文件中设置：
```bash
# 前端公共目录（相对于项目根目录）
FRONTEND_PUBLIC_PATH=frontend/public

# 大厅页面目录名
LOBBY_PATH=lobby

# 房间页面目录名
ROOM_PATH=room
```

#### 配置文件

前端路径配置位于 `backend/src/config/index.ts`：
- `config.paths.frontend.public` - 前端公共文件目录
- `config.paths.frontend.lobby` - 大厅页面目录
- `config.paths.frontend.room` - 房间页面目录

#### 路由配置

- **大厅页面**: `GET /` → 自动重定向到 `/lobby/`
- **房间页面**: `GET /room` → 访问房间界面
- **静态文件**: 所有前端静态文件通过 `/` 路径访问

#### 📝 注意事项

1. **启动文件**: 使用 `backend/server.ts` 而非 `test.ts`
2. **开发模式**: 推荐使用 `npm run dev` 进行开发
3. **端口**: 服务器运行在端口 3000
4. **文件服务**: 前端文件通过Express静态文件服务提供

---

**🎊 恭喜！斗地主游戏项目v1.0.0版本已经完成！**
