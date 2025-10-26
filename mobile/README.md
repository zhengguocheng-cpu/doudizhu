# 🎮 斗地主游戏移动端

基于Taro框架开发的跨平台斗地主游戏，支持微信小程序、抖音小程序、支付宝小程序等多个平台。

## 📱 支持平台

- ✅ 微信小程序
- ✅ 抖音小程序  
- ✅ 支付宝小程序
- ✅ 百度小程序
- ✅ H5网页版

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- 微信开发者工具（微信小程序）
- 抖音开发者工具（抖音小程序）

### 安装依赖

```bash
cd mobile
npm install
```

### 开发调试

```bash
# 微信小程序
npm run dev:wechat

# 抖音小程序
npm run dev:tt

# 支付宝小程序
npm run dev:alipay

# H5网页版
npm run dev:h5
```

### 构建发布

```bash
# 构建微信小程序
npm run build:wechat

# 构建抖音小程序
npm run build:tt

# 构建支付宝小程序
npm run build:alipay

# 构建所有平台
npm run build:all
```

## 📁 项目结构

```
mobile/
├── config/                 # 配置文件
│   ├── index.js           # 主配置
│   ├── dev.js             # 开发环境配置
│   └── prod.js            # 生产环境配置
├── src/
│   ├── app.tsx            # 应用入口
│   ├── app.config.ts      # 应用配置
│   ├── app.scss           # 全局样式
│   ├── pages/             # 页面
│   │   ├── login/         # 登录页
│   │   ├── lobby/         # 大厅页
│   │   └── room/          # 游戏房间
│   ├── components/        # 组件
│   │   ├── RoomCard/      # 房间卡片
│   │   ├── GameTable/     # 游戏桌面
│   │   ├── PlayerHand/    # 玩家手牌
│   │   └── ChatPanel/     # 聊天面板
│   ├── store/             # 状态管理
│   │   ├── user.ts        # 用户状态
│   │   └── game.ts        # 游戏状态
│   ├── utils/             # 工具函数
│   │   ├── socket.ts      # WebSocket管理
│   │   └── api.ts         # API请求
│   └── assets/            # 静态资源
│       ├── images/        # 图片资源
│       └── styles/        # 样式文件
├── package.json           # 项目配置
└── README.md              # 项目说明
```

## 🎯 核心功能

### 用户系统
- ✅ 用户登录/注册
- ✅ 头像选择
- ✅ 用户信息管理
- ✅ 在线状态显示

### 房间系统
- ✅ 房间列表展示
- ✅ 创建/加入房间
- ✅ 快速开始游戏
- ✅ 房间状态管理

### 游戏功能
- ✅ 完整的斗地主游戏逻辑
- ✅ 实时游戏状态同步
- ✅ 手牌管理
- ✅ 出牌/不出操作
- ✅ 抢地主功能

### 社交功能
- ✅ 实时聊天
- ✅ 系统消息
- ✅ 游戏邀请
- ✅ 好友系统

## 🛠 技术栈

### 前端框架
- **Taro 3.6+**: 跨平台开发框架
- **React 18**: UI框架
- **TypeScript**: 类型安全
- **MobX**: 状态管理

### 样式方案
- **SCSS**: CSS预处理器
- **响应式设计**: 多设备适配
- **主题系统**: 支持深色/浅色模式

### 网络通信
- **WebSocket**: 实时通信
- **HTTP API**: RESTful接口
- **自动重连**: 网络异常处理

## 📱 界面设计

### 设计原则
- **简洁直观**: 操作简单，界面清晰
- **响应式**: 适配不同屏幕尺寸
- **一致性**: 统一的设计语言
- **可访问性**: 支持无障碍访问

### 界面特色
- **游戏桌面**: 3D视觉效果，沉浸式体验
- **扑克牌**: 精美的牌面设计
- **动画效果**: 流畅的过渡动画
- **手势操作**: 支持触摸手势

## 🔧 开发指南

### 添加新页面

1. 在 `src/pages/` 下创建页面目录
2. 创建 `index.tsx` 和 `index.scss`
3. 在 `app.config.ts` 中注册页面路由

### 添加新组件

1. 在 `src/components/` 下创建组件目录
2. 创建组件文件和样式文件
3. 导出组件供其他页面使用

### 状态管理

使用MobX进行状态管理：

```typescript
// 在组件中使用
import { observer, inject } from 'mobx-react'
import { userStore } from '../../store/user'

@inject('userStore')
@observer
class MyComponent extends Component {
  // 组件逻辑
}
```

### API调用

```typescript
import { apiManager } from '../../utils/api'

// GET请求
const response = await apiManager.get('/api/rooms')

// POST请求
const response = await apiManager.post('/api/rooms', { name: '房间名' })
```

### WebSocket通信

```typescript
import { socketManager } from '../../utils/socket'

// 发送消息
socketManager.send('join_room', { roomId: 'room-1' })

// 监听事件
socketManager.on('room_joined', (data) => {
  console.log('加入房间成功:', data)
})
```

## 🚀 部署发布

### 微信小程序

1. 构建项目: `npm run build:wechat`
2. 使用微信开发者工具打开 `dist` 目录
3. 上传代码到微信后台
4. 提交审核发布

### 抖音小程序

1. 构建项目: `npm run build:tt`
2. 使用抖音开发者工具打开 `dist` 目录
3. 上传代码到抖音后台
4. 提交审核发布

### 支付宝小程序

1. 构建项目: `npm run build:alipay`
2. 使用支付宝开发者工具打开 `dist` 目录
3. 上传代码到支付宝后台
4. 提交审核发布

## 📊 性能优化

### 图片优化
- 使用WebP格式减小文件大小
- 图片懒加载
- 图片压缩

### 代码优化
- 代码分割
- 按需加载
- 缓存策略

### 网络优化
- 请求合并
- 数据缓存
- 离线支持

## 🐛 调试指南

### 开发工具
- 微信开发者工具
- 抖音开发者工具
- Chrome DevTools (H5)

### 调试技巧
- 使用 `console.log` 输出调试信息
- 利用断点调试
- 网络请求监控
- 性能分析

### 常见问题
1. **构建失败**: 检查Node.js版本和依赖安装
2. **样式问题**: 检查SCSS语法和导入路径
3. **API错误**: 检查网络连接和接口地址
4. **WebSocket连接失败**: 检查服务器地址和端口

## 📝 更新日志

### v1.0.0 (2024-01-01)
- ✅ 初始版本发布
- ✅ 支持微信小程序
- ✅ 支持抖音小程序
- ✅ 支持支付宝小程序
- ✅ 完整的游戏功能
- ✅ 实时聊天功能

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 创建 Pull Request

## 📄 许可证

MIT License

## 📞 联系方式

- 项目地址: [GitHub Repository]
- 问题反馈: [Issues]
- 技术交流: [Discussions]

---

**注意**: 本项目需要配合后端服务使用，请确保后端服务正常运行。
