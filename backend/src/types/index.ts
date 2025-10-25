// 统一导出所有类型定义
export * from './player';
export * from './room';

// 导出常量定义
export * from '../constants';

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 事件类型定义
export interface SocketEvent {
  type: string;
  data: any;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

// 游戏状态枚举
export enum GameStatus {
  WAITING = 'waiting',
  READY = 'ready',
  PLAYING = 'playing',
  PAUSED = 'paused',
  FINISHED = 'finished'
}

// 用户状态枚举
export enum UserStatus {
  OFFLINE = 'offline',
  ONLINE = 'online',
  IN_GAME = 'in_game',
  AWAY = 'away'
}

// 房间状态枚举
export enum RoomStatus {
  OPEN = 'open',
  FULL = 'full',
  IN_GAME = 'in_game',
  CLOSED = 'closed'
}

// 错误类型定义
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

// 通用分页响应
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 游戏配置类型
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

// 服务器配置类型
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

// 统计信息类型
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

// 健康检查响应
export interface HealthCheck {
  healthy: boolean;
  timestamp: Date;
  services: {
    database?: { status: 'up' | 'down', responseTime?: number };
    redis?: { status: 'up' | 'down', responseTime?: number };
    socket?: { status: 'up' | 'down', connections?: number };
  };
  system: {
    memory: { used: number, total: number };
    cpu: { usage: number };
    uptime: number;
  };
}

// 日志级别枚举
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace'
}

// 结构化日志类型
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

// 依赖注入令牌类型
export type Token<T = any> = string | symbol | (new (...args: any[]) => T);

// 依赖注入容器配置
export interface ContainerConfig {
  autoBindInjectable: boolean;
  defaultScope: 'Singleton' | 'Transient' | 'Request';
  skipBaseClassChecks: boolean;
}

// 事件处理器配置
export interface EventHandlerConfig {
  async: boolean;
  retries: number;
  timeout: number;
  queue?: string;
}
