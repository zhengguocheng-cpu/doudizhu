import express from 'express';
import { Application } from './src/app';

const app = new Application();

// 错误处理中间件
app.getApp().use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('全局错误处理:', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '未知错误'
  });
});

// 404处理中间件 - 放在所有路由之后
app.getApp().use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
    path: req.originalUrl,
    availableEndpoints: [
      'GET /',
      'GET /test.html',
      'GET /health',
      'GET /info',
      'GET /api',
      'GET /css/style.css',
      'GET /js/client.js',
      'GET /api/games/rooms',
      'POST /api/games/rooms',
      'GET /api/games/rooms/:roomId',
      'POST /api/games/rooms/:roomId/join',
      'POST /api/games/rooms/:roomId/ready'
    ]
  });
});

// 优雅关闭处理
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务器...');
  process.exit(0);
});

// 启动服务器
app.start();