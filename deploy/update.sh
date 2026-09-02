#!/usr/bin/env bash
# ============================================================
# 服务器一键更新：拉取最新代码并重启 API 服务
# 用法：在项目根目录执行  bash deploy/update.sh
# ============================================================
set -e
cd "$(dirname "$0")/.."

echo "==> 拉取最新代码"
git pull

echo "==> 更新依赖（失败不阻塞）"
cd NeteaseCloudMusicApi
npm install --ignore-scripts --no-audit --no-fund --silent || true

echo "==> 重启 API 服务"
pm2 restart ncm-api || pm2 start start-demo.js --name ncm-api

# 若前端也部署在服务器（public/ 模式，非 GitHub Pages），取消下面三行注释：
cd ../web
npm run build
rm -rf ../NeteaseCloudMusicApi/public/assets && cp -r dist/* ../NeteaseCloudMusicApi/public/

echo "==> 更新完成"
