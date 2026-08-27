@echo off
chcp 65001 >nul
title 网易云 API 演示站（生产模式）
cd /d %~dp0NeteaseCloudMusicApi
echo ============================================
echo  网易云 API 演示站 生产模式
echo  前端 + API 由同一个服务提供
echo  访问地址: http://localhost:3000
echo  按 Ctrl+C 停止
echo ============================================
set PORT=3000
node start-demo.js
pause
