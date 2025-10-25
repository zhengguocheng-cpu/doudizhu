"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBus = void 0;
class EventBus {
    constructor() {
        this.subscriptions = new Map();
        this.eventQueue = [];
        this.processing = false;
    }
    static getInstance() {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }
    subscribe(event, handler, config = {}) {
        const subscriptionId = this.generateSubscriptionId();
        const subscription = {
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
        this.subscriptions.get(event).push(subscription);
        console.log(`📡 Event subscribed: ${event} (ID: ${subscriptionId})`);
        return subscriptionId;
    }
    once(event, handler, config = {}) {
        const subscriptionId = this.subscribe(event, handler, { ...config, async: false });
        const subscription = this.findSubscription(subscriptionId);
        if (subscription) {
            subscription.once = true;
        }
        return subscriptionId;
    }
    unsubscribe(subscriptionId) {
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
    emit(event, data = {}) {
        const eventData = {
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
    async emitAsync(event, data = {}) {
        return new Promise((resolve, reject) => {
            this.emit(event, { ...data, resolve, reject });
        });
    }
    getSubscriptionCount(event) {
        return this.subscriptions.get(event)?.length || 0;
    }
    getEventTypes() {
        return Array.from(this.subscriptions.keys());
    }
    clear() {
        this.subscriptions.clear();
        this.eventQueue.length = 0;
        console.log('🧹 Event bus cleared');
    }
    async processQueue() {
        if (this.processing)
            return;
        this.processing = true;
        while (this.eventQueue.length > 0) {
            const eventData = this.eventQueue.shift();
            await this.processEvent(eventData);
        }
        this.processing = false;
    }
    async processEvent(eventData) {
        const subscriptions = this.subscriptions.get(eventData.type) || [];
        if (subscriptions.length === 0) {
            console.log(`⚠️ No handlers for event: ${eventData.type}`);
            return;
        }
        console.log(`📨 Processing event: ${eventData.type} (${subscriptions.length} handlers)`);
        const promises = subscriptions.map(async (subscription) => {
            try {
                await this.executeHandler(subscription, eventData);
            }
            catch (error) {
                console.error(`❌ Error in event handler ${subscription.id}:`, error);
            }
        });
        await Promise.allSettled(promises);
    }
    async executeHandler(subscription, eventData) {
        const startTime = Date.now();
        try {
            if (subscription.config.async) {
                await Promise.race([
                    subscription.handler(eventData),
                    this.createTimeout(subscription.config.timeout)
                ]);
            }
            else {
                subscription.handler(eventData);
            }
            const duration = Date.now() - startTime;
            console.log(`✅ Event handled: ${eventData.type} (${duration}ms)`);
            if (subscription.once) {
                this.unsubscribe(subscription.id);
            }
        }
        catch (error) {
            const duration = Date.now() - startTime;
            console.error(`❌ Event handler failed: ${eventData.type} (${duration}ms)`, error);
            if (subscription.config.retries > 0) {
                subscription.config.retries--;
                console.log(`🔄 Retrying event handler (${subscription.config.retries} attempts left)`);
                setTimeout(() => {
                    this.executeHandler(subscription, eventData);
                }, 1000);
            }
        }
    }
    createTimeout(ms) {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Event handler timeout')), ms);
        });
    }
    findSubscription(subscriptionId) {
        for (const subscriptions of this.subscriptions.values()) {
            const subscription = subscriptions.find(sub => sub.id === subscriptionId);
            if (subscription)
                return subscription;
        }
        return undefined;
    }
    generateSubscriptionId() {
        return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.EventBus = EventBus;
//# sourceMappingURL=EventBus.js.map