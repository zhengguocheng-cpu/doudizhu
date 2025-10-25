import { Request, Response, NextFunction } from 'express';
import { Socket } from 'socket.io';
import { BaseService } from '../core/BaseService';
export interface ExtendedError extends Error {
    statusCode?: number;
    code?: string;
    details?: any;
}
export declare class ErrorMiddleware extends BaseService {
    constructor();
    protected onInitialize(): Promise<void>;
    protected onDestroy(): Promise<void>;
    handleHttpError(error: ExtendedError, req: Request, res: Response, next: NextFunction): void;
    handleSocketError(socket: Socket, error: ExtendedError): void;
    catchAsyncErrors(handler: Function): Function;
    private normalizeError;
    private logError;
    private sendHttpErrorResponse;
    private sendSocketErrorResponse;
    private mapErrorToCode;
    private mapErrorToStatusCode;
    private determineLogLevel;
    private getClientErrorMessage;
    private getClientMessage;
    createError(code: string, message: string, details?: any): ExtendedError;
    createValidationError(message: string, details?: any): ExtendedError;
    createAuthError(message: string, details?: any): ExtendedError;
    createRoomError(message: string, details?: any): ExtendedError;
    createGameError(message: string, details?: any): ExtendedError;
}
//# sourceMappingURL=ErrorMiddleware.d.ts.map