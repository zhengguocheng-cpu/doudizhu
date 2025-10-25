import { Token } from '../types';
export declare class DependencyContainer {
    private static instance;
    private services;
    private factories;
    private singletons;
    private constructor();
    static getInstance(): DependencyContainer;
    register<T>(token: Token<T>, factory: () => T): void;
    registerSingleton<T>(token: Token<T>, factory: () => T): void;
    registerInstance<T>(token: Token<T>, instance: T): void;
    resolve<T>(token: Token<T>): T;
    has(token: Token): boolean;
    unregister(token: Token): void;
    clear(): void;
    getRegisteredTokens(): Token[];
}
//# sourceMappingURL=container.d.ts.map