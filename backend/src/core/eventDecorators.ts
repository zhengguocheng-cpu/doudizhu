/**
 * 事件处理器装饰器
 * 简化事件处理器的注册和管理
 */

import { EventBus } from './EventBus';
import { EventHandlerConfig } from '../types';

export interface EventHandlerMetadata {
  event: string;
  config?: EventHandlerConfig;
  methodName: string;
}

/**
 * 事件处理器装饰器
 */
export function EventHandler(event: string, config?: EventHandlerConfig) {
  return function (target: any, methodName: string, descriptor: PropertyDescriptor) {
    const eventBus = EventBus.getInstance();

    // 存储元数据（使用简单对象存储替代Reflect）
    const metadataKey = '__eventHandlers';
    if (!target.constructor[metadataKey]) {
      target.constructor[metadataKey] = [];
    }
    target.constructor[metadataKey].push({ event, config, methodName });

    // 包装原始方法
    const originalMethod = descriptor.value;

    descriptor.value = function(this: any, ...args: any[]) {
      return originalMethod.apply(this, args);
    };

    // 注册到事件总线
    eventBus.subscribe(event, (eventData) => {
      return originalMethod.call(target, eventData);
    }, config);

    return descriptor;
  };
}

/**
 * 异步事件处理器装饰器
 */
export function AsyncEventHandler(event: string, config?: EventHandlerConfig) {
  return EventHandler(event, { ...config, async: true } as EventHandlerConfig);
}

/**
 * 一次性事件处理器装饰器
 */
export function OnceEventHandler(event: string, config?: EventHandlerConfig) {
  return function (target: any, methodName: string, descriptor: PropertyDescriptor) {
    const eventBus = EventBus.getInstance();

    const originalMethod = descriptor.value;

    descriptor.value = function(this: any, ...args: any[]) {
      return originalMethod.apply(this, args);
    };

    // 注册一次性处理器
    eventBus.once(event, (eventData) => {
      return originalMethod.call(target, eventData);
    }, config);

    return descriptor;
  };
}

/**
 * 自动注册事件处理器
 */
export function AutoRegisterEventHandlers(target: any) {
  // 使用简单对象存储替代Reflect
  const metadataKey = '__eventHandlers';
  const metadata: EventHandlerMetadata[] = target.constructor[metadataKey] || [];
  const eventBus = EventBus.getInstance();

  metadata.forEach(({ event, config, methodName }) => {
    const handler = target[methodName].bind(target);
    eventBus.subscribe(event, handler, config);
  });

  return target;
}

/**
 * 事件发布装饰器（用于简化事件发布）
 */
export function EmitEvent(event: string) {
  return function (target: any, methodName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const eventBus = EventBus.getInstance();

    descriptor.value = async function(...args: any[]) {
      const result = await originalMethod.apply(this, args);

      // 发布事件
      eventBus.emit(event, {
        result,
        args,
        timestamp: new Date()
      });

      return result;
    };

    return descriptor;
  };
}
