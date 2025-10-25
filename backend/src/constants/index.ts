/**
 * 游戏常量定义
 * 统一管理所有魔法数字和常量值
 */

// 游戏规则常量
export const GAME_CONSTANTS = {
  // 玩家相关
  MAX_PLAYERS_PER_ROOM: 3,
  MIN_PLAYERS_PER_ROOM: 3,

  // 扑克牌相关
  TOTAL_CARDS: 54,
  CARDS_PER_PLAYER: 17,
  BOTTOM_CARDS: 3,

  // 游戏状态相关
  GAME_STATUS: {
    WAITING: 'waiting',
    READY: 'ready',
    PLAYING: 'playing',
    PAUSED: 'paused',
    FINISHED: 'finished'
  } as const,

  // 房间状态相关
  ROOM_STATUS: {
    OPEN: 'open',
    FULL: 'full',
    IN_GAME: 'in_game',
    CLOSED: 'closed'
  } as const,

  // 用户状态相关
  USER_STATUS: {
    OFFLINE: 'offline',
    ONLINE: 'online',
    IN_GAME: 'in_game',
    AWAY: 'away'
  } as const,

  // 超时设置 (毫秒)
  TIMEOUTS: {
    TURN_TIMEOUT: 30 * 1000,        // 30秒出牌超时
    GAME_TIMEOUT: 30 * 60 * 1000,   // 30分钟游戏超时
    RECONNECT_TIMEOUT: 10 * 1000,   // 10秒重连超时
    CLEANUP_INTERVAL: 5 * 60 * 1000 // 5分钟清理间隔
  },

  // Socket.IO相关
  SOCKET_EVENTS: {
    // 认证相关
    AUTHENTICATE: 'authenticate',
    RECONNECT_USER: 'reconnect_user',
    AUTHENTICATED: 'authenticated',

    // 游戏相关
    JOIN_GAME: 'join_game',
    LEAVE_GAME: 'leave_game',
    PLAYER_READY: 'player_ready',
    GRAB_LANDLORD: 'grab_landlord',
    PLAY_CARDS: 'play_cards',
    PASS_TURN: 'pass_turn',

    // 房间相关
    ROOM_JOINED: 'room_joined',
    PLAYER_JOINED: 'player_joined',
    PLAYER_LEFT: 'player_left',
    ROOM_UPDATED: 'room_updated',

    // 游戏状态相关
    GAME_STARTED: 'game_started',
    GAME_STATE_UPDATED: 'game_state_updated',
    LANDLORD_SELECTED: 'landlord_selected',
    CARDS_DEALT: 'cards_dealt',
    CARDS_PLAYED: 'cards_played',
    TURN_CHANGED: 'turn_changed',
    GAME_ENDED: 'game_ended',

    // 聊天相关
    SEND_MESSAGE: 'send_message',
    MESSAGE_RECEIVED: 'message_received',

    // 错误相关
    ERROR: 'error',
    DISCONNECT: 'disconnect'
  } as const,

  // 错误码
  ERROR_CODES: {
    // 认证错误
    AUTH_REQUIRED: 'AUTH_REQUIRED',
    AUTH_FAILED: 'AUTH_FAILED',
    SESSION_EXPIRED: 'SESSION_EXPIRED',

    // 游戏错误
    ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
    ROOM_FULL: 'ROOM_FULL',
    GAME_NOT_STARTED: 'GAME_NOT_STARTED',
    NOT_YOUR_TURN: 'NOT_YOUR_TURN',
    INVALID_CARDS: 'INVALID_CARDS',

    // 系统错误
    SERVER_ERROR: 'SERVER_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    RATE_LIMITED: 'RATE_LIMITED'
  } as const
} as const;

// HTTP状态码常量
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
} as const;

// 数据库相关常量
export const DATABASE = {
  COLLECTIONS: {
    USERS: 'users',
    SESSIONS: 'sessions',
    ROOMS: 'rooms',
    GAMES: 'games',
    LOGS: 'logs'
  },
  OPERATIONS: {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete'
  }
} as const;

// API相关常量
export const API = {
  PREFIX: '/api',
  VERSION: '/v1',
  ROUTES: {
    GAMES: '/games',
    USERS: '/users',
    ROOMS: '/rooms',
    HEALTH: '/health',
    METRICS: '/metrics'
  },
  RATE_LIMITS: {
    AUTH: { max: 5, windowMs: 15 * 60 * 1000 },    // 5次/15分钟
    GAME: { max: 100, windowMs: 60 * 1000 },       // 100次/分钟
    CHAT: { max: 30, windowMs: 60 * 1000 }         // 30次/分钟
  }
} as const;

// 日志相关常量
export const LOGGING = {
  LEVELS: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
    TRACE: 4
  },
  CATEGORIES: {
    AUTH: 'auth',
    GAME: 'game',
    ROOM: 'room',
    SOCKET: 'socket',
    SYSTEM: 'system',
    PERFORMANCE: 'performance'
  }
} as const;

// 清理相关常量
export const CLEANUP = {
  THRESHOLDS: {
    OFFLINE_USERS: 60 * 60 * 1000,      // 1小时
    EXPIRED_SESSIONS: 24 * 60 * 60 * 1000, // 24小时
    EMPTY_ROOMS: 30 * 60 * 1000,        // 30分钟
    OLD_LOGS: 7 * 24 * 60 * 60 * 1000   // 7天
  },
  BATCH_SIZE: 100, // 每次清理的批量大小
  CONCURRENCY: 5   // 并发清理任务数
} as const;

// 验证规则常量
export const VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/
  },
  ROOM_ID: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9_-]+$/
  },
  MESSAGE: {
    MAX_LENGTH: 200,
    PATTERN: /^[\s\S]*$/ // 允许任何字符，包括表情符号
  }
} as const;

// 环境变量默认值
export const ENV_DEFAULTS = {
  NODE_ENV: 'development',
  PORT: '3000',
  HOST: 'localhost',
  LOG_LEVEL: 'info',
  LOG_FORMAT: 'json',
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24小时
  CLEANUP_INTERVAL: 5 * 60 * 1000,      // 5分钟
  METRICS_PORT: '9090'
} as const;
