import { ServerConfig, GameConfig } from '../types';
export declare const serverConfig: ServerConfig;
export declare const gameConfig: GameConfig;
export declare const databaseConfig: {
    url: string;
    options: {
        useNewUrlParser: boolean;
        useUnifiedTopology: boolean;
        maxPoolSize: number;
        serverSelectionTimeoutMS: number;
    };
};
export declare const redisConfig: {
    enabled: boolean;
    host: string;
    port: number;
    password: string | undefined;
    db: number;
    keyPrefix: string;
};
export declare const loggingConfig: {
    level: "error" | "warn" | "info" | "debug";
    format: string;
    file: {
        enabled: boolean;
        path: string;
        maxSize: string;
        maxFiles: string;
    };
    structured: boolean;
};
export declare const monitoringConfig: {
    enabled: boolean;
    metrics: {
        enabled: boolean;
        port: number;
    };
    healthCheck: {
        enabled: boolean;
        path: string;
        interval: number;
    };
};
export declare const cleanupConfig: {
    intervals: {
        sessions: number;
        states: number;
        users: number;
    };
    thresholds: {
        offlineUsers: number;
        expiredSessions: number;
        emptyRooms: number;
    };
};
export declare const pathsConfig: {
    frontend: {
        public: string;
        lobby: string;
        room: string;
    };
    logs: string;
    uploads: string;
    temp: string;
};
export declare const developmentConfig: {
    debug: {
        reload: boolean;
        logLevel: string;
    };
    hotReload: {
        enabled: boolean;
        watchPaths: string[];
    };
};
export declare const config: {
    server: ServerConfig;
    game: GameConfig;
    database: {
        url: string;
        options: {
            useNewUrlParser: boolean;
            useUnifiedTopology: boolean;
            maxPoolSize: number;
            serverSelectionTimeoutMS: number;
        };
    };
    redis: {
        enabled: boolean;
        host: string;
        port: number;
        password: string | undefined;
        db: number;
        keyPrefix: string;
    };
    logging: {
        level: "error" | "warn" | "info" | "debug";
        format: string;
        file: {
            enabled: boolean;
            path: string;
            maxSize: string;
            maxFiles: string;
        };
        structured: boolean;
    };
    monitoring: {
        enabled: boolean;
        metrics: {
            enabled: boolean;
            port: number;
        };
        healthCheck: {
            enabled: boolean;
            path: string;
            interval: number;
        };
    };
    cleanup: {
        intervals: {
            sessions: number;
            states: number;
            users: number;
        };
        thresholds: {
            offlineUsers: number;
            expiredSessions: number;
            emptyRooms: number;
        };
    };
    paths: {
        frontend: {
            public: string;
            lobby: string;
            room: string;
        };
        logs: string;
        uploads: string;
        temp: string;
    };
    development: {
        debug: {
            reload: boolean;
            logLevel: string;
        };
        hotReload: {
            enabled: boolean;
            watchPaths: string[];
        };
    };
    legacy: {
        port: number;
        nodeEnv: string;
        version: string;
        cors: {
            origin: string | string[];
            credentials: boolean;
        };
        game: {
            maxPlayersPerRoom: number;
            roomTimeout: number;
            maxReconnectTime: number;
        };
        database: {
            url: string;
            options: {
                useNewUrlParser: boolean;
                useUnifiedTopology: boolean;
                maxPoolSize: number;
                serverSelectionTimeoutMS: number;
            };
        };
        paths: {
            frontend: {
                public: string;
                lobby: string;
                room: string;
            };
            logs: string;
            uploads: string;
            temp: string;
        };
    };
};
export default config;
//# sourceMappingURL=index.d.ts.map