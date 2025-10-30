# 斗地主游戏部署指南

## 📋 目录
1. [部署前准备](#部署前准备)
2. [方案1：云服务器部署（推荐）](#方案1云服务器部署推荐)
3. [方案2：Docker容器化部署](#方案2docker容器化部署)
4. [方案3：Serverless部署](#方案3serverless部署)
5. [域名配置](#域名配置)
6. [SSL证书配置](#ssl证书配置)
7. [监控和维护](#监控和维护)

---

## 部署前准备

### 1. 环境要求
- **Node.js**: v16.x 或更高
- **npm**: v8.x 或更高
- **服务器**: 1核2G内存（最低配置）
- **操作系统**: Ubuntu 20.04 / CentOS 7+ / Windows Server

### 2. 检查项目
```bash
# 确保所有依赖已安装
cd backend && npm install
cd ../frontend && npm install

# 确保后端可以编译
cd backend && npm run build

# 确保没有TypeScript错误
cd backend && npx tsc --noEmit
```

### 3. 准备生产环境配置
- [ ] 修改后端端口（如果需要）
- [ ] 配置CORS允许的域名
- [ ] 准备域名（可选）
- [ ] 准备SSL证书（可选，但推荐）

---

## 方案1：云服务器部署（推荐）

### 适用场景
- 第一次部署上线
- 预算有限（¥50-100/月）
- 需要完全控制服务器

### 步骤1：购买云服务器

#### 阿里云ECS
1. 访问 [阿里云ECS](https://www.aliyun.com/product/ecs)
2. 选择配置：
   - **CPU**: 1核或2核
   - **内存**: 2GB（推荐）或4GB
   - **带宽**: 1Mbps（够用）或3Mbps（更流畅）
   - **系统**: Ubuntu 20.04 LTS
3. 购买时长：建议先买1个月测试

#### 腾讯云CVM
1. 访问 [腾讯云CVM](https://cloud.tencent.com/product/cvm)
2. 配置同上
3. 新用户有优惠活动

### 步骤2：连接服务器

#### Windows用户
```bash
# 使用PowerShell或下载PuTTY
ssh root@your_server_ip
```

#### Mac/Linux用户
```bash
ssh root@your_server_ip
```

### 步骤3：安装环境

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node -v  # 应该显示 v18.x.x
npm -v   # 应该显示 9.x.x

# 安装Git
sudo apt install -y git

# 安装PM2（进程管理器）
sudo npm install -g pm2

# 安装Nginx（Web服务器）
sudo apt install -y nginx
```

### 步骤4：上传代码

#### 方法A：使用Git（推荐）
```bash
# 在服务器上
cd /var/www
sudo git clone https://github.com/your-username/doudizhu.git
cd doudizhu

# 如果是私有仓库，需要配置SSH密钥
```

#### 方法B：使用SCP上传
```bash
# 在本地电脑上
cd e:\windsurf_prj
scp -r doudizhu root@your_server_ip:/var/www/
```

### 步骤5：配置后端

```bash
# 在服务器上
cd /var/www/doudizhu/backend

# 安装依赖
npm install --production

# 编译TypeScript
npm run build

# 创建PM2配置文件
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'doudizhu-backend',
    script: './dist/src/app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# 启动后端
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 步骤6：配置Nginx（前端）

```bash
# 创建Nginx配置
sudo nano /etc/nginx/sites-available/doudizhu

# 粘贴以下内容：
server {
    listen 80;
    server_name your_domain.com;  # 改成你的域名，或者服务器IP

    # 前端静态文件
    location / {
        root /var/www/doudizhu/frontend/public;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端API代理
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 反馈API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# 启用配置
sudo ln -s /etc/nginx/sites-available/doudizhu /etc/nginx/sites-enabled/
sudo nginx -t  # 测试配置
sudo systemctl restart nginx
```

### 步骤7：配置防火墙

```bash
# 允许HTTP和HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH
sudo ufw enable
```

### 步骤8：测试访问

```
http://your_server_ip
```

---

## 方案2：Docker容器化部署

### 优点
- 环境一致，避免"在我机器上能跑"问题
- 易于迁移和扩展
- 专业部署方式

### 步骤1：创建Dockerfile

#### 后端Dockerfile
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 编译TypeScript
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/src/app.js"]
```

#### 前端Dockerfile
```dockerfile
# frontend/Dockerfile
FROM nginx:alpine

# 复制静态文件
COPY public /usr/share/nginx/html

# 复制Nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

### 步骤2：创建docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    container_name: doudizhu-backend
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    networks:
      - doudizhu-network

  frontend:
    build: ./frontend
    container_name: doudizhu-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - doudizhu-network

networks:
  doudizhu-network:
    driver: bridge
```

### 步骤3：部署

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

---

## 方案3：Serverless部署

### 前端部署到Vercel

1. **安装Vercel CLI**
```bash
npm install -g vercel
```

2. **部署前端**
```bash
cd frontend
vercel --prod
```

3. **配置vercel.json**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "public/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ]
}
```

### 后端部署到Railway

1. 访问 [Railway.app](https://railway.app)
2. 连接GitHub仓库
3. 选择backend目录
4. 自动部署

---

## 域名配置

### 1. 购买域名
- 阿里云：https://wanwang.aliyun.com
- 腾讯云：https://dnspod.cloud.tencent.com
- GoDaddy：https://www.godaddy.com

### 2. 配置DNS解析

```
类型    主机记录    记录值
A       @          your_server_ip
A       www        your_server_ip
```

### 3. 等待DNS生效（10分钟-24小时）

---

## SSL证书配置（HTTPS）

### 使用Let's Encrypt免费证书

```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your_domain.com -d www.your_domain.com

# 自动续期
sudo certbot renew --dry-run
```

### Nginx配置会自动更新为HTTPS

---

## 监控和维护

### 1. 查看后端日志
```bash
pm2 logs doudizhu-backend
```

### 2. 重启服务
```bash
pm2 restart doudizhu-backend
```

### 3. 监控资源使用
```bash
pm2 monit
```

### 4. 设置日志轮转
```bash
pm2 install pm2-logrotate
```

### 5. 备份数据
```bash
# 定期备份代码和配置
tar -czf backup-$(date +%Y%m%d).tar.gz /var/www/doudizhu
```

---

## 常见问题

### Q1: 无法访问网站
- 检查防火墙：`sudo ufw status`
- 检查Nginx状态：`sudo systemctl status nginx`
- 检查后端状态：`pm2 status`

### Q2: Socket.IO连接失败
- 检查CORS配置
- 检查Nginx WebSocket代理配置
- 查看浏览器控制台错误

### Q3: 内存不足
- 升级服务器配置
- 或使用PM2集群模式

---

## 性能优化建议

1. **启用Gzip压缩**（Nginx配置）
2. **使用CDN**加速静态资源
3. **配置缓存策略**
4. **监控服务器资源**
5. **定期更新依赖**

---

## 安全建议

1. ✅ 使用HTTPS
2. ✅ 定期更新系统和依赖
3. ✅ 配置防火墙
4. ✅ 使用强密码
5. ✅ 定期备份数据
6. ✅ 限制SSH登录（禁用root登录）

---

## 下一步

部署完成后，你可以：
- 🎮 邀请朋友测试游戏
- 📊 添加访问统计
- 🐛 收集用户反馈
- 🚀 持续优化和迭代

祝部署顺利！🎉
