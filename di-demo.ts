/**
 * 依赖注入容器核心原理演示
 * 简化版本，展示完整的工作流程
 */

console.log('🚀 依赖注入容器核心原理演示\n');

// ================================
// 1. 核心类型定义
// ================================

// 依赖注入令牌 - 支持字符串、Symbol、构造函数
type Token<T = any> = string | symbol | (new (...args: any[]) => T);

// 日志级别枚举
enum LogLevel {
  INFO = 'info',
  ERROR = 'error',
  DEBUG = 'debug'
}

// 结构化日志接口
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
}

// ================================
// 2. 核心服务接口
// ================================

// 日志器接口
interface ILogger {
  log(entry: LogEntry): void;
}

// 用户服务接口
interface IUserService {
  getUser(id: string): { id: string; name: string } | null;
  createUser(name: string): { id: string; name: string };
}

// 认证服务接口
interface IAuthService {
  login(username: string, password: string): boolean;
  getCurrentUser(): { id: string; name: string } | null;
}

// ================================
// 3. 具体服务实现
// ================================

// 简单日志器实现
class ConsoleLogger implements ILogger {
  log(entry: LogEntry): void {
    const prefix = `[${entry.level.toUpperCase()}] [${entry.context || 'APP'}]`;
    console.log(`${prefix} ${entry.message}`, entry.timestamp.toISOString());
  }
}

// 用户服务实现
class UserService implements IUserService {
  private users: Map<string, { id: string; name: string }> = new Map();

  constructor(private logger: ILogger) {}

  getUser(id: string): { id: string; name: string } | null {
    this.logger.log({
      level: LogLevel.DEBUG,
      message: `Getting user ${id}`,
      context: 'UserService',
      timestamp: new Date()
    });

    return this.users.get(id) || null;
  }

  createUser(name: string): { id: string; name: string } {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.logger.log({
      level: LogLevel.INFO,
      message: `Creating user ${name} with id ${id}`,
      context: 'UserService',
      timestamp: new Date()
    });

    const user = { id, name };
    this.users.set(id, user);
    return user;
  }
}

// 认证服务实现 - 依赖 UserService
class AuthService implements IAuthService {
  private currentUser: { id: string; name: string } | null = null;

  constructor(
    private userService: IUserService,
    private logger: ILogger
  ) {}

  login(username: string, password: string): boolean {
    this.logger.log({
      level: LogLevel.INFO,
      message: `User ${username} attempting login`,
      context: 'AuthService',
      timestamp: new Date()
    });

    // 模拟用户认证逻辑
    if (password === 'password123') {
      const user = this.userService.createUser(username);
      this.currentUser = user;

      this.logger.log({
        level: LogLevel.INFO,
        message: `User ${username} logged in successfully`,
        context: 'AuthService',
        timestamp: new Date()
      });

      return true;
    }

    this.logger.log({
      level: LogLevel.ERROR,
      message: `Login failed for user ${username}`,
      context: 'AuthService',
      timestamp: new Date()
    });

    return false;
  }

  getCurrentUser(): { id: string; name: string } | null {
    return this.currentUser;
  }
}

// ================================
// 4. 依赖注入容器实现
// ================================

class SimpleDependencyContainer {
  private static instance: SimpleDependencyContainer;

  // 存储已创建的实例
  private services: Map<Token, any> = new Map();

  // 存储单例工厂函数
  private singletonFactories: Map<Token, Function> = new Map();

  // 存储瞬时工厂函数（每次创建新实例）
  private transientFactories: Map<Token, Function> = new Map();

  private constructor() {}

  // 获取容器单例
  public static getInstance(): SimpleDependencyContainer {
    if (!SimpleDependencyContainer.instance) {
      SimpleDependencyContainer.instance = new SimpleDependencyContainer();
    }
    return SimpleDependencyContainer.instance;
  }

  // 注册单例服务
  public registerSingleton<T>(token: Token<T>, factory: () => T): void {
    console.log(`📦 注册单例服务: ${String(token)}`);
    this.singletonFactories.set(token, factory);
  }

  // 注册瞬时服务（每次创建新实例）
  public registerTransient<T>(token: Token<T>, factory: () => T): void {
    console.log(`📦 注册瞬时服务: ${String(token)}`);
    this.transientFactories.set(token, factory);
  }

  // 解析服务
  public resolve<T>(token: Token<T>): T {
    console.log(`🔍 解析服务: ${String(token)}`);

    // 1. 检查是否已创建实例（单例缓存）
    if (this.services.has(token)) {
      console.log(`✅ 返回缓存的实例: ${String(token)}`);
      return this.services.get(token);
    }

    // 2. 检查单例工厂
    if (this.singletonFactories.has(token)) {
      console.log(`🏭 创建单例实例: ${String(token)}`);
      const factory = this.singletonFactories.get(token)!;
      const instance = factory();

      // 缓存实例，确保单例
      this.services.set(token, instance);
      console.log(`💾 缓存单例实例: ${String(token)}`);
      return instance;
    }

    // 3. 检查瞬时工厂
    if (this.transientFactories.has(token)) {
      console.log(`⚡ 创建瞬时实例: ${String(token)}`);
      const factory = this.transientFactories.get(token)!;
      return factory();
    }

    // 4. 未找到服务
    throw new Error(`服务未注册: ${String(token)}`);
  }

