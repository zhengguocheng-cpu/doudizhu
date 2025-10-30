# 用户反馈功能

## 📝 功能说明

用户可以通过反馈页面提交：
- 文字反馈（最多1000字）
- 截图上传（最多3张，每张最大5MB）
- 反馈类型（Bug反馈、功能建议、界面优化、其他）
- 联系方式（可选）

## 🚀 安装依赖

在使用反馈功能前，需要安装 `multer` 依赖：

```bash
cd backend
npm install multer
npm install --save-dev @types/multer
```

## 📁 文件结构

### 前端文件
```
frontend/public/feedback/
├── index.html          # 反馈页面
├── css/
│   └── feedback.css    # 样式文件
└── js/
    └── feedback.js     # 逻辑文件
```

### 后端文件
```
backend/
├── src/routes/
│   └── feedbackRoutes.ts    # 反馈API路由
├── data/feedback/           # 反馈数据存储（自动创建）
│   ├── FB_xxx.json         # 单个反馈文件
│   └── all_feedback.jsonl  # 所有反馈汇总
└── uploads/feedback/        # 截图存储（自动创建）
    └── timestamp_filename.jpg
```

## 🔗 访问地址

- 反馈页面：`http://localhost:3000/feedback/`
- 提交API：`POST http://localhost:3000/api/feedback`
- 查看反馈：`GET http://localhost:3000/api/feedback/list`

## 📊 反馈数据格式

```json
{
  "id": "FB_1730000000000_abc123",
  "userName": "玩家A",
  "feedbackType": "bug",
  "feedbackContent": "游戏中发现的问题描述...",
  "contact": "QQ: 123456",
  "screenshots": [
    {
      "filename": "1730000000000_screenshot.png",
      "originalname": "screenshot.png",
      "size": 123456,
      "path": "/path/to/file"
    }
  ],
  "timestamp": "2025-10-30T14:00:00.000Z",
  "userAgent": "Mozilla/5.0...",
  "url": "http://localhost:3000/room/",
  "createdAt": "2025-10-30T14:00:00.000Z"
}
```

## 🎨 功能特性

### 前端特性
- ✅ 响应式设计，支持移动端
- ✅ 拖拽上传截图
- ✅ 实时字符计数
- ✅ 图片预览和删除
- ✅ 表单验证
- ✅ 提交状态反馈
- ✅ 自动加载用户信息

### 后端特性
- ✅ 文件上传限制（类型、大小、数量）
- ✅ 数据持久化（JSON文件）
- ✅ 自动创建目录
- ✅ 错误处理
- ✅ 日志记录

## 🔧 使用方法

### 1. 在游戏中添加反馈入口

在任何页面添加反馈按钮：

```html
<a href="/feedback/" class="feedback-link">📝 反馈</a>
```

### 2. 查看反馈（管理员）

访问 `http://localhost:3000/api/feedback/list` 查看所有反馈。

或者直接查看文件：
- 单个反馈：`backend/data/feedback/FB_xxx.json`
- 所有反馈：`backend/data/feedback/all_feedback.jsonl`

### 3. 查看截图

截图保存在：`backend/uploads/feedback/`

## 📱 移动端支持

反馈页面完全支持移动端：
- 自适应布局
- 触摸友好的UI
- 支持手机拍照上传

## 🔐 安全考虑

当前实现：
- ✅ 文件类型验证（只允许图片）
- ✅ 文件大小限制（5MB）
- ✅ 文件数量限制（3张）
- ✅ 内容长度限制（1000字）

建议增强：
- 添加用户认证
- 添加频率限制
- 添加内容审核
- 使用数据库存储

## 🚀 部署建议

生产环境建议：
1. 使用数据库存储反馈（MongoDB/PostgreSQL）
2. 使用云存储服务（OSS/S3）存储图片
3. 添加管理后台查看反馈
4. 添加邮件通知
5. 添加反馈状态管理（待处理/处理中/已完成）

## 📝 TODO

- [ ] 添加反馈管理后台
- [ ] 添加邮件通知
- [ ] 添加反馈状态跟踪
- [ ] 添加反馈回复功能
- [ ] 数据库集成
- [ ] 云存储集成
