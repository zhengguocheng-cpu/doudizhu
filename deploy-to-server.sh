#!/bin/bash

# 斗地主游戏自动部署脚本
# 服务器: 43.153.37.62
# 域名: www.games365.fun

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 服务器信息
SERVER_IP="43.153.37.62"
SERVER_USER="root"
PROJECT_DIR="/var/www/doudizhu"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  斗地主游戏部署脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 步骤1：检查本地环境
echo -e "${YELLOW}[1/8] 检查本地环境...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未安装Node.js${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js 已安装: $(node -v)${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}错误: 未安装npm${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm 已安装: $(npm -v)${NC}"
echo ""

# 步骤2：编译后端
echo -e "${YELLOW}[2/8] 编译后端代码...${NC}"
cd backend
npm install
npm run build
echo -e "${GREEN}✓ 后端编译完成${NC}"
cd ..
echo ""

# 步骤3：打包项目
echo -e "${YELLOW}[3/8] 打包项目文件...${NC}"
tar -czf doudizhu.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='backend/logs' \
    backend frontend
echo -e "${GREEN}✓ 项目打包完成${NC}"
echo ""

# 步骤4：上传到服务器
echo -e "${YELLOW}[4/8] 上传到服务器...${NC}"
scp doudizhu.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/
echo -e "${GREEN}✓ 上传完成${NC}"
echo ""

# 步骤5：在服务器上解压和部署
echo -e "${YELLOW}[5/8] 在服务器上部署...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
set -e

# 创建项目目录
sudo mkdir -p /var/www/doudizhu
cd /var/www/doudizhu

# 备份旧版本
if [ -d "backend" ]; then
    echo "备份旧版本..."
    sudo tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz backend frontend 2>/dev/null || true
fi

# 解压新版本
echo "解压新版本..."
sudo tar -xzf /tmp/doudizhu.tar.gz -C /var/www/doudizhu/

# 安装后端依赖
echo "安装后端依赖..."
cd backend
sudo npm install --production

# 清理
rm /tmp/doudizhu.tar.gz

echo "✓ 服务器部署完成"
ENDSSH
echo -e "${GREEN}✓ 服务器部署完成${NC}"
echo ""

# 步骤6：重启后端服务
echo -e "${YELLOW}[6/8] 重启后端服务...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /var/www/doudizhu/backend

# 使用PM2重启
if command -v pm2 &> /dev/null; then
    pm2 restart doudizhu-backend || pm2 start ecosystem.config.js
    pm2 save
    echo "✓ PM2服务重启成功"
else
    echo "警告: PM2未安装，请手动启动后端"
fi
ENDSSH
echo -e "${GREEN}✓ 后端服务重启完成${NC}"
echo ""

# 步骤7：重启Nginx
echo -e "${YELLOW}[7/8] 重启Nginx...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
sudo systemctl restart nginx
echo "✓ Nginx重启成功"
ENDSSH
echo -e "${GREEN}✓ Nginx重启完成${NC}"
echo ""

# 步骤8：清理本地临时文件
echo -e "${YELLOW}[8/8] 清理临时文件...${NC}"
rm -f doudizhu.tar.gz
echo -e "${GREEN}✓ 清理完成${NC}"
echo ""

# 完成
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  部署成功！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "访问地址:"
echo -e "  HTTP:  ${YELLOW}http://www.games365.fun${NC}"
echo -e "  HTTPS: ${YELLOW}https://www.games365.fun${NC}"
echo ""
echo -e "查看日志:"
echo -e "  ${YELLOW}ssh ${SERVER_USER}@${SERVER_IP} 'pm2 logs doudizhu-backend'${NC}"
echo ""
