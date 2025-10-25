import { Token } from '../types';
export declare function Injectable(token?: Token): <T extends new (...args: any[]) => any>(target: T) => T;
export declare function Inject(token: Token): (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => void;
export declare function Service<T>(token: Token<T>): (target: any, propertyKey: string) => void;
export declare function AutoInject(target: any): any;
//# sourceMappingURL=decorators.d.ts.map