import { DependencyContainer } from './container';
import { LogLevel } from '../types';
export declare abstract class BaseService {
    protected container: DependencyContainer;
    protected logger: any;
    constructor();
    initialize(): Promise<void>;
    destroy(): Promise<void>;
    protected getService<T>(token: any): T;
    protected log(level: LogLevel, message: string, metadata?: Record<string, any>): void;
    protected abstract onInitialize(): Promise<void>;
    protected abstract onDestroy(): Promise<void>;
}
//# sourceMappingURL=BaseService.d.ts.map