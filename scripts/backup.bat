@echo off
REM 自动备份脚本
REM 创建时间：2025-10-29

echo ========================================
echo 斗地主项目自动备份工具
echo ========================================
echo.

REM 设置备份目录
set BACKUP_DIR=E:\windsurf_prj\doudizhu_backups
set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_NAME=doudizhu_backup_%TIMESTAMP%

echo [1/4] 创建备份目录...
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
mkdir "%BACKUP_DIR%\%BACKUP_NAME%"

echo [2/4] 复制项目文件...
xcopy /E /I /Y "E:\windsurf_prj\doudizhu" "%BACKUP_DIR%\%BACKUP_NAME%" /EXCLUDE:scripts\backup_exclude.txt

echo [3/4] 创建Git快照...
cd /d "E:\windsurf_prj\doudizhu"
git add .
git commit -m "auto-backup: %TIMESTAMP%"
git tag "backup-%TIMESTAMP%"

echo [4/4] 清理旧备份（保留最近7天）...
forfiles /P "%BACKUP_DIR%" /M doudizhu_backup_* /D -7 /C "cmd /c if @isdir==TRUE rd /s /q @path" 2>nul

echo.
echo ========================================
echo 备份完成！
echo 备份位置: %BACKUP_DIR%\%BACKUP_NAME%
echo Git标签: backup-%TIMESTAMP%
echo ========================================
pause
