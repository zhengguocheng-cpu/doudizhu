import { Request, Response, NextFunction } from 'express';
import { BaseService } from '../core/BaseService';
export interface AuthenticatedRequest extends Request {
    userId?: string;
    userName?: string;
    sessionId?: string;
    user?: any;
}
export declare class HttpMiddleware extends BaseService {
    private authMiddleware;
    private errorMiddleware;
    constructor();
    protected onInitialize(): Promise<void>;
    protected onDestroy(): Promise<void>;
    requestLogger(req: Request, res: Response, next: NextFunction): void;
    corsHandler(req: Request, res: Response, next: NextFunction): void;
    authenticateRequest(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
    requirePermission(permission: string): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
    rateLimit(maxRequests?: number, windowMs?: number): (req: Request, res: Response, next: NextFunction) => void;
    validateRequest(validationRules: any): (req: Request, res: Response, next: NextFunction) => void;
    responseFormatter(req: Request, res: Response, next: NextFunction): void;
    securityHeaders(req: Request, res: Response, next: NextFunction): void;
    timeoutHandler(timeoutMs?: number): (req: Request, res: Response, next: NextFunction) => void;
    notFoundHandler(req: Request, res: Response, next: NextFunction): void;
}
//# sourceMappingURL=HttpMiddleware.d.ts.map