#!/bin/bash

# 斗地主项目统一部署脚本
# 一次性部署前端（frontend-spa）和后端（backend）

set -e  # 遇到错误立即退出

echo "🚀 开始部署斗地主项目..."
echo "================================"

# ========== 后端部署 ==========
echo ""
echo "📦 [1/2] 部署后端 (backend)..."
cd backend

echo "  ├─ 检查 npm 版本: $(npm -v)"
echo "  ├─ 安装依赖 (npm ci)..."
npm ci

echo "  ├─ 构建项目..."
npm run build

echo "  └─ 后端构建完成 ✅"

# 检查 package-lock.json 是否被修改
if ! git diff --quiet package-lock.json 2>/dev/null; then
  echo "  ⚠️  警告：backend/package-lock.json 被修改"
fi

cd ..

# ========== 前端部署 ==========
echo ""
echo "🎨 [2/2] 部署前端 (frontend-spa)..."
cd frontend-spa

echo "  ├─ 检查 npm 版本: $(npm -v)"
echo "  ├─ 安装依赖 (npm ci)..."
npm ci

echo "  ├─ 构建项目..."
npm run build

echo "  └─ 前端构建完成 ✅"

# 检查 package-lock.json 是否被修改
if ! git diff --quiet package-lock.json 2>/dev/null; then
  echo "  ⚠️  警告：frontend-spa/package-lock.json 被修改"
fi

cd ..

# ========== 部署完成 ==========
echo ""
echo "================================"
echo "🎉 部署完成！"
echo ""
echo "📁 构建产物位置："
echo "  - 后端: backend/dist/"
echo "  - 前端: frontend-spa/dist/"
echo ""
echo "🔧 后续操作："
echo "  - 启动后端: cd backend && npm start"
echo "  - 或使用 PM2: pm2 restart doudizhu-backend"
echo ""
