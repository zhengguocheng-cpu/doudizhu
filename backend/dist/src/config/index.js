"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.developmentConfig = exports.pathsConfig = exports.cleanupConfig = exports.monitoringConfig = exports.loggingConfig = exports.redisConfig = exports.databaseConfig = exports.gameConfig = exports.serverConfig = void 0;
const path_1 = __importDefault(require("path"));
exports.serverConfig = {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || 'localhost',
    cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:8080', 'http://localhost:3000'],
        credentials: process.env.CORS_CREDENTIALS === 'true'
    },
    socket: {
        pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT || '60000', 10),
        pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL || '25000', 10),
        maxReconnectionAttempts: parseInt(process.env.SOCKET_MAX_RECONNECTION_ATTEMPTS || '5', 10)
    },
    security: {
        rateLimiting: {
            enabled: process.env.RATE_LIMITING_ENABLED === 'true',
            maxRequests: parseInt(process.env.RATE_LIMITING_MAX_REQUESTS || '100', 10),
            windowMs: parseInt(process.env.RATE_LIMITING_WINDOW_MS || '900000', 10)
        },
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '86400000', 10)
    }
};
exports.gameConfig = {
    maxPlayers: parseInt(process.env.GAME_MAX_PLAYERS || '3', 10),
    minPlayers: parseInt(process.env.GAME_MIN_PLAYERS || '3', 10),
    cardsPerPlayer: parseInt(process.env.GAME_CARDS_PER_PLAYER || '17', 10),
    bottomCards: parseInt(process.env.GAME_BOTTOM_CARDS || '3', 10),
    timeouts: {
        turnTimeout: parseInt(process.env.GAME_TURN_TIMEOUT || '30000', 10),
        gameTimeout: parseInt(process.env.GAME_TIMEOUT || '1800000', 10),
        reconnectTimeout: parseInt(process.env.GAME_RECONNECT_TIMEOUT || '10000', 10)
    },
    rules: {
        allowSpectators: process.env.GAME_ALLOW_SPECTATORS === 'true',
        autoStart: process.env.GAME_AUTO_START === 'true',
        privateRooms: process.env.GAME_PRIVATE_ROOMS === 'true'
    }
};
exports.databaseConfig = {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/doudizhu',
    options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || '10', 10),
        serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT || '5000', 10)
    }
};
exports.redisConfig = {
    enabled: process.env.REDIS_ENABLED === 'true',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'doudizhu:'
};
exports.loggingConfig = {
    level: (process.env.LOG_LEVEL || 'info').toLowerCase(),
    format: process.env.LOG_FORMAT || 'json',
    file: {
        enabled: process.env.LOG_FILE_ENABLED === 'true',
        path: process.env.LOG_FILE_PATH || './logs/app.log',
        maxSize: process.env.LOG_FILE_MAX_SIZE || '20m',
        maxFiles: process.env.LOG_FILE_MAX_FILES || '14d'
    },
    structured: process.env.LOG_STRUCTURED === 'true'
};
exports.monitoringConfig = {
    enabled: process.env.MONITORING_ENABLED === 'true',
    metrics: {
        enabled: process.env.METRICS_ENABLED === 'true',
        port: parseInt(process.env.METRICS_PORT || '9090', 10)
    },
    healthCheck: {
        enabled: process.env.HEALTH_CHECK_ENABLED === 'true',
        path: process.env.HEALTH_CHECK_PATH || '/health',
        interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10)
    }
};
exports.cleanupConfig = {
    intervals: {
        sessions: parseInt(process.env.CLEANUP_SESSIONS_INTERVAL || '300000', 10),
        states: parseInt(process.env.CLEANUP_STATES_INTERVAL || '1800000', 10),
        users: parseInt(process.env.CLEANUP_USERS_INTERVAL || '3600000', 10)
    },
    thresholds: {
        offlineUsers: parseInt(process.env.CLEANUP_OFFLINE_USERS_THRESHOLD || '3600000', 10),
        expiredSessions: parseInt(process.env.CLEANUP_EXPIRED_SESSIONS_THRESHOLD || '86400000', 10),
        emptyRooms: parseInt(process.env.CLEANUP_EMPTY_ROOMS_THRESHOLD || '1800000', 10)
    }
};
exports.pathsConfig = {
    frontend: {
        public: path_1.default.join(process.cwd(), '..', process.env.FRONTEND_PUBLIC_PATH || 'frontend/public'),
        lobby: path_1.default.join(process.cwd(), '..', process.env.FRONTEND_PUBLIC_PATH || 'frontend/public', process.env.LOBBY_PATH || 'lobby'),
        room: path_1.default.join(process.cwd(), '..', process.env.FRONTEND_PUBLIC_PATH || 'frontend/public', process.env.ROOM_PATH || 'room')
    },
    logs: path_1.default.join(process.cwd(), process.env.LOGS_PATH || 'logs'),
    uploads: path_1.default.join(process.cwd(), process.env.UPLOADS_PATH || 'uploads'),
    temp: path_1.default.join(process.cwd(), process.env.TEMP_PATH || 'temp')
};
exports.developmentConfig = {
    debug: {
        reload: process.env.DEBUG_RELOAD === 'true',
        logLevel: (process.env.DEBUG_LOG_LEVEL || 'debug').toLowerCase()
    },
    hotReload: {
        enabled: process.env.HOT_RELOAD_ENABLED === 'true',
        watchPaths: (process.env.HOT_RELOAD_WATCH_PATHS || 'src,config').split(',')
    }
};
exports.config = {
    server: exports.serverConfig,
    game: exports.gameConfig,
    database: exports.databaseConfig,
    redis: exports.redisConfig,
    logging: exports.loggingConfig,
    monitoring: exports.monitoringConfig,
    cleanup: exports.cleanupConfig,
    paths: exports.pathsConfig,
    development: exports.developmentConfig,
    legacy: {
        port: exports.serverConfig.port,
        nodeEnv: process.env.NODE_ENV || 'development',
        version: '1.1.0',
        cors: exports.serverConfig.cors,
        game: {
            maxPlayersPerRoom: exports.gameConfig.maxPlayers,
            roomTimeout: exports.gameConfig.timeouts.turnTimeout,
            maxReconnectTime: exports.gameConfig.timeouts.reconnectTimeout
        },
        database: exports.databaseConfig,
        paths: exports.pathsConfig
    }
};
exports.default = exports.config;
//# sourceMappingURL=index.js.map