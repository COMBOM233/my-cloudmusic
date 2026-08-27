@echo off
chcp 65001 >nul
title 构建并部署前端
echo [1/3] 安装前端依赖（如已安装会跳过）...
cd /d %~dp0web
if not exist node_modules (
  npm install --ignore-scripts
)
echo [2/3] 构建生产版本...
call npm run build
if errorlevel 1 (
  echo 构建失败，请检查上方报错
  pause
  exit /b 1
)
echo [3/3] 部署到 API 服务 public 目录...
cd /d %~dp0
xcopy /y /e /i /q web\dist\* NeteaseCloudMusicApi\public\ >nul
echo.
echo 部署完成！请重启「启动演示站.bat」后访问 http://localhost:3000
pause
