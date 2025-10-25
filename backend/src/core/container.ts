/**
 * 依赖注入容器
 * 实现IoC (Inversion of Control) 模式
 * 管理服务实例的创建和依赖注入
 */

import { Token, ContainerConfig } from '../types';

export class DependencyContainer {
  private static instance: DependencyContainer;
  private services: Map<Token, any> = new Map();
  private factories: Map<Token, Function> = new Map();
  private singletons: Map<Token, any> = new Map();

  private constructor() {}

  /**
   * 获取容器单例实例
   */
  public static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }

  /**
   * 注册服务工厂函数
   */
  public register<T>(token: Token<T>, factory: () => T): void {
    this.factories.set(token, factory);
  }

  /**
   * 注册单例服务
   */
  public registerSingleton<T>(token: Token<T>, factory: () => T): void {
    this.singletons.set(token, factory);
  }

  /**
   * 注册服务实例
   */
  public registerInstance<T>(token: Token<T>, instance: T): void {
    this.services.set(token, instance);
  }

  /**
   * 获取服务实例
   */
  public resolve<T>(token: Token<T>): T {
    // 1. 检查是否已存在实例
    if (this.services.has(token)) {
      return this.services.get(token);
    }

    // 2. 检查是否为单例
    if (this.singletons.has(token)) {
      const factory = this.singletons.get(token)!;
      const instance = factory();
      if(instance && typeof instance.initialize === 'function') {
        instance.initialize();
      }
      this.services.set(token, instance);
      return instance;
    }

    // 3. 使用工厂函数创建实例
    if (this.factories.has(token)) {
      const factory = this.factories.get(token)!;
      const instance = factory();
      if(instance && typeof instance.initialize === 'function') {
        instance.initialize();
      }
      return instance;
    }

    // 4. 抛出错误
    throw new Error(`Service not registered: ${String(token)}`);
  }

  /**
   * 检查服务是否已注册
   */
  public has(token: Token): boolean {
    return this.services.has(token) || this.factories.has(token) || this.singletons.has(token);
  }

  /**
   * 移除服务注册
   */
  public unregister(token: Token): void {
    this.services.delete(token);
    this.factories.delete(token);
    this.singletons.delete(token);
  }

  /**
   * 清空所有服务
   */
  public clear(): void {
    this.services.clear();
    this.factories.clear();
    this.singletons.clear();
  }

  /**
   * 获取所有已注册的服务令牌
   */
  public getRegisteredTokens(): Token[] {
    return Array.from(new Set([
      ...Array.from(this.services.keys()),
      ...Array.from(this.factories.keys()),
      ...Array.from(this.singletons.keys())
    ]));
  }
}
