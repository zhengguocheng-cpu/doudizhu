export declare const GAME_CONSTANTS: {
    readonly MAX_PLAYERS_PER_ROOM: 3;
    readonly MIN_PLAYERS_PER_ROOM: 3;
    readonly TOTAL_CARDS: 54;
    readonly CARDS_PER_PLAYER: 17;
    readonly BOTTOM_CARDS: 3;
    readonly GAME_STATUS: {
        readonly WAITING: "waiting";
        readonly READY: "ready";
        readonly PLAYING: "playing";
        readonly PAUSED: "paused";
        readonly FINISHED: "finished";
    };
    readonly ROOM_STATUS: {
        readonly OPEN: "open";
        readonly FULL: "full";
        readonly IN_GAME: "in_game";
        readonly CLOSED: "closed";
    };
    readonly USER_STATUS: {
        readonly OFFLINE: "offline";
        readonly ONLINE: "online";
        readonly IN_GAME: "in_game";
        readonly AWAY: "away";
    };
    readonly TIMEOUTS: {
        readonly TURN_TIMEOUT: number;
        readonly GAME_TIMEOUT: number;
        readonly RECONNECT_TIMEOUT: number;
        readonly CLEANUP_INTERVAL: number;
    };
    readonly SOCKET_EVENTS: {
        readonly AUTHENTICATE: "authenticate";
        readonly RECONNECT_USER: "reconnect_user";
        readonly AUTHENTICATED: "authenticated";
        readonly JOIN_GAME: "join_game";
        readonly LEAVE_GAME: "leave_game";
        readonly PLAYER_READY: "player_ready";
        readonly GRAB_LANDLORD: "grab_landlord";
        readonly PLAY_CARDS: "play_cards";
        readonly PASS_TURN: "pass_turn";
        readonly ROOM_JOINED: "room_joined";
        readonly PLAYER_JOINED: "player_joined";
        readonly PLAYER_LEFT: "player_left";
        readonly ROOM_UPDATED: "room_updated";
        readonly GAME_STARTED: "game_started";
        readonly GAME_STATE_UPDATED: "game_state_updated";
        readonly LANDLORD_SELECTED: "landlord_selected";
        readonly CARDS_DEALT: "cards_dealt";
        readonly CARDS_PLAYED: "cards_played";
        readonly TURN_CHANGED: "turn_changed";
        readonly GAME_ENDED: "game_ended";
        readonly SEND_MESSAGE: "send_message";
        readonly MESSAGE_RECEIVED: "message_received";
        readonly ERROR: "error";
        readonly DISCONNECT: "disconnect";
    };
    readonly ERROR_CODES: {
        readonly AUTH_REQUIRED: "AUTH_REQUIRED";
        readonly AUTH_FAILED: "AUTH_FAILED";
        readonly SESSION_EXPIRED: "SESSION_EXPIRED";
        readonly ROOM_NOT_FOUND: "ROOM_NOT_FOUND";
        readonly ROOM_FULL: "ROOM_FULL";
        readonly GAME_NOT_STARTED: "GAME_NOT_STARTED";
        readonly NOT_YOUR_TURN: "NOT_YOUR_TURN";
        readonly INVALID_CARDS: "INVALID_CARDS";
        readonly SERVER_ERROR: "SERVER_ERROR";
        readonly VALIDATION_ERROR: "VALIDATION_ERROR";
        readonly RATE_LIMITED: "RATE_LIMITED";
    };
};
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
};
export declare const DATABASE: {
    readonly COLLECTIONS: {
        readonly USERS: "users";
        readonly SESSIONS: "sessions";
        readonly ROOMS: "rooms";
        readonly GAMES: "games";
        readonly LOGS: "logs";
    };
    readonly OPERATIONS: {
        readonly CREATE: "create";
        readonly READ: "read";
        readonly UPDATE: "update";
        readonly DELETE: "delete";
    };
};
export declare const API: {
    readonly PREFIX: "/api";
    readonly VERSION: "/v1";
    readonly ROUTES: {
        readonly GAMES: "/games";
        readonly USERS: "/users";
        readonly ROOMS: "/rooms";
        readonly HEALTH: "/health";
        readonly METRICS: "/metrics";
    };
    readonly RATE_LIMITS: {
        readonly AUTH: {
            readonly max: 5;
            readonly windowMs: number;
        };
        readonly GAME: {
            readonly max: 100;
            readonly windowMs: number;
        };
        readonly CHAT: {
            readonly max: 30;
            readonly windowMs: number;
        };
    };
};
export declare const LOGGING: {
    readonly LEVELS: {
        readonly ERROR: 0;
        readonly WARN: 1;
        readonly INFO: 2;
        readonly DEBUG: 3;
        readonly TRACE: 4;
    };
    readonly CATEGORIES: {
        readonly AUTH: "auth";
        readonly GAME: "game";
        readonly ROOM: "room";
        readonly SOCKET: "socket";
        readonly SYSTEM: "system";
        readonly PERFORMANCE: "performance";
    };
};
export declare const CLEANUP: {
    readonly THRESHOLDS: {
        readonly OFFLINE_USERS: number;
        readonly EXPIRED_SESSIONS: number;
        readonly EMPTY_ROOMS: number;
        readonly OLD_LOGS: number;
    };
    readonly BATCH_SIZE: 100;
    readonly CONCURRENCY: 5;
};
export declare const VALIDATION: {
    readonly USERNAME: {
        readonly MIN_LENGTH: 2;
        readonly MAX_LENGTH: 20;
        readonly PATTERN: RegExp;
    };
    readonly ROOM_ID: {
        readonly MIN_LENGTH: 1;
        readonly MAX_LENGTH: 50;
        readonly PATTERN: RegExp;
    };
    readonly MESSAGE: {
        readonly MAX_LENGTH: 200;
        readonly PATTERN: RegExp;
    };
};
export declare const ENV_DEFAULTS: {
    readonly NODE_ENV: "development";
    readonly PORT: "3000";
    readonly HOST: "localhost";
    readonly LOG_LEVEL: "info";
    readonly LOG_FORMAT: "json";
    readonly SESSION_TIMEOUT: number;
    readonly CLEANUP_INTERVAL: number;
    readonly METRICS_PORT: "9090";
};
//# sourceMappingURL=index.d.ts.map