import Application from './src/app';

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
(async () => {
  try {
    const app = new Application();
    await app.start();
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
})();