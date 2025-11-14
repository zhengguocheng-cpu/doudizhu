const path = require('path');
const backendConfig = require('./backend/jest.config');

// 根目录 Jest 配置：只跑 backend/src 下的测试，避免把 backend/test/test.ts 当成 Jest 测试
module.exports = {
  ...backendConfig,
  // 将 Jest 的根目录指向 backend，这样 backend/jest.config.js 里的 <rootDir> 仍然指向 backend
  rootDir: path.resolve(__dirname, 'backend'),
};
