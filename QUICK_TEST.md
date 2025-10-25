# 🚀 快速测试指南

**服务器状态**: ✅ 已启动  
**服务器地址**: http://localhost:3000  
**测试时间**: 2025-10-25 22:54

---

## ✅ 服务器已启动

```
🚀 斗地主游戏服务器启动成功
📍 服务器地址: http://localhost:3000
🔧 环境: development
📚 API文档: http://localhost:3000/api
```

---

## 🧪 测试步骤

### **测试1: 访问登录页面**

1. **打开浏览器**
2. **访问**: http://localhost:3000/login/
3. **预期**: 看到登录页面

---

### **测试2: 用户登录**

1. **输入用户名**: `player1`
2. **选择头像**: 任意（如👑）
3. **点击**: "进入游戏大厅"
4. **观察控制台**:

**前端控制台应该显示**:
```javascript
🔄 开始登录流程: {playerName: "player1", playerAvatar: "👑"}
🔔 建立新的Socket连接，用户: player1
✅ Socket连接成功: {socketId: "xxx", userName: "player1"}
```

**后端控制台应该显示**:
```
用户连接: xxx
Processing auth from connection
新用户自动注册: player1, ID: player1
User authenticated from connection successfully
```

5. **预期结果**: 自动跳转到大厅页面
```
http://localhost:3000/lobby/index.html?playerName=player1&playerAvatar=👑&loginTime=xxx
```

---

### **测试3: 多用户登录**

1. **打开新的浏览器窗口**（或无痕模式）
2. **访问**: http://localhost:3000/login/
3. **输入用户名**: `player2`
4. **点击**: "进入游戏大厅"
5. **预期**: 两个用户都成功登录，互不干扰

---

## ⚠️ 关于Chrome DevTools警告

您看到的这些错误可以**安全忽略**：

```
Failed to load resource: the server responded with a status of 404 (Not Found)
Refused to connect to 'http://localhost:3000/.well-known/...'
```

**原因**: 这是Chrome DevTools的内部请求，不影响我们的应用。

**解决方法**:
1. 忽略这些错误（推荐）
2. 在控制台过滤器中添加: `-/.well-known/`

---

## 🔍 调试检查点

### **如果登录失败**

1. **检查后端日志**:
   - 是否显示"用户连接"？
   - 是否显示"新用户自动注册"？

2. **检查前端控制台**:
   - 是否显示Socket连接成功？
   - 是否有错误信息？

3. **检查网络请求**:
   - 打开Chrome DevTools → Network
   - 查看WebSocket连接是否建立

---

## 📊 测试清单

- [ ] 服务器启动成功
- [ ] 登录页面正常显示
- [ ] 用户登录成功
- [ ] Socket连接建立
- [ ] 用户自动创建
- [ ] 页面跳转到大厅
- [ ] URL参数正确传递
- [ ] 多用户可以同时登录

---

## 🎯 测试成功后

如果测试通过，我们将继续：

1. **Phase 3**: 统一房间服务
2. **Phase 4**: 实现游戏核心功能
   - 发牌
   - 抢地主
   - 出牌
   - 游戏结算

---

## 💡 提示

- 使用Chrome DevTools查看详细日志
- 前端日志在浏览器控制台
- 后端日志在终端窗口
- 遇到问题请截图日志

---

**现在请开始测试！** 🚀

访问: http://localhost:3000/login/
