# 🔧 依赖注入容器核心原理演示

这个演示完整展示了依赖注入（Dependency Injection）的核心概念和工作流程。

## 📋 演示内容概览

```
🚀 依赖注入容器核心原理演示

🎬 开始依赖注入演示...

📦 容器实例获取成功

📋 注册服务...
📦 注册单例服务: Logger
📦 注册单例服务: UserService
📦 注册单例服务: AuthService

🔍 解析服务并测试依赖注入...
🔍 解析服务: Logger
🏭 创建单例实例: Logger
💾 缓存单例实例: Logger

🔄 演示单例模式...
UserService 单例测试: true
AuthService 单例测试: true

🎮 演示业务逻辑...
[INFO] [UserService] Creating user Alice with id user_xxx
[INFO] [AuthService] User Alice attempting login
[INFO] [AuthService] User Alice logged in successfully

🔗 演示依赖注入的解耦效果...
✅ 优势总结:
   1. 服务之间无直接依赖，通过容器管理
   2. 单例模式确保状态一致性
   3. 依赖自动注入，减少样板代码
   4. 易于测试，可以替换实现
   5. 延迟加载，提高启动性能
```

## 🏗️ 核心组件架构

### 1. **Token 系统** (服务标识)
```javascript
// 支持多种标识方式
'Logger'                    // 字符串标识
Symbol.for('Logger')        // Symbol标识
Logger                      // 构造函数标识
```

### 2. **SimpleDependencyContainer** (IoC容器)
```javascript
class SimpleDependencyContainer {
  // 存储结构
  services: Map<Token, any>           // 已创建的实例缓存
  singletonFactories: Map<Token, Function>  // 单例工厂函数
  transientFactories: Map<Token, Function>  // 瞬时工厂函数

  // 核心方法
  registerSingleton(token, factory)     // 注册单例
  registerTransient(token, factory)     // 注册瞬时服务
  resolve(token)                        // 解析服务
}
```

### 3. **服务接口与实现**
```javascript
// 接口定义
class ILogger {
  log(entry) { /* 抽象方法 */ }
}

// 具体实现
class ConsoleLogger extends ILogger {
  log(entry) {
    console.log(`[${entry.level}] ${entry.message}`);
  }
}
```

## 🔄 依赖注入完整流程

### **Phase 1: 注册阶段**
```javascript
const container = SimpleDependencyContainer.getInstance();

// 1. 注册基础服务
container.registerSingleton('Logger', () => new ConsoleLogger());

// 2. 注册依赖服务（自动注入依赖）
container.registerSingleton('UserService', () => {
  const logger = container.resolve('Logger');  // 自动解析依赖
  return new UserService(logger);
});

// 3. 注册高层服务
container.registerSingleton('AuthService', () => {
  const userService = container.resolve('UserService');
  const logger = container.resolve('Logger');
  return new AuthService(userService, logger);
});
```

### **Phase 2: 解析阶段 (Lazy Loading)**
```javascript
// 第一次解析 - 创建实例并缓存
const logger = container.resolve('Logger');
// 输出: 🔍 解析服务: Logger
//       🏭 创建单例实例: Logger
//       💾 缓存单例实例: Logger

// 第二次解析 - 返回缓存实例
const logger2 = container.resolve('Logger');
// 输出: 🔍 解析服务: Logger
//       ✅ 返回缓存的实例: Logger
```

### **Phase 3: 依赖注入阶段**
```javascript
// AuthService 依赖 UserService 和 Logger
container.registerSingleton('AuthService', () => {
  const userService = container.resolve('UserService'); // 自动注入
  const logger = container.resolve('Logger');           // 自动注入
  return new AuthService(userService, logger);
});
```

## 🎯 关键特性演示

### **1. 单例模式验证**
```javascript
const userService1 = container.resolve('UserService');
const userService2 = container.resolve('UserService');
console.log(userService1 === userService2); // true
```

### **2. 依赖自动注入**
```javascript
// UserService 需要 Logger
container.registerSingleton('UserService', () => {
  const logger = container.resolve('Logger');  // 自动获取
  return new UserService(logger);
});

// AuthService 需要 UserService 和 Logger
container.registerSingleton('AuthService', () => {
  const userService = container.resolve('UserService'); // 自动获取
  const logger = container.resolve('Logger');           // 自动获取
  return new AuthService(userService, logger);
});
```

### **3. 延迟加载 (Lazy Loading)**
```javascript
// 服务只有在第一次resolve时才创建
// 提高了启动性能，避免不必要的对象创建
```

## 💡 核心设计模式

### **1. 单例模式** (Singleton)
- `DependencyContainer` 本身是单例
- 单例服务只创建一次实例

### **2. 工厂模式** (Factory)
- 存储创建函数，延迟实例化
- 支持依赖注入的工厂函数

### **3. 模板方法模式** (Template Method)
- 统一的注册和解析接口
- 隐藏复杂的实现细节

### **4. 依赖倒置** (Dependency Inversion)
- 服务不直接依赖具体实现
- 都依赖抽象的Token和容器

## 🚀 运行演示

```bash
# 运行演示
node di-demo.js

# 或者通过npm script
npm run demo:di
```

## 📚 学习要点

1. **IoC容器的工作原理**: 控制反转，容器管理对象生命周期
2. **依赖注入的方式**: 构造函数注入、属性注入、方法注入
3. **服务注册策略**: 单例 vs 瞬时，工厂函数 vs 直接实例
4. **解析机制**: 缓存策略、循环依赖检测、异常处理
5. **解耦效果**: 服务之间无直接依赖，提高可测试性和可维护性

这个演示完整展示了从简单到复杂的服务依赖关系建立过程，是学习依赖注入的绝佳示例！
