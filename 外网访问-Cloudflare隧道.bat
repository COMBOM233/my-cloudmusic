@echo off
chcp 65001 >nul
title Cloudflare 快速隧道
echo ============================================
echo  通过 Cloudflare 快速隧道把本机服务暴露到外网
echo  前提：已安装 cloudflared（下载见 README 部署章节）
echo  启动后会显示一个 https://xxx.trycloudflare.com 地址
echo  把这个地址发给任意设备即可访问（无需公网 IP）
echo  按 Ctrl+C 停止隧道
echo ============================================
echo 请先确认「启动演示站.bat」正在运行（端口 3000）
pause
cloudflared tunnel --url http://localhost:3000
pause