  // 获取所有已注册的服务
  public getRegisteredServices(): string[] {
    const tokens = [
      ...Array.from(this.services.keys()),
      ...Array.from(this.singletonFactories.keys()),
      ...Array.from(this.transientFactories.keys())
    ];
    return tokens.map(token => String(token));
  }

  // 清空容器
  public clear(): void {
    this.services.clear();
    this.singletonFactories.clear();
    this.transientFactories.clear();
  }
}

// ================================
// 5. 演示完整流程
// ================================

async function demonstrateDependencyInjection(): Promise<void> {
  console.log('🎬 开始依赖注入演示...\n');

  // 1. 获取容器实例
  const container = SimpleDependencyContainer.getInstance();
  console.log('📦 容器实例获取成功\n');

  // 2. 注册服务
  console.log('📋 注册服务...\n');

  // 注册日志器（单例）
  container.registerSingleton('Logger', () => new ConsoleLogger());

  // 注册用户服务（单例）- 依赖日志器
  container.registerSingleton('UserService', () => {
    const logger = container.resolve<ILogger>('Logger');
    return new UserService(logger);
  });

  // 注册认证服务（单例）- 依赖用户服务和日志器
  container.registerSingleton('AuthService', () => {
    const userService = container.resolve<IUserService>('UserService');
    const logger = container.resolve<ILogger>('Logger');
    return new AuthService(userService, logger);
  });

  // 3. 验证注册结果
  console.log('📋 已注册的服务:', container.getRegisteredServices());
  console.log('');

  // 4. 演示服务解析和依赖注入
  console.log('🔍 解析服务并测试依赖注入...\n');

  // 解析日志器
  const logger = container.resolve<ILogger>('Logger');
  console.log('');

  // 解析用户服务（会自动注入Logger依赖）
  const userService = container.resolve<IUserService>('UserService');
  console.log('');

  // 解析认证服务（会自动注入UserService和Logger依赖）
  const authService = container.resolve<IAuthService>('AuthService');
  console.log('');

  // 5. 演示单例模式
  console.log('🔄 演示单例模式...\n');

  const userService1 = container.resolve<IUserService>('UserService');
  const userService2 = container.resolve<IUserService>('UserService');
  const authService1 = container.resolve<IAuthService>('AuthService');
  const authService2 = container.resolve<IAuthService>('AuthService');

  console.log(`UserService 单例测试: ${userService1 === userService2}`); // true
  console.log(`AuthService 单例测试: ${authService1 === authService2}`); // true
  console.log('');

  // 6. 演示业务逻辑
  console.log('🎮 演示业务逻辑...\n');

  // 用户注册
  const user1 = userService.createUser('Alice');
  const user2 = userService.createUser('Bob');

  console.log(`创建用户1: ${JSON.stringify(user1)}`);
  console.log(`创建用户2: ${JSON.stringify(user2)}`);
  console.log('');

  // 用户查询
  const foundUser1 = userService.getUser(user1.id);
  const foundUser2 = userService.getUser(user2.id);

  console.log(`查询用户1: ${foundUser1 ? JSON.stringify(foundUser1) : 'null'}`);
  console.log(`查询用户2: ${foundUser2 ? JSON.stringify(foundUser2) : 'null'}`);
  console.log('');

  // 用户认证
  console.log('🔐 测试用户认证...\n');

  const loginResult1 = authService.login('Alice', 'password123');
  const loginResult2 = authService.login('Bob', 'wrongpassword');
  const loginResult3 = authService.login('Charlie', 'password123');

  console.log(`Alice登录结果: ${loginResult1}`);
  console.log(`Bob登录结果: ${loginResult2}`);
  console.log(`Charlie登录结果: ${loginResult3}`);
  console.log('');

  const currentUser = authService.getCurrentUser();
  console.log(`当前登录用户: ${currentUser ? JSON.stringify(currentUser) : 'null'}`);
  console.log('');

  // 7. 演示依赖注入的解耦效果
  console.log('🔗 演示依赖注入的解耦效果...\n');

  console.log('✅ 优势总结:');
  console.log('   1. 服务之间无直接依赖，通过容器管理');
  console.log('   2. 单例模式确保状态一致性');
  console.log('   3. 依赖自动注入，减少样板代码');
  console.log('   4. 易于测试，可以替换实现');
  console.log('   5. 延迟加载，提高启动性能');
  console.log('');

  console.log('🎉 依赖注入演示完成！\n');
}

// 运行演示
if (require.main === module) {
  demonstrateDependencyInjection().catch(console.error);
}
