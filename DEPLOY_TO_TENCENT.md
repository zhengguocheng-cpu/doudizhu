# 部署到腾讯云服务器

## 📋 服务器信息
- **IP地址**: 43.153.37.62
- **域名**: www.games365.fun
- **平台**: 腾讯云

---

## 🚀 快速部署步骤

### 第一步：连接服务器

```bash
# 使用SSH连接（Windows PowerShell或Mac终端）
ssh root@43.153.37.62

# 如果提示输入密码，输入你的服务器密码
```

### 第二步：安装必要软件

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node -v  # 应该显示 v18.x.x
npm -v   # 应该显示 9.x.x

# 安装PM2（进程管理器）
sudo npm install -g pm2

# 安装Nginx
sudo apt install -y nginx

# 安装Git
sudo apt install -y git
```

### 第三步：上传代码

#### 方法A：使用Git（推荐）

```bash
# 创建项目目录
sudo mkdir -p /var/www
cd /var/www

# 如果你的代码在GitHub上
sudo git clone https://github.com/your-username/doudizhu.git

# 如果是私有仓库，需要先配置SSH密钥
```

#### 方法B：从本地上传（如果没有Git仓库）

在你的**本地电脑**上打开PowerShell：

```powershell
# 进入项目目录
cd e:\windsurf_prj

# 压缩项目（排除node_modules）
# 先手动删除或排除以下文件夹：
# - backend/node_modules
# - frontend/node_modules
# - backend/dist
# - .git

# 使用SCP上传（需要先压缩）
scp -r doudizhu root@43.153.37.62:/var/www/
```

### 第四步：安装后端依赖并启动

```bash
# 进入后端目录
cd /var/www/doudizhu/backend

# 安装依赖
npm install

# 编译TypeScript
npm run build

# 使用PM2启动后端
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 设置开机自启
pm2 save
pm2 startup

# 查看日志（确认启动成功）
pm2 logs doudizhu-backend
```

### 第五步：配置Nginx

```bash
# 创建Nginx配置文件
sudo nano /etc/nginx/sites-available/doudizhu

# 粘贴以下内容（复制整个配置）：
```

```nginx
server {
    listen 80;
    server_name www.games365.fun games365.fun 43.153.37.62;

    # 前端静态文件
    root /var/www/doudizhu/frontend/public;
    index index.html;

    # 启用Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
    }

    # Socket.IO WebSocket代理
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket支持
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # 代理头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # API代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

```bash
# 保存文件（Ctrl+X, 然后Y, 然后Enter）

# 启用配置
sudo ln -s /etc/nginx/sites-available/doudizhu /etc/nginx/sites-enabled/

# 删除默认配置（可选）
sudo rm /etc/nginx/sites-enabled/default

# 测试Nginx配置
sudo nginx -t

# 如果显示"test is successful"，重启Nginx
sudo systemctl restart nginx
```

### 第六步：配置防火墙

```bash
# 允许HTTP和HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH（重要！）

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status
```

### 第七步：配置域名DNS

1. 登录腾讯云控制台
2. 进入 **云解析DNS**
3. 找到域名 `games365.fun`
4. 添加/修改以下记录：

```
记录类型    主机记录    记录值
A          @          43.153.37.62
A          www        43.153.37.62
```

5. 等待DNS生效（通常5-10分钟）

### 第八步：测试访问

```bash
# 在浏览器中访问
http://www.games365.fun
http://43.153.37.62

# 如果无法访问，检查：
# 1. 后端是否运行
pm2 status

# 2. Nginx是否运行
sudo systemctl status nginx

# 3. 防火墙是否开放
sudo ufw status

# 4. 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log

# 5. 查看后端日志
pm2 logs doudizhu-backend
```

---

## 🔒 配置HTTPS（强烈推荐）

### 使用Let's Encrypt免费SSL证书

```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书（会自动配置Nginx）
sudo certbot --nginx -d games365.fun -d www.games365.fun

# 按提示输入邮箱
# 选择是否重定向HTTP到HTTPS（推荐选Yes）

# 测试自动续期
sudo certbot renew --dry-run

# 设置自动续期（每天检查）
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

配置完成后，访问：
```
https://www.games365.fun
```

---

## 📊 监控和维护

### 查看后端状态
```bash
pm2 status
pm2 logs doudizhu-backend
pm2 monit  # 实时监控
```

### 重启服务
```bash
# 重启后端
pm2 restart doudizhu-backend

# 重启Nginx
sudo systemctl restart nginx
```

### 更新代码
```bash
# 如果使用Git
cd /var/www/doudizhu
sudo git pull

# 重新编译后端
cd backend
npm run build

# 重启后端
pm2 restart doudizhu-backend

# 前端静态文件会自动更新
```

---

## 🐛 常见问题排查

### 问题1：无法访问网站

**检查清单**：
```bash
# 1. 检查后端是否运行
pm2 status
# 如果没有运行，启动它
pm2 start ecosystem.config.js

# 2. 检查Nginx是否运行
sudo systemctl status nginx
# 如果没有运行，启动它
sudo systemctl start nginx

# 3. 检查端口是否监听
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :3000

# 4. 检查防火墙
sudo ufw status
# 确保80和443端口是开放的

# 5. 检查腾讯云安全组
# 登录腾讯云控制台 → 云服务器 → 安全组
# 确保入站规则允许80和443端口
```

### 问题2：Socket.IO连接失败

```bash
# 查看后端日志
pm2 logs doudizhu-backend

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log

# 检查Nginx配置中的WebSocket代理设置
sudo nginx -t
```

### 问题3：域名无法访问

```bash
# 检查DNS解析
ping games365.fun
ping www.games365.fun

# 如果ping不通，等待DNS生效（最多24小时）
# 或检查DNS配置是否正确
```

---

## 📝 部署检查清单

- [ ] SSH连接成功
- [ ] Node.js安装完成（v18+）
- [ ] PM2安装完成
- [ ] Nginx安装完成
- [ ] 代码上传到服务器
- [ ] 后端依赖安装完成
- [ ] 后端编译成功
- [ ] PM2启动后端成功
- [ ] Nginx配置文件创建
- [ ] Nginx配置测试通过
- [ ] Nginx重启成功
- [ ] 防火墙配置完成
- [ ] DNS解析配置完成
- [ ] 可以通过IP访问
- [ ] 可以通过域名访问
- [ ] SSL证书配置完成（可选）
- [ ] HTTPS访问正常（可选）

---

## 🎉 部署完成！

访问你的游戏：
- HTTP: http://www.games365.fun
- HTTPS: https://www.games365.fun （配置SSL后）

---

## 📞 需要帮助？

如果遇到问题，请提供以下信息：
1. 错误截图
2. 后端日志：`pm2 logs doudizhu-backend`
3. Nginx错误日志：`sudo tail -50 /var/log/nginx/error.log`
4. 浏览器控制台错误
