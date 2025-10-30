# 🚀 快速开始 - 部署到腾讯云

## 服务器信息
- **IP**: 43.153.37.62
- **域名**: www.games365.fun
- **用户**: root

---

## 方式1：自动部署（推荐）⚡

### Windows用户

```powershell
# 在项目根目录打开PowerShell
cd e:\windsurf_prj\doudizhu

# 运行部署脚本
.\deploy-to-server.ps1

# 按提示输入服务器密码（会提示2-3次）
```

### Mac/Linux用户

```bash
# 在项目根目录打开终端
cd /path/to/doudizhu

# 给脚本执行权限
chmod +x deploy-to-server.sh

# 运行部署脚本
./deploy-to-server.sh

# 按提示输入服务器密码
```

**完成！** 访问 http://www.games365.fun 查看你的游戏

---

## 方式2：手动部署（详细步骤）📝

### 第一次部署（完整步骤）

#### 1. 连接服务器

```bash
ssh root@43.153.37.62
```

#### 2. 安装环境（只需要一次）

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装PM2和Nginx
sudo npm install -g pm2
sudo apt install -y nginx

# 验证安装
node -v && npm -v && pm2 -v
```

#### 3. 上传代码

**在本地电脑上**（PowerShell）：

```powershell
# 进入项目目录
cd e:\windsurf_prj

# 编译后端
cd doudizhu\backend
npm install
npm run build
cd ..\..

# 压缩项目（手动压缩，排除node_modules）
# 或使用SCP直接上传
scp -r doudizhu root@43.153.37.62:/var/www/
```

#### 4. 配置后端

**在服务器上**：

```bash
cd /var/www/doudizhu/backend

# 安装依赖
npm install --production

# 启动后端
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 5. 配置Nginx

```bash
# 创建配置文件
sudo nano /etc/nginx/sites-available/doudizhu
```

**粘贴以下内容**：

```nginx
server {
    listen 80;
    server_name www.games365.fun games365.fun 43.153.37.62;
    root /var/www/doudizhu/frontend/public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/doudizhu /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. 配置防火墙

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

#### 7. 配置DNS

登录腾讯云控制台 → 云解析DNS → games365.fun

添加记录：
```
A    @      43.153.37.62
A    www    43.153.37.62
```

#### 8. 配置HTTPS（可选但推荐）

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d games365.fun -d www.games365.fun
```

---

## 更新代码（已部署后）

### 使用自动脚本

```powershell
# Windows
.\deploy-to-server.ps1
```

### 手动更新

```bash
# 1. 连接服务器
ssh root@43.153.37.62

# 2. 备份（可选）
cd /var/www/doudizhu
tar -czf backup-$(date +%Y%m%d).tar.gz backend frontend

# 3. 上传新代码（在本地）
scp -r doudizhu root@43.153.37.62:/var/www/

# 4. 重启服务（在服务器）
cd /var/www/doudizhu/backend
npm install
npm run build
pm2 restart doudizhu-backend
sudo systemctl restart nginx
```

---

## 常用命令 🛠️

### 查看状态

```bash
# 后端状态
pm2 status

# 后端日志
pm2 logs doudizhu-backend

# Nginx状态
sudo systemctl status nginx

# 实时监控
pm2 monit
```

### 重启服务

```bash
# 重启后端
pm2 restart doudizhu-backend

# 重启Nginx
sudo systemctl restart nginx

# 重启所有
pm2 restart all && sudo systemctl restart nginx
```

### 查看日志

```bash
# 后端日志
pm2 logs doudizhu-backend --lines 100

# Nginx访问日志
sudo tail -f /var/log/nginx/access.log

# Nginx错误日志
sudo tail -f /var/log/nginx/error.log
```

---

## 测试访问 🌐

### HTTP访问
```
http://www.games365.fun
http://games365.fun
http://43.153.37.62
```

### HTTPS访问（配置SSL后）
```
https://www.games365.fun
https://games365.fun
```

---

## 故障排查 🔍

### 无法访问？

```bash
# 1. 检查后端
pm2 status
# 如果stopped，运行: pm2 start ecosystem.config.js

# 2. 检查Nginx
sudo systemctl status nginx
# 如果inactive，运行: sudo systemctl start nginx

# 3. 检查端口
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :3000

# 4. 检查防火墙
sudo ufw status

# 5. 检查腾讯云安全组
# 登录控制台 → 云服务器 → 安全组
# 确保80和443端口开放
```

### Socket连接失败？

```bash
# 查看后端日志
pm2 logs doudizhu-backend

# 查看Nginx配置
sudo nginx -t

# 重启服务
pm2 restart doudizhu-backend
sudo systemctl restart nginx
```

---

## 性能优化建议 ⚡

1. **启用Gzip压缩**（已在Nginx配置中）
2. **配置CDN**（腾讯云CDN）
3. **使用HTTPS**（Let's Encrypt免费）
4. **监控服务器资源**（PM2 Plus）
5. **定期备份数据**

---

## 安全建议 🔒

1. ✅ 使用HTTPS
2. ✅ 修改SSH端口（可选）
3. ✅ 禁用root密码登录，使用SSH密钥
4. ✅ 定期更新系统
5. ✅ 配置防火墙
6. ✅ 定期备份

---

## 需要帮助？ 💬

遇到问题请提供：
1. 错误截图
2. 后端日志：`pm2 logs doudizhu-backend`
3. Nginx日志：`sudo tail -50 /var/log/nginx/error.log`
4. 浏览器控制台错误

---

## 🎉 部署完成！

你的斗地主游戏现在已经上线了！

**访问地址**: http://www.games365.fun

祝你玩得开心！🎮
