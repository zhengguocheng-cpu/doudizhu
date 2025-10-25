/**
 * 事件总线
 * 实现发布-订阅模式，支持异步事件处理
 */

import { SocketEvent, EventHandlerConfig } from '../types';

export type EventHandler<T = any> = (event: T) => void | Promise<void>;

export interface EventSubscription {
  id: string;
  event: string;
  handler: EventHandler;
  config: EventHandlerConfig;
  once: boolean;
}

export class EventBus {
  private static instance: EventBus;
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private eventQueue: SocketEvent[] = [];
  private processing: boolean = false;

  private constructor() {}

  /**
   * 获取事件总线单例实例
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * 订阅事件
   */
  public subscribe<T = any>(
    event: string,
    handler: EventHandler<T>,
    config: Partial<EventHandlerConfig> = {}
  ): string {
    const subscriptionId = this.generateSubscriptionId();
    const subscription: EventSubscription = {
      id: subscriptionId,
      event,
      handler,
      config: {
        async: true,
        retries: 3,
        timeout: 30000,
        ...config
      },
      once: false
    };

    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, []);
    }

    this.subscriptions.get(event)!.push(subscription);

    console.log(`📡 Event subscribed: ${event} (ID: ${subscriptionId})`);

    return subscriptionId;
  }

  /**
   * 订阅一次性事件
   */
  public once<T = any>(
    event: string,
    handler: EventHandler<T>,
    config: Partial<EventHandlerConfig> = {}
  ): string {
    const subscriptionId = this.subscribe(event, handler, { ...config, async: false });
    const subscription = this.findSubscription(subscriptionId);
    if (subscription) {
      subscription.once = true;
    }
    return subscriptionId;
  }

  /**
   * 取消订阅
   */
  public unsubscribe(subscriptionId: string): boolean {
    for (const [event, subscriptions] of this.subscriptions.entries()) {
      const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        subscriptions.splice(index, 1);
        console.log(`🔌 Event unsubscribed: ${event} (ID: ${subscriptionId})`);
        return true;
      }
    }
    return false;
  }

  /**
   * 发布事件（同步）
   */
  public emit(event: string, data: any = {}): void {
    const eventData: SocketEvent = {
      type: event,
      data,
      timestamp: new Date(),
      userId: data.userId,
      sessionId: data.sessionId
    };

    this.eventQueue.push(eventData);

    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * 发布事件（异步）
   */
  public async emitAsync(event: string, data: any = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      this.emit(event, { ...data, resolve, reject });
    });
  }

  /**
   * 获取事件订阅者数量
   */
  public getSubscriptionCount(event: string): number {
    return this.subscriptions.get(event)?.length || 0;
  }

  /**
   * 获取所有事件类型
   */
  public getEventTypes(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * 清空所有订阅
   */
  public clear(): void {
    this.subscriptions.clear();
    this.eventQueue.length = 0;
    console.log('🧹 Event bus cleared');
  }

  /**
   * 处理事件队列
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;

    this.processing = true;

    while (this.eventQueue.length > 0) {
      const eventData = this.eventQueue.shift()!;
      await this.processEvent(eventData);
    }

    this.processing = false;
  }

  /**
   * 处理单个事件
   */
  private async processEvent(eventData: SocketEvent): Promise<void> {
    const subscriptions = this.subscriptions.get(eventData.type) || [];

    if (subscriptions.length === 0) {
      console.log(`⚠️ No handlers for event: ${eventData.type}`);
      return;
    }

    console.log(`📨 Processing event: ${eventData.type} (${subscriptions.length} handlers)`);

    const promises = subscriptions.map(async (subscription) => {
      try {
        await this.executeHandler(subscription, eventData);
      } catch (error) {
        console.error(`❌ Error in event handler ${subscription.id}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * 执行事件处理器
   */
  private async executeHandler(subscription: EventSubscription, eventData: SocketEvent): Promise<void> {
    const startTime = Date.now();

    try {
      // 执行处理器
      if (subscription.config.async) {
        await Promise.race([
          subscription.handler(eventData),
          this.createTimeout(subscription.config.timeout)
        ]);
      } else {
        subscription.handler(eventData);
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Event handled: ${eventData.type} (${duration}ms)`);

      // 如果是一次性订阅，移除它
      if (subscription.once) {
        this.unsubscribe(subscription.id);
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Event handler failed: ${eventData.type} (${duration}ms)`, error);

      // 重试逻辑
      if (subscription.config.retries > 0) {
        subscription.config.retries--;
        console.log(`🔄 Retrying event handler (${subscription.config.retries} attempts left)`);

        // 延迟重试
        setTimeout(() => {
          this.executeHandler(subscription, eventData);
        }, 1000);
      }
    }
  }

  /**
   * 创建超时Promise
   */
  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Event handler timeout')), ms);
    });
  }

  /**
   * 查找订阅
   */
  private findSubscription(subscriptionId: string): EventSubscription | undefined {
    for (const subscriptions of this.subscriptions.values()) {
      const subscription = subscriptions.find(sub => sub.id === subscriptionId);
      if (subscription) return subscription;
    }
    return undefined;
  }

  /**
   * 生成订阅ID
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
