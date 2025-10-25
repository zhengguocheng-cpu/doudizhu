# 🔄 服务器重启指南

## ✅ 问题已修复

已添加登录页面路由到 `backend/src/routes/index.ts`

```typescript
// 登录页面路由
router.get('/login/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../frontend/public/login/index.html'));
});
```

---

## 🔄 重启服务器步骤

### **方法1: 手动重启（推荐）**

1. **停止当前服务器**
   - 在运行服务器的终端窗口按 `Ctrl + C`

2. **重新启动**
```bash
cd backend
npm run dev
```

3. **验证启动成功**
   - 看到 "🚀 斗地主游戏服务器启动成功"

---

### **方法2: 使用nodemon自动重启**

如果使用 `npm run dev:watch`，代码修改后会自动重启。

---

## 🧪 测试登录页面

服务器重启后，访问：

```
http://localhost:3000/login/
```

**预期结果**: 
- ✅ 看到登录页面
- ✅ 有用户名输入框
- ✅ 有头像选择下拉框
- ✅ 有"进入游戏大厅"按钮

---

## 📝 其他可用路由

```
http://localhost:3000/          → 重定向到大厅
http://localhost:3000/login/    → 登录页面 ✨ 新增
http://localhost:3000/lobby/    → 大厅页面
http://localhost:3000/room/     → 房间页面
http://localhost:3000/api       → API文档
http://localhost:3000/health    → 健康检查
```

---

## 🎯 下一步

服务器重启后：

1. ✅ 访问登录页面
2. ✅ 输入用户名测试
3. ✅ 验证Socket连接
4. ✅ 测试页面跳转

---

**请重启服务器，然后访问登录页面！** 🚀
