import express from 'express';
import { config } from './src/config';
import Application from './src/app';

const app = new Application();

// 全局错误处理中间件
app.getApp().use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('全局错误处理:', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    message: config.legacy.nodeEnv === 'development' ? err.message : '未知错误'
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