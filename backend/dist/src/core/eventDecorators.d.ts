import { EventHandlerConfig } from '../types';
export interface EventHandlerMetadata {
    event: string;
    config?: EventHandlerConfig;
    methodName: string;
}
export declare function EventHandler(event: string, config?: EventHandlerConfig): (target: any, methodName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function AsyncEventHandler(event: string, config?: EventHandlerConfig): (target: any, methodName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function OnceEventHandler(event: string, config?: EventHandlerConfig): (target: any, methodName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function AutoRegisterEventHandlers(target: any): any;
export declare function EmitEvent(event: string): (target: any, methodName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
//# sourceMappingURL=eventDecorators.d.ts.map