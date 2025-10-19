import express from 'express';
import config from '../config';

const router = express.Router();

// 首页路由
router.get('/', (req, res) => {
  res.json({
    message: '斗地主游戏服务器运行中',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.server.nodeEnv
  });
});

// 健康检查路由
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    environment: config.server.nodeEnv
  });
});

// 服务器信息路由
router.get('/info', (req, res) => {
  res.json({
    name: '斗地主游戏服务器',
    version: '1.0.0',
    description: '支持多人在线斗地主游戏的后端服务器',
    features: [
      '实时多人游戏',
      '房间管理',
      '游戏逻辑处理',
      'WebSocket通信'
    ],
    config: {
      port: config.server.port,
      maxPlayersPerRoom: config.game.maxPlayersPerRoom,
      corsOrigin: config.cors.origin
    }
  });
});

export default router;
