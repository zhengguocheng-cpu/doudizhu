/**
 * 服务注册器
 * 负责将所有服务注册到依赖注入容器中
 */

import { DependencyContainer } from '../core/container';
import { Logger } from '../core/Logger';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { ErrorMiddleware } from '../middleware/ErrorMiddleware';
import { createUserManager } from '../services/user/userManager';
import { PlayerSession } from '../services/player/playerSession';
import { PlayerManager } from '../services/player/playerManager';
import { PlayerService } from '../services/player/playerService';
import { getAuthService } from '../services/auth/AuthService';

export class ServiceRegistry {
  private container: DependencyContainer;

  constructor() {
    this.container = DependencyContainer.getInstance();
  }

  /**
   * 注册所有服务到容器中
   */
  public registerAllServices(): void {
    this.registerCoreServices();
    this.registerMiddlewareServices();
    this.registerBusinessServices();
  }

  /**
   * 注册核心服务
   */
  private registerCoreServices(): void {
    // 注册Logger服务 - 使用单例模式
    this.container.registerSingleton('Logger', () => Logger.getInstance());
  }

  /**
   * 注册中间件服务
   */
  private registerMiddlewareServices(): void {
    // 注册AuthMiddleware服务 - 使用单例模式
    this.container.registerSingleton('AuthMiddleware', () => new AuthMiddleware());

    // 注册ErrorMiddleware服务 - 使用单例模式
    this.container.registerSingleton('ErrorMiddleware', () => new ErrorMiddleware());
  }

  /**
   * 注册业务服务
   */
  private registerBusinessServices(): void {
    // 注册PlayerSession服务（SessionManager）- 使用单例模式
    this.container.registerSingleton('SessionManager', () => new PlayerSession());

    // 注册UserManager服务 - 使用单例模式，需要依赖SessionManager
    this.container.registerSingleton('UserManager', () => {
      const sessionManager = this.container.resolve<PlayerSession>('SessionManager');
      return createUserManager(sessionManager);
    });

    // 注册AuthService服务 - 使用单例模式
    this.container.registerSingleton('AuthService', () => getAuthService());

    // 注册PlayerManager服务 - 使用单例模式
    this.container.registerSingleton('PlayerManager', () => new PlayerManager());

    // 注册PlayerService服务 - 使用单例模式
    this.container.registerSingleton('PlayerService', () => new PlayerService());
  }

  /**
   * 获取已注册的服务列表
   */
  public getRegisteredServices(): string[] {
    return this.container.getRegisteredTokens().map(token => String(token));
  }
}
