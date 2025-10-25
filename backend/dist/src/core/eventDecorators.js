"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventHandler = EventHandler;
exports.AsyncEventHandler = AsyncEventHandler;
exports.OnceEventHandler = OnceEventHandler;
exports.AutoRegisterEventHandlers = AutoRegisterEventHandlers;
exports.EmitEvent = EmitEvent;
const EventBus_1 = require("./EventBus");
function EventHandler(event, config) {
    return function (target, methodName, descriptor) {
        const eventBus = EventBus_1.EventBus.getInstance();
        const metadataKey = '__eventHandlers';
        if (!target.constructor[metadataKey]) {
            target.constructor[metadataKey] = [];
        }
        target.constructor[metadataKey].push({ event, config, methodName });
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            return originalMethod.apply(this, args);
        };
        eventBus.subscribe(event, (eventData) => {
            return originalMethod.call(target, eventData);
        }, config);
        return descriptor;
    };
}
function AsyncEventHandler(event, config) {
    return EventHandler(event, { ...config, async: true });
}
function OnceEventHandler(event, config) {
    return function (target, methodName, descriptor) {
        const eventBus = EventBus_1.EventBus.getInstance();
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            return originalMethod.apply(this, args);
        };
        eventBus.once(event, (eventData) => {
            return originalMethod.call(target, eventData);
        }, config);
        return descriptor;
    };
}
function AutoRegisterEventHandlers(target) {
    const metadataKey = '__eventHandlers';
    const metadata = target.constructor[metadataKey] || [];
    const eventBus = EventBus_1.EventBus.getInstance();
    metadata.forEach(({ event, config, methodName }) => {
        const handler = target[methodName].bind(target);
        eventBus.subscribe(event, handler, config);
    });
    return target;
}
function EmitEvent(event) {
    return function (target, methodName, descriptor) {
        const originalMethod = descriptor.value;
        const eventBus = EventBus_1.EventBus.getInstance();
        descriptor.value = async function (...args) {
            const result = await originalMethod.apply(this, args);
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
//# sourceMappingURL=eventDecorators.js.map