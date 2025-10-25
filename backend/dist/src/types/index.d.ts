export * from './player';
export * from './room';
export * from '../constants';
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export interface SocketEvent {
    type: string;
    data: any;
    timestamp: Date;
    userId?: string;
    sessionId?: string;
}
export declare enum GameStatus {
    WAITING = "waiting",
    READY = "ready",
    PLAYING = "playing",
    PAUSED = "paused",
    FINISHED = "finished"
}
export declare enum UserStatus {
    OFFLINE = "offline",
    ONLINE = "online",
    IN_GAME = "in_game",
    AWAY = "away"
}
export declare enum RoomStatus {
    OPEN = "open",
    FULL = "full",
    IN_GAME = "in_game",
    CLOSED = "closed"
}
export interface AppError {
    code: string;
    message: string;
    details?: any;
    timestamp: Date;
    userId?: string;
    sessionId?: string;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
export interface GameConfig {
    maxPlayers: number;
    minPlayers: number;
    cardsPerPlayer: number;
    bottomCards: number;
    timeouts: {
        turnTimeout: number;
        gameTimeout: number;
        reconnectTimeout: number;
    };
    rules: {
        allowSpectators: boolean;
        autoStart: boolean;
        privateRooms: boolean;
    };
}
export interface ServerConfig {
    port: number;
    host: string;
    cors: {
        origin: string | string[];
        credentials: boolean;
    };
    socket: {
        pingTimeout: number;
        pingInterval: number;
        maxReconnectionAttempts: number;
    };
    security: {
        rateLimiting: {
            enabled: boolean;
            maxRequests: number;
            windowMs: number;
        };
        sessionTimeout: number;
    };
}
export interface SystemStats {
    uptime: number;
    memory: {
        used: number;
        total: number;
        rss: number;
        heapUsed: number;
        heapTotal: number;
    };
    connections: {
        total: number;
        active: number;
        authenticated: number;
    };
    rooms: {
        total: number;
        active: number;
        waiting: number;
        playing: number;
    };
    users: {
        total: number;
        online: number;
        inGame: number;
    };
}
export interface HealthCheck {
    healthy: boolean;
    timestamp: Date;
    services: {
        database?: {
            status: 'up' | 'down';
            responseTime?: number;
        };
        redis?: {
            status: 'up' | 'down';
            responseTime?: number;
        };
        socket?: {
            status: 'up' | 'down';
            connections?: number;
        };
    };
    system: {
        memory: {
            used: number;
            total: number;
        };
        cpu: {
            usage: number;
        };
        uptime: number;
    };
}
export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    DEBUG = "debug",
    TRACE = "trace"
}
export interface StructuredLog {
    level: LogLevel;
    message: string;
    timestamp: Date;
    context?: {
        userId?: string;
        sessionId?: string;
        roomId?: string;
        socketId?: string;
    };
    metadata?: Record<string, any>;
    error?: Error;
    duration?: number;
}
export type Token<T = any> = string | symbol | (new (...args: any[]) => T);
export interface ContainerConfig {
    autoBindInjectable: boolean;
    defaultScope: 'Singleton' | 'Transient' | 'Request';
    skipBaseClassChecks: boolean;
}
export interface EventHandlerConfig {
    async: boolean;
    retries: number;
    timeout: number;
    queue?: string;
}
//# sourceMappingURL=index.d.ts.map