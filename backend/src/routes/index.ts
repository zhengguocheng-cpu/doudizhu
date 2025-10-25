import express from 'express';
import path from 'path';
import config from '../config';

const router = express.Router();

// 首页路由
router.get('/', (req, res) => {
  // 方法1: 直接返回HTML文件（推荐，避免404问题）
  // res.sendFile(config.paths.frontend.lobby + '/index.html');

  // 方法2: 由于已经设置了静态文件服务，也可以直接重定向
  res.redirect('/lobby/');

  // 方法3: 或者直接返回HTML内容（如果需要动态内容）
  // res.sendFile(path.join(config.paths.frontend.lobby, 'index.html'));
});

// 健康检查路由
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    environment: config.legacy.nodeEnv
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
      maxPlayersPerRoom: config.game.maxPlayers,
      corsOrigin: config.server.cors.origin
    }
  });
});

// 大厅页面路由
router.get('/lobby/', (req, res) => {
  res.sendFile(config.paths.frontend.lobby + '/index.html');
});

// 房间页面路由
router.get('/room/', (req, res) => {
  res.sendFile(config.paths.frontend.room + '/index.html');
});

export default router;
