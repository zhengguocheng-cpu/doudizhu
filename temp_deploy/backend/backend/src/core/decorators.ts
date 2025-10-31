/**
 * 依赖注入装饰器
 * 简化依赖注入的使用
 */

import { DependencyContainer } from './container';
import { Token } from '../types';

/**
 * 可注入装饰器 - 标记类为可注入的服务
 */
export function Injectable(token?: Token) {
  return function <T extends new (...args: any[]) => any>(target: T) {
    const container = DependencyContainer.getInstance();
    const serviceToken = token || target;

    // 注册为单例服务
    container.registerSingleton(serviceToken, () => new target());

    return target;
  };
}

/**
 * 注入装饰器 - 注入依赖到类属性
 */
export function Inject(token: Token) {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    // 简化实现：直接使用依赖注入容器
    // 参数装饰器 - 用于构造函数参数注入
    if (typeof parameterIndex === 'number') {
      const injectionKey = '__injections';
      if (!target[injectionKey]) {
        target[injectionKey] = [];
      }
      target[injectionKey][parameterIndex] = token;
    }
  };
}

/**
 * 服务注入装饰器 - 注入到类属性
 */
export function Service<T>(token: Token<T>) {
  return function (target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get: function () {
        return DependencyContainer.getInstance().resolve(token);
      },
      enumerable: true,
      configurable: true
    });
  };
}

/**
 * 自动注入装饰器 - 自动解析构造函数依赖
 */
export function AutoInject(target: any) {
  const container = DependencyContainer.getInstance();

  // 简化实现：不使用reflect-metadata
  // 用户需要手动配置依赖

  return target;
}
