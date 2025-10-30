# 个人中心访问问题修复

## 🐛 问题描述

**症状**: 从大厅页面点击"个人中心"按钮时，提示"请先登录"

**原因**: 
- 个人中心页面需要从 `localStorage` 读取 `userId`
- 但登录时没有将 `userId` 保存到 `localStorage`
- 导致个人中心页面无法获取用户信息

---

## ✅ 解决方案

### 1. 登录时保存用户信息

**文件**: `frontend/public/js/global-socket.js`

**修改**: 在 `connect()` 方法中添加localStorage保存

```javascript
connect(userName, userId) {
    // ... 现有代码 ...
    
    // 保存用户信息
    this.userName = userName;
    this.userId = userId || userName;

    // 🆕 保存到localStorage，供个人中心等页面使用
    localStorage.setItem('userId', this.userId);
    localStorage.setItem('userName', this.userName);

    console.log('💾 保存用户信息到localStorage:', { 
        userId: this.userId, 
        userName: this.userName 
    });

    // ... 连接Socket ...
}
```

### 2. 登出时清除用户信息

**文件**: `frontend/public/lobby/js/lobby.js`

**修改**: 在 `handleLogout()` 方法中清除localStorage

```javascript
handleLogout() {
    // 🆕 清除localStorage中的用户信息
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('lastGameSettlement');

    this.messageManager.addInfo('已登出');

    // 跳转到登录页面
    setTimeout(() => {
        this.redirectToLogin();
    }, 1000);
}
```

---

## 🔄 数据流程

### 登录流程
```
1. 用户输入名称
   ↓
2. GlobalSocketManager.connect(userName, userId)
   ↓
3. 保存到localStorage
   - localStorage.setItem('userId', userId)
   - localStorage.setItem('userName', userName)
   ↓
4. 建立Socket连接
   ↓
5. 进入大厅
```

### 访问个人中心流程
```
1. 点击"个人中心"按钮
   ↓
2. 跳转到 /profile
   ↓
3. ProfilePage.getUserId()
   - 从localStorage读取userId
   ↓
4. 如果有userId
   - 加载个人数据
   - 显示个人中心
   ↓
5. 如果没有userId
   - 提示"请先登录"
   - 跳转到首页
```

### 登出流程
```
1. 点击"登出"按钮
   ↓
2. 清除localStorage
   - removeItem('userId')
   - removeItem('userName')
   - removeItem('lastGameSettlement')
   ↓
3. 显示"已登出"消息
   ↓
4. 跳转到登录页面
```

---

## 🧪 测试步骤

### 测试1: 正常访问个人中心

1. **启动服务器**
   ```bash
   cd backend
   npm run dev
   ```

2. **访问游戏**
   ```
   http://localhost:3000
   ```

3. **输入玩家名称并登录**
   - 输入任意名称
   - 点击"开始游戏"

4. **进入大厅后点击"个人中心"**
   - 应该能正常进入个人中心
   - 不再提示"请先登录"

5. **验证localStorage**
   - 打开浏览器控制台
   - 输入: `localStorage.getItem('userId')`
   - 应该显示你的用户ID

### 测试2: 登出后访问

1. **在大厅页面点击"登出"**
   - 应该显示"已登出"
   - 自动跳转到首页

2. **验证localStorage已清除**
   - 打开浏览器控制台
   - 输入: `localStorage.getItem('userId')`
   - 应该返回 `null`

3. **尝试直接访问个人中心**
   ```
   http://localhost:3000/profile
   ```
   - 应该提示"请先登录"
   - 自动跳转到首页

### 测试3: 刷新页面后访问

1. **登录并进入大厅**

2. **刷新页面 (F5)**
   - 页面重新加载

3. **点击"个人中心"**
   - 应该能正常访问
   - localStorage中的数据保持不变

---

## 📊 localStorage 数据结构

### 保存的数据

```javascript
{
  "userId": "player_123",           // 用户ID
  "userName": "玩家A",              // 用户名称
  "lastGameSettlement": "{...}"     // 最后一局的结算数据（可选）
}
```

### 查看方法

**方法1: 控制台**
```javascript
// 查看所有localStorage数据
console.log(localStorage);

// 查看特定数据
console.log(localStorage.getItem('userId'));
console.log(localStorage.getItem('userName'));
```

**方法2: 开发者工具**
1. 按 F12 打开开发者工具
2. 切换到 "Application" 或 "存储" 标签
3. 左侧选择 "Local Storage"
4. 选择 `http://localhost:3000`
5. 查看所有键值对

---

## 🔍 调试技巧

### 1. 检查是否保存成功

在登录后，打开控制台查看日志：
```
💾 保存用户信息到localStorage: { userId: 'player_123', userName: '玩家A' }
```

### 2. 手动设置测试数据

```javascript
// 在控制台执行
localStorage.setItem('userId', 'test_user');
localStorage.setItem('userName', '测试玩家');

// 然后访问个人中心
window.location.href = '/profile';
```

### 3. 清除所有数据

```javascript
// 清除所有localStorage
localStorage.clear();

// 或只清除特定项
localStorage.removeItem('userId');
localStorage.removeItem('userName');
```

---

## ⚠️ 注意事项

### 1. 安全性
- localStorage中的数据是明文存储
- 不要存储敏感信息（如密码）
- 当前只存储userId和userName，是安全的

### 2. 数据持久性
- localStorage数据会一直保存
- 除非用户清除浏览器数据
- 或代码主动删除

### 3. 跨域问题
- localStorage是按域名隔离的
- `localhost:3000` 和 `127.0.0.1:3000` 是不同的域
- 建议统一使用 `localhost`

### 4. 浏览器兼容性
- 所有现代浏览器都支持localStorage
- IE8+ 支持
- 隐私模式可能禁用localStorage

---

## 🚀 相关功能

### 使用userId的页面

1. **个人中心** (`/profile`)
   - 读取userId加载个人数据
   - 显示积分、战绩、成就

2. **结算页面** (`/settlement`)
   - 读取userId判断是否是获胜者
   - 显示个人得分

3. **游戏房间** (`/room`)
   - 使用userId作为玩家标识
   - 发送游戏事件

### localStorage的其他用途

1. **lastGameSettlement**
   - 保存最后一局的结算数据
   - 用于结算页面显示

2. **未来扩展**
   - 用户设置（音效、音乐开关等）
   - 游戏历史记录缓存
   - 主题偏好设置

---

## 📝 更新日志

### v1.0.1 (2025-10-30)
- ✅ 修复个人中心访问问题
- ✅ 登录时保存userId到localStorage
- ✅ 登出时清除localStorage数据
- ✅ 添加调试日志

---

## 🔗 相关文档

- [个人中心页面](frontend/public/profile/index.html)
- [全局Socket管理器](frontend/public/js/global-socket.js)
- [大厅页面逻辑](frontend/public/lobby/js/lobby.js)
- [积分系统测试指南](SCORE_SYSTEM_TEST_GUIDE.md)

---

**修复完成！现在可以正常访问个人中心了。** ✅

**测试方法**: 
1. 登录游戏
2. 点击大厅页面的"👤 个人中心"按钮
3. 应该能正常进入个人中心页面

**创建时间**: 2025-10-30 07:30  
**版本**: v1.0.1
