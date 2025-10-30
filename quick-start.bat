@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 斗地主游戏 - 快速启动
echo ========================================
echo.

echo 📦 步骤1: 编译TypeScript...
cd backend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 编译失败！
    pause
    exit /b 1
)
echo ✅ 编译成功！
echo.

echo 🚀 步骤2: 启动服务器...
echo.
echo ========================================
echo 📝 测试指南:
echo    1. 打开浏览器访问: http://localhost:3000
echo    2. 按 F12 打开控制台
echo    3. 自动测试会自动运行
echo    4. 或手动运行: AutoTest.runAll()
echo.
echo 📖 详细测试步骤请查看: QUICK_LAUNCH_TEST.md
echo ========================================
echo.

call npm start
