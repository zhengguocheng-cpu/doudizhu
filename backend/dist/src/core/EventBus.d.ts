import { EventHandlerConfig } from '../types';
export type EventHandler<T = any> = (event: T) => void | Promise<void>;
export interface EventSubscription {
    id: string;
    event: string;
    handler: EventHandler;
    config: EventHandlerConfig;
    once: boolean;
}
export declare class EventBus {
    private static instance;
    private subscriptions;
    private eventQueue;
    private processing;
    private constructor();
    static getInstance(): EventBus;
    subscribe<T = any>(event: string, handler: EventHandler<T>, config?: Partial<EventHandlerConfig>): string;
    once<T = any>(event: string, handler: EventHandler<T>, config?: Partial<EventHandlerConfig>): string;
    unsubscribe(subscriptionId: string): boolean;
    emit(event: string, data?: any): void;
    emitAsync(event: string, data?: any): Promise<void>;
    getSubscriptionCount(event: string): number;
    getEventTypes(): string[];
    clear(): void;
    private processQueue;
    private processEvent;
    private executeHandler;
    private createTimeout;
    private findSubscription;
    private generateSubscriptionId;
}
//# sourceMappingURL=EventBus.d.ts.map