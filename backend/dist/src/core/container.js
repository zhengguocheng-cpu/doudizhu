"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyContainer = void 0;
class DependencyContainer {
    constructor() {
        this.services = new Map();
        this.factories = new Map();
        this.singletons = new Map();
    }
    static getInstance() {
        if (!DependencyContainer.instance) {
            DependencyContainer.instance = new DependencyContainer();
        }
        return DependencyContainer.instance;
    }
    register(token, factory) {
        this.factories.set(token, factory);
    }
    registerSingleton(token, factory) {
        this.singletons.set(token, factory);
    }
    registerInstance(token, instance) {
        this.services.set(token, instance);
    }
    resolve(token) {
        if (this.services.has(token)) {
            return this.services.get(token);
        }
        if (this.singletons.has(token)) {
            const factory = this.singletons.get(token);
            const instance = factory();
            if (instance && typeof instance.initialize === 'function') {
                instance.initialize();
            }
            this.services.set(token, instance);
            return instance;
        }
        if (this.factories.has(token)) {
            const factory = this.factories.get(token);
            const instance = factory();
            if (instance && typeof instance.initialize === 'function') {
                instance.initialize();
            }
            return instance;
        }
        throw new Error(`Service not registered: ${String(token)}`);
    }
    has(token) {
        return this.services.has(token) || this.factories.has(token) || this.singletons.has(token);
    }
    unregister(token) {
        this.services.delete(token);
        this.factories.delete(token);
        this.singletons.delete(token);
    }
    clear() {
        this.services.clear();
        this.factories.clear();
        this.singletons.clear();
    }
    getRegisteredTokens() {
        return Array.from(new Set([
            ...Array.from(this.services.keys()),
            ...Array.from(this.factories.keys()),
            ...Array.from(this.singletons.keys())
        ]));
    }
}
exports.DependencyContainer = DependencyContainer;
//# sourceMappingURL=container.js.map