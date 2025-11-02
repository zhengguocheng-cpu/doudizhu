# CORS 错误修复

## 🔴 问题

```
Access to XMLHttpRequest at 'http://localhost:3000/socket.io/...' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**原因**：后端 CORS 配置只允许 `localhost:8080` 和 `localhost:3000`，但前端运行在 `localhost:5173`

---

## 🔧 修复方法

### 方法 1: 修改后端 .env 文件（推荐）

1. **打开文件**：`backend/.env`（如果不存在，创建它）

2. **添加配置**：
```env
CORS_ORIGIN=http://localhost:8080,http://localhost:3000,http://localhost:5173,http://localhost:5174
```

3. **重启后端服务器**
   - 在后端终端按 `Ctrl + C`
   - 运行 `npm run dev:watch`

---

### 方法 2: 临时修改配置文件

**文件**：`backend/src/config/index.ts`

**找到第 8-11 行**：
```typescript
cors: {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:8080', 'http://localhost:3000'],
  credentials: process.env.CORS_CREDENTIALS === 'true'
},
```

**改为**：
```typescript
cors: {
  origin: process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:8080', 
    'http://localhost:3000',
    'http://localhost:5173',  // ← 添加这行
    'http://localhost:5174'   // ← 添加这行
  ],
  credentials: process.env.CORS_CREDENTIALS === 'true'
},
```

**保存后自动重启**（nodemon 会自动检测）

---

## ✅ 验证修复

1. **刷新前端页面**
2. **重新登录**
3. **查看控制台**
   - 应该没有 CORS 错误
   - Socket 连接成功

---

## 🚀 快速执行

**在后端项目根目录运行**：

```bash
# 创建 .env 文件（如果不存在）
echo CORS_ORIGIN=http://localhost:8080,http://localhost:3000,http://localhost:5173,http://localhost:5174 > .env

# 重启后端
# 按 Ctrl + C 停止当前服务器
# 然后运行：
npm run dev:watch
```

---

完成后，前端应该可以正常连接了！
