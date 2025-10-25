import { StructuredLog } from '../types';
export declare class Logger {
    private static instance;
    private minLevel;
    private constructor();
    static getInstance(): Logger;
    log(logData: StructuredLog): void;
    error(message: string, error?: Error, context?: any): void;
    warn(message: string, context?: any): void;
    info(message: string, context?: any): void;
    debug(message: string, context?: any): void;
    trace(message: string, context?: any): void;
    createChildLogger(context: string): Logger;
    private parseLogLevel;
    private shouldLog;
    private writeLog;
    private formatLog;
    private writeSimpleLog;
    private writeToFile;
}
//# sourceMappingURL=Logger.d.ts.map