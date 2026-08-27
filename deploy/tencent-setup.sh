#!/usr/bin/env bash
# ============================================================
# 腾讯云服务器（Ubuntu/Debian）一键部署脚本
# 适用：腾讯云轻量应用服务器 / CVM，Ubuntu 22.04 / 24.04
#
# 用法：
#   bash tencent-setup.sh <你的GitHub仓库地址> [NETEASE_COOKIE]
#
# 示例：
#   bash tencent-setup.sh https://github.com/你的用户名/你的仓库.git
#   bash tencent-setup.sh https://github.com/你的用户名/你的仓库.git "MUSIC_U=xxxx"
# ============================================================
set -e

REPO_URL="${1:?请传入 GitHub 仓库地址}"
COOKIE="${2:-}"

echo "==> [1/7] 更新系统并安装基础工具"
apt-get update -y -qq
apt-get install -y -qq git curl unzip

echo "==> [2/7] 安装 Node.js 20"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi
node -v

echo "==> [3/7] 克隆项目"
if [ ! -d music_api_demo ]; then
  git clone --depth 1 "$REPO_URL" music_api_demo
fi
cd music_api_demo/NeteaseCloudMusicApi

echo "==> [4/7] 安装依赖"
npm install --ignore-scripts --no-audit --no-fund --silent

echo "==> [5/7] 生成/更新 .env"
if [ ! -f .env ]; then
  cat > .env <<EOF
PORT=3000
NETEASE_COOKIE=${COOKIE}
ENABLE_GENERAL_UNBLOCK=true
ENABLE_FLAC=true
EOF
elif [ -n "$COOKIE" ]; then
  sed -i "s|^NETEASE_COOKIE=.*|NETEASE_COOKIE=${COOKIE}|" .env
fi

echo "==> [6/7] 安装 pm2 并启动"
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2 --silent
fi
pm2 start start-demo.js --name ncm-api
pm2 save
pm2 startup systemd -u "$(whoami)" --hp "$HOME" || true

echo "==> [7/7] 完成"
IP=$(curl -s --max-time 5 ifconfig.me || echo 未知IP)
echo ""
echo ==============================================
echo "  部署完成！访问地址: http://${IP}:3000"
echo "  请到腾讯云控制台放行 3000 端口："
echo "    轻量 → 实例 → 防火墙 → 添加规则 TCP:3000"
echo "    CVM  → 安全组 → 入站规则 TCP:3000"
echo ==============================================
