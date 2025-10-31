/**
 * 服务基类
 * 提供基础的服务功能和生命周期管理
 */

import { DependencyContainer } from './container';
import { StructuredLog, LogLevel } from '../types';

export abstract class BaseService {
  protected container: DependencyContainer;
  protected logger: any;

  constructor() {
    this.container = DependencyContainer.getInstance();
    // 不在构造函数中解析Logger，避免循环依赖
    // this.logger = this.container.resolve('Logger');
  }

  /**
   * 服务初始化
   */
  public async initialize(): Promise<void> {
    // 在initialize方法中解析Logger，确保服务已注册
    try {
      this.logger = this.container.resolve('Logger');
    } catch (error) {
      // 如果Logger服务不可用，使用console作为fallback
      console.warn(`Logger服务不可用，使用console作为fallback: ${this.constructor.name}`);
      this.logger = console;
    }

    this.log(LogLevel.INFO, 'Service initializing', { service: this.constructor.name });
    await this.onInitialize();
    this.log(LogLevel.INFO, 'Service initialized', { service: this.constructor.name });
  }

  /**
   * 服务销毁
   */
  public async destroy(): Promise<void> {
    this.log(LogLevel.INFO, 'Service destroying', { service: this.constructor.name });
    await this.onDestroy();
    this.log(LogLevel.INFO, 'Service destroyed', { service: this.constructor.name });
  }

  /**
   * 获取其他服务
   */
  protected getService<T>(token: any): T {
    return this.container.resolve<T>(token);
  }

  /**
   * 结构化日志记录
   */
  protected log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    if (this.logger) {
      // 检查是否是真正的Logger实例
      if (typeof this.logger.log === 'function') {
        this.logger.log({
          level,
          message,
          context: { service: this.constructor.name },
          metadata,
          timestamp: new Date()
        });
      } else {
        // 如果是console或其他对象，使用简单格式
        const timestamp = new Date().toISOString();
        const levelNames = {
          [LogLevel.ERROR]: 'ERROR',
          [LogLevel.WARN]: 'WARN',
          [LogLevel.INFO]: 'INFO',
          [LogLevel.DEBUG]: 'DEBUG',
          [LogLevel.TRACE]: 'TRACE'
        };
        const levelName = levelNames[level] || 'INFO';
        const serviceName = this.constructor.name;
        //this.logger.log(`[${timestamp}] ${levelName} [${serviceName}] ${message}`, metadata || '');
      }
    }
  }

  /**
   * 子类实现初始化逻辑
   */
  protected abstract onInitialize(): Promise<void>;

  /**
   * 子类实现销毁逻辑
   */
  protected abstract onDestroy(): Promise<void>;
}
