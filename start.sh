#!/bin/bash

# 斗地主游戏项目启动脚本

echo "🚀 启动斗地主游戏服务器..."
echo "📍 服务器启动文件: backend/server.ts"
echo "🔧 启动模式: 开发模式 (TypeScript直接运行)"
echo ""
echo "💡 可用启动选项:"
echo "  1. 普通开发模式 (npm run dev)"
echo "  2. 🔥 热重载开发模式 (npm run dev:watch) - 推荐"
echo "  3. 🐛 调试模式 (npm run dev:debug)"
echo ""

# 检查是否在正确的目录
if [ ! -d "backend" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    echo "📂 当前目录: $(pwd)"
    echo "💡 建议: cd 到包含backend文件夹的目录"
    exit 1
fi

# 进入后端目录
cd backend

# 检查package.json是否存在
if [ ! -f "package.json" ]; then
    echo "❌ 错误: backend/package.json 文件不存在"
    exit 1
fi

# 检查node_modules是否存在
if [ ! -d "node_modules" ]; then
    echo "📦 安装项目依赖..."
    npm install
fi

echo "✅ 启动开发服务器..."
echo "🌐 访问地址: http://localhost:3000"
echo "📱 大厅页面: http://localhost:3000/lobby/"
echo "🎮 房间页面: http://localhost:3000/room/"
echo "🔥 热重载: 修改文件自动重启服务器"
echo ""

# 启动热重载开发服务器（推荐）
npm run dev:watch
