@echo off
echo 🔥 斗地主游戏热重载开发环境演示
echo ==================================
echo.

echo 📋 可用命令：
echo   npm run dev:watch    - 热重载开发模式
echo   npm run dev:debug    - 调试模式
echo   npm run dev          - 普通开发模式
echo   npm run dev:nodemon  - 使用nodemon配置
echo.

echo 🎯 热重载特性：
echo   ✅ 自动监听 src/ 目录下所有 .ts 文件
echo   ✅ 监听 server.ts 入口文件
echo   ✅ 监听 .env 配置文件
echo   ✅ 忽略 node_modules/ 和 dist/ 目录
echo   ✅ 500ms 延迟重启，避免频繁重启
echo   ✅ 彩色控制台输出
echo   ✅ 详细重启日志
echo.

echo 🚀 启动热重载开发模式：
echo   cd backend ^&^& npm run dev:watch
echo.

echo 💡 开发工作流程：
echo   1. 启动: npm run dev:watch
echo   2. 修改: 编辑任何 .ts 文件
echo   3. 自动: nodemon检测变化并重启
echo   4. 查看: 浏览器刷新查看效果
echo.

echo 🐛 VS Code集成：
echo   1. 按 F5 启动调试
echo   2. 修改文件自动重启
echo   3. 设置断点调试代码
echo.

echo 📝 手动重启命令：
echo   在nodemon运行时按 'rs' + Enter
echo   或发送 SIGHUP 信号
echo.

echo 🎉 开始开发吧！
pause
