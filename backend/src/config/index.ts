export const config = {
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true
  },
  game: {
    maxPlayersPerRoom: 3,
    roomTimeout: 30000, // 30秒
    maxReconnectTime: 10000 // 10秒
  },
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/doudizhu'
  }
};

export default config;
