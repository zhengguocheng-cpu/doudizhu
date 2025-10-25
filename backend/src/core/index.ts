/**
 * 核心模块索引文件
 * 导出Phase 1创建的所有核心组件
 */

// 导出核心服务
export { DependencyContainer } from './container';
export { BaseService } from './BaseService';
export { EventBus } from './EventBus';
export { Logger } from './Logger';
export { ServiceRegistry } from './ServiceRegistry';

// 导出装饰器
export {
  Injectable,
  Inject,
  Service,
  AutoInject
} from './decorators';

export {
  EventHandler,
  AsyncEventHandler,
  OnceEventHandler,
  AutoRegisterEventHandlers,
  EmitEvent
} from './eventDecorators';

// 导出中间件
export { AuthMiddleware } from '../middleware/AuthMiddleware';
export { ErrorMiddleware } from '../middleware/ErrorMiddleware';
export { HttpMiddleware } from '../middleware/HttpMiddleware';

// 导出类型定义
export type {
  Token,
  ContainerConfig,
  EventHandlerConfig,
  SocketEvent,
  ApiResponse,
  AppError,
  GameConfig,
  ServerConfig,
  SystemStats,
  HealthCheck,
  StructuredLog
} from '../types';

export {
  GameStatus,
  UserStatus,
  RoomStatus,
  LogLevel,
  GAME_CONSTANTS,
  HTTP_STATUS,
  API,
  LOGGING,
  CLEANUP,
  VALIDATION,
  ENV_DEFAULTS
} from '../types';

// 导出配置
export {
  config,
  serverConfig,
  gameConfig,
  databaseConfig,
  redisConfig,
  loggingConfig,
  monitoringConfig,
  cleanupConfig,
  pathsConfig,
  developmentConfig
} from '../config';
