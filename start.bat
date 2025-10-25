@echo off
REM 斗地主游戏项目启动脚本 (Windows版本)

echo 🚀 启动斗地主游戏服务器...
echo 📍 服务器启动文件: backend/server.ts
echo 🔧 启动模式: 开发模式 (TypeScript直接运行)
echo.
echo 💡 可用启动选项:
echo   1. 普通开发模式 (npm run dev)
echo   2. 🔥 热重载开发模式 (npm run dev:watch) - 推荐
echo   3. 🐛 调试模式 (npm run dev:debug)
echo.

REM 检查是否在正确的目录
if not exist "backend" (
    echo ❌ 错误: 请在项目根目录运行此脚本
    echo 📂 当前目录: %cd%
    echo 💡 建议: cd 到包含backend文件夹的目录
    pause
    exit /b 1
)

REM 进入后端目录
cd backend

REM 检查package.json是否存在
if not exist "package.json" (
    echo ❌ 错误: backend/package.json 文件不存在
    pause
    exit /b 1
)

REM 检查node_modules是否存在
if not exist "node_modules" (
    echo 📦 安装项目依赖...
    npm install
)

echo ✅ 启动开发服务器...
echo 🌐 访问地址: http://localhost:3000
echo 📱 大厅页面: http://localhost:3000/lobby/
echo 🎮 房间页面: http://localhost:3000/room/
echo 🔥 热重载: 修改文件自动重启服务器
echo.

REM 启动热重载开发服务器（推荐）
npm run dev:watch
