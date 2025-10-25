"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV_DEFAULTS = exports.VALIDATION = exports.CLEANUP = exports.LOGGING = exports.API = exports.DATABASE = exports.HTTP_STATUS = exports.GAME_CONSTANTS = void 0;
exports.GAME_CONSTANTS = {
    MAX_PLAYERS_PER_ROOM: 3,
    MIN_PLAYERS_PER_ROOM: 3,
    TOTAL_CARDS: 54,
    CARDS_PER_PLAYER: 17,
    BOTTOM_CARDS: 3,
    GAME_STATUS: {
        WAITING: 'waiting',
        READY: 'ready',
        PLAYING: 'playing',
        PAUSED: 'paused',
        FINISHED: 'finished'
    },
    ROOM_STATUS: {
        OPEN: 'open',
        FULL: 'full',
        IN_GAME: 'in_game',
        CLOSED: 'closed'
    },
    USER_STATUS: {
        OFFLINE: 'offline',
        ONLINE: 'online',
        IN_GAME: 'in_game',
        AWAY: 'away'
    },
    TIMEOUTS: {
        TURN_TIMEOUT: 30 * 1000,
        GAME_TIMEOUT: 30 * 60 * 1000,
        RECONNECT_TIMEOUT: 10 * 1000,
        CLEANUP_INTERVAL: 5 * 60 * 1000
    },
    SOCKET_EVENTS: {
        AUTHENTICATE: 'authenticate',
        RECONNECT_USER: 'reconnect_user',
        AUTHENTICATED: 'authenticated',
        JOIN_GAME: 'join_game',
        LEAVE_GAME: 'leave_game',
        PLAYER_READY: 'player_ready',
        GRAB_LANDLORD: 'grab_landlord',
        PLAY_CARDS: 'play_cards',
        PASS_TURN: 'pass_turn',
        ROOM_JOINED: 'room_joined',
        PLAYER_JOINED: 'player_joined',
        PLAYER_LEFT: 'player_left',
        ROOM_UPDATED: 'room_updated',
        GAME_STARTED: 'game_started',
        GAME_STATE_UPDATED: 'game_state_updated',
        LANDLORD_SELECTED: 'landlord_selected',
        CARDS_DEALT: 'cards_dealt',
        CARDS_PLAYED: 'cards_played',
        TURN_CHANGED: 'turn_changed',
        GAME_ENDED: 'game_ended',
        SEND_MESSAGE: 'send_message',
        MESSAGE_RECEIVED: 'message_received',
        ERROR: 'error',
        DISCONNECT: 'disconnect'
    },
    ERROR_CODES: {
        AUTH_REQUIRED: 'AUTH_REQUIRED',
        AUTH_FAILED: 'AUTH_FAILED',
        SESSION_EXPIRED: 'SESSION_EXPIRED',
        ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
        ROOM_FULL: 'ROOM_FULL',
        GAME_NOT_STARTED: 'GAME_NOT_STARTED',
        NOT_YOUR_TURN: 'NOT_YOUR_TURN',
        INVALID_CARDS: 'INVALID_CARDS',
        SERVER_ERROR: 'SERVER_ERROR',
        VALIDATION_ERROR: 'VALIDATION_ERROR',
        RATE_LIMITED: 'RATE_LIMITED'
    }
};
exports.HTTP_STATUS = {
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
};
exports.DATABASE = {
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
};
exports.API = {
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
        AUTH: { max: 5, windowMs: 15 * 60 * 1000 },
        GAME: { max: 100, windowMs: 60 * 1000 },
        CHAT: { max: 30, windowMs: 60 * 1000 }
    }
};
exports.LOGGING = {
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
};
exports.CLEANUP = {
    THRESHOLDS: {
        OFFLINE_USERS: 60 * 60 * 1000,
        EXPIRED_SESSIONS: 24 * 60 * 60 * 1000,
        EMPTY_ROOMS: 30 * 60 * 1000,
        OLD_LOGS: 7 * 24 * 60 * 60 * 1000
    },
    BATCH_SIZE: 100,
    CONCURRENCY: 5
};
exports.VALIDATION = {
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
        PATTERN: /^[\s\S]*$/
    }
};
exports.ENV_DEFAULTS = {
    NODE_ENV: 'development',
    PORT: '3000',
    HOST: 'localhost',
    LOG_LEVEL: 'info',
    LOG_FORMAT: 'json',
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000,
    CLEANUP_INTERVAL: 5 * 60 * 1000,
    METRICS_PORT: '9090'
};
//# sourceMappingURL=index.js.map