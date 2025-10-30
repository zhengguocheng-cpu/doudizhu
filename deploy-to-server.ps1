# 斗地主游戏自动部署脚本 (PowerShell版本)
# 服务器: 43.153.37.62
# 域名: www.games365.fun

$ErrorActionPreference = "Stop"

# 服务器信息
$SERVER_IP = "43.153.37.62"
$SERVER_USER = "root"
$PROJECT_DIR = "/var/www/doudizhu"

Write-Host "========================================" -ForegroundColor Green
Write-Host "  斗地主游戏部署脚本" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 步骤1：检查本地环境
Write-Host "[1/8] 检查本地环境..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    Write-Host "✓ Node.js 已安装: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "错误: 未安装Node.js" -ForegroundColor Red
    exit 1
}

try {
    $npmVersion = npm -v
    Write-Host "✓ npm 已安装: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "错误: 未安装npm" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 步骤2：编译后端
Write-Host "[2/8] 编译后端代码..." -ForegroundColor Yellow
Set-Location backend
npm install
npm run build
Write-Host "✓ 后端编译完成" -ForegroundColor Green
Set-Location ..
Write-Host ""

# 步骤3：打包项目
Write-Host "[3/8] 打包项目文件..." -ForegroundColor Yellow

# 创建临时目录
$tempDir = "temp_deploy"
if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# 复制文件（排除不需要的）
Write-Host "复制后端文件..."
Copy-Item -Path "backend" -Destination "$tempDir/backend" -Recurse -Exclude "node_modules","logs","*.log"

Write-Host "复制前端文件..."
Copy-Item -Path "frontend" -Destination "$tempDir/frontend" -Recurse -Exclude "node_modules"

# 压缩
Write-Host "压缩文件..."
Compress-Archive -Path "$tempDir/*" -DestinationPath "doudizhu.zip" -Force

# 清理临时目录
Remove-Item -Recurse -Force $tempDir

Write-Host "✓ 项目打包完成" -ForegroundColor Green
Write-Host ""

# 步骤4：上传到服务器
Write-Host "[4/8] 上传到服务器..." -ForegroundColor Yellow
Write-Host "提示: 需要输入服务器密码" -ForegroundColor Cyan

# 使用SCP上传
scp doudizhu.zip "${SERVER_USER}@${SERVER_IP}:/tmp/"

Write-Host "✓ 上传完成" -ForegroundColor Green
Write-Host ""

# 步骤5-7：在服务器上执行部署命令
Write-Host "[5/8] 在服务器上部署..." -ForegroundColor Yellow
Write-Host "提示: 需要输入服务器密码" -ForegroundColor Cyan

$deployScript = @"
set -e
echo '解压文件...'
cd /tmp
unzip -o doudizhu.zip -d doudizhu_new

echo '备份旧版本...'
sudo mkdir -p /var/www/doudizhu
if [ -d '/var/www/doudizhu/backend' ]; then
    sudo tar -czf /var/www/doudizhu/backup-`date +%Y%m%d-%H%M%S`.tar.gz -C /var/www/doudizhu backend frontend 2>/dev/null || true
fi

echo '部署新版本...'
sudo cp -rf /tmp/doudizhu_new/* /var/www/doudizhu/

echo '安装后端依赖...'
cd /var/www/doudizhu/backend
sudo npm install --production

echo '重启后端服务...'
if command -v pm2 &> /dev/null; then
    pm2 restart doudizhu-backend || pm2 start ecosystem.config.js
    pm2 save
    echo '✓ PM2服务重启成功'
else
    echo '警告: PM2未安装'
fi

echo '重启Nginx...'
sudo systemctl restart nginx

echo '清理临时文件...'
rm -rf /tmp/doudizhu_new /tmp/doudizhu.zip

echo '✓ 部署完成'
"@

# 执行远程命令
$deployScript | ssh "${SERVER_USER}@${SERVER_IP}" "bash -s"

Write-Host "✓ 服务器部署完成" -ForegroundColor Green
Write-Host ""

# 步骤8：清理本地临时文件
Write-Host "[8/8] 清理临时文件..." -ForegroundColor Yellow
Remove-Item -Force doudizhu.zip
Write-Host "✓ 清理完成" -ForegroundColor Green
Write-Host ""

# 完成
Write-Host "========================================" -ForegroundColor Green
Write-Host "  部署成功！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "访问地址:"
Write-Host "  HTTP:  http://www.games365.fun" -ForegroundColor Yellow
Write-Host "  HTTPS: https://www.games365.fun" -ForegroundColor Yellow
Write-Host ""
Write-Host "查看日志:"
Write-Host "  ssh ${SERVER_USER}@${SERVER_IP} 'pm2 logs doudizhu-backend'" -ForegroundColor Yellow
Write-Host ""
