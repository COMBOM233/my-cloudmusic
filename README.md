# 网易云音乐 API 演示站

一个用 **NeteaseCloudMusicApi**（Node.js 库） + **React (Vite)** 搭建的原型网站，
目标是完整展示这个库的用法，方便你以后搭建自己的听歌网站。

## 项目结构

    music_api_demo/
    ├── NeteaseCloudMusicApi/      # API 服务端（Node.js，默认端口 3000）
    │   ├── module/                # 每个接口一个模块文件（这就是“库的用法”所在）
    │   ├── util/                  # 请求加密、cookie 等底层工具
    │   ├── app.js                 # 官方启动入口
    │   └── start-demo.js          # ★ 本演示用的启动脚本（跳过版本检查，见下文）
    └── web/                       # React + Vite 前端（端口 5173）
        ├── vite.config.js         # 配置了 /api → localhost:3000 的代理
        └── src/
            ├── api/client.js      # ★★ 接口封装层：每个接口的中文“用法说明书”
            ├── store.js           # 全局状态（播放队列/登录态/页面导航）
            ├── components/        # 播放器 / 歌词 / 登录弹窗 / API 日志面板等
            └── views/             # 排行榜 / 歌单广场 / 我的歌单 / 搜索 / 接口文档等

## 快速开始

    # 1. 启动 API 服务（终端 1）
    cd NeteaseCloudMusicApi
    npm install            # 若安装失败可加 --ignore-scripts
    node start-demo.js     # 或 node app.js（app.js 会检查版本更新）

    # 2. 启动前端（终端 2）
    cd web
    npm install
    npm run dev            # 打开 http://localhost:5173

> 两个服务都起来后，浏览器打开 **http://localhost:5173** 即可使用。

## 关于原仓库（重要背景）

原仓库 Binaryify/NeteaseCloudMusicApi 因版权原因已于 2024 年初停止维护，
作者**清空了 master 分支的代码**，只留下一份声明。
本演示站使用的是 **v4.29.17**（NeteaseCloudMusicApiEnhanced 系，来自
https://github.com/Dou-art/Dou-Music-Player 项目内嵌的版本）：

- 扫码登录已适配网易云**新版协议（type:3）**——旧版 type:1 的扫码登录会被拦截（表现为扫码后一直不成功/提示过期）。
- 其余接口与旧版完全同构，前端封装层（web/src/api/client.js）无需改动。

如果你以后要长期使用，建议直接关注 NeteaseCloudMusicApiEnhanced 系仓库或其后续维护者。

## 前端是怎么“调用库”的？

库本身是一个 HTTP 服务。前端不需要 import 它的 Node 模块，而是**向它的路由发请求**：

    浏览器 (5173)  --/api/xxx-->  Vite 代理  -->  NeteaseCloudMusicApi (3000)  --> 网易云服务器

- 所有接口调用统一封装在 web/src/api/client.js，每个函数有中文注释：接口路径、参数、返回结构、注意事项。
- 页面右下角的「📡 API 调用日志」面板会记录每一次真实请求：完整 URL、Query 参数、状态码、耗时、完整 JSON 响应——这是理解库用法的最佳入口。
- 页面里的「📖 API 使用说明」页汇总了本演示站用到的全部接口。

## 演示了哪些接口？

| 分类 | 接口 | 演示位置 |
| --- | --- | --- |
| 搜索 | /search | 搜索页（单曲/歌单/歌手/专辑） |
| 歌曲 | /song/detail、/song/url、/lyric、/simi/song | 播放器、歌曲详情弹层 |
| 歌单 | /top/playlist、/playlist/catlist、/playlist/detail、/personalized | 歌单广场 |
| 我的歌单 | /playlist/create、/playlist/tracks、/playlist/delete、/user/playlist | 我的歌单（需登录） |
| 榜单/推荐 | /toplist、/recommend/songs、/banner | 排行榜页 |
| 评论 | /comment/music、/comment/playlist、/comment/like | 歌曲详情、歌单详情 |
| 歌手/专辑 | /artist/detail、/artists、/artist/album、/artist/desc、/album | 歌手页、专辑页 |
| 登录/用户 | /login/qr/key、/login/qr/create、/login/qr/check、/login/status、/logout、/like | 扫码登录、红心 |

完整参数说明见页面内「API 使用说明」和 web/src/api/client.js 的注释。

## 登录说明（创建歌单的前提）

- 创建/管理自己的歌单、红心收藏、评论点赞、每日推荐都需要登录。
- 点击侧边栏「登录（扫码）」，用网易云音乐 App 扫码即可。
- 登录流程：/login/qr/key 拿 key → /login/qr/create 生成二维码 → 前端每 2 秒轮询 /login/qr/check，顶层 code=803 表示成功。
- 登录后 cookie 保存在两处：API 服务端（全局）+ 前端（请求自动带 cookie 参数），刷新页面不会掉登录。

## VIP 会员有什么用？（你的账号有会员）

VIP 歌曲的播放权跟着**登录 cookie** 走。扫码登录你的 VIP 账号后：

- 播放器会自动以会员身份请求播放地址（多级取流：/song/url → /song/url/v1 超高 → /song/url/v1 无损 → /song/download/url）。
- 大多数 VIP 歌曲可解锁**完整音质**：320kbps / 无损 / Hi-Res（播放器会显示当前实际音质标签）。
- 未登录时，这些歌曲要么返回 url:null，要么只有 **128k 试听**（播一小段）。
- 依然无法解决的：网易云**本身没有版权**的歌曲（灰歌，例如部分周杰伦歌曲），任何账号都取不到流。

## 已知限制

1. **版权/会员歌曲无法播放**：网易云对部分歌曲（含 VIP 与 DRM 版权）限制，/song/url 会返回 url:null，前端会提示并跳过。换一首歌即可。
2. **接口可能随时间失效**：这是非官方接口，网易云会不定期调整，建议关注 fork 仓库的更新；接口失效时通常更新代码即可。
3. **每日推荐未登录也可返回数据**，但完整可用性依赖登录态。

## 部署方案（只给自己用，成本从 0 元起）

生产模式 = 前端构建产物直接放进 API 服务的 public/ 目录，**一个进程、一个端口**同时提供前端和 API（前端代码会自动直连同源接口，无需 Vite）。

### 方案 A：本机运行（0 元，先做这个）
1. 双击根目录的「构建并部署.bat」——构建前端并部署（代码更新后重跑一次即可）。
2. 双击「启动演示站.bat」——启动服务。
3. 浏览器打开 http://localhost:3000 即可使用（生产模式）。

局域网内其他设备访问（手机/平板）：
- 查看本机局域网 IP（ipconfig 里的 IPv4，如 192.168.x.x）。
- 同一 Wi-Fi 下访问 http://192.168.x.x:3000。
- 首次使用需在 Windows 防火墙放行 3000 端口（入站规则）。

### 方案 B：外网访问（0 元，本机 + 隧道）
- Cloudflare 快速隧道：双击「外网访问-Cloudflare隧道.bat」（需先安装 cloudflared，下载：https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/）。启动后得到 https://xxx.trycloudflare.com 临时地址，任何设备可访问（每次重启地址会变，适合临时用）。
- 固定域名：注册一个便宜域名，DNS 托管到 Cloudflare（免费），用命名隧道（cloudflared tunnel login / create / route dns）获得永久地址。
- 更安全的私有方案：Tailscale（个人免费，最多 100 台设备）——像局域网一样访问，不向公网暴露端口。
- 建议：对外暴露时用 Cloudflare Access（免费）加一道邮箱验证，避免陌生人扫到你的 API。

### 方案 C：云服务器 7x24 在线（0 元 ~ 几十元/月）
- Oracle Cloud 永久免费 ARM 实例（4 核 24G 内存）——注册后长期免费，适合自己用。
- 海外便宜 VPS（RackNerd 等约 $10-20/年）：注意海外 IP 访问网易云部分内容可能受限（可用 realIP 参数缓解）。
- 国内轻量服务器（腾讯云/阿里云约 30-60 元/月）：访问网易云最稳，但绑定域名需 ICP 备案（不备案可用 IP + 非 80 端口）。腾讯云免费试用机部署步骤见 DEPLOYMENT.md 5.4，附一键脚本 deploy/tencent-setup.sh。
- 部署步骤（Ubuntu 示例）：
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
    # 把整个项目上传到服务器（含已构建好的 public/），然后：
    cd NeteaseCloudMusicApi && npm install --ignore-scripts
    PORT=3000 node start-demo.js          # 或 pm2 start start-demo.js 常驻

### 方案 D：GitHub Pages 托管前端（0 元）+ 免费 API 后端

想「把项目放上 GitHub 就得到一个听歌网站」？——**前端可以，API 不行**（GitHub Pages 只能托管静态文件，无法运行 Node.js 服务）。所以采用「前后端分离」：

1. 把项目推到你的 GitHub 仓库（本目录已初始化 git 并提交，直接推送即可）。
2. 在 仓库 Settings → Pages 里把来源设为 **gh-pages 分支**（/root）。
3. 在 仓库 Settings → Secrets and variables → Actions 里新建 Secret：
   **API_BASE_URL = 你的 API 后端地址**（见下方后端选项）。
4. 之后每次 push，GitHub Actions 会自动构建前端并发布到 gh-pages，
   得到 https://用户名.github.io/仓库名 的听歌网站界面。

API 后端（0 元任选其一，服务端代码就是本项目的 NeteaseCloudMusicApi/）：
- 自己电脑跑「启动演示站.bat」+ Cloudflare 隧道（快速隧道免费，地址每次变；用命名隧道可得固定域名）。
- Oracle Cloud 永久免费 ARM 实例（7x24 在线）。
- 国内轻量 VPS（约 30-60 元/月，访问网易云最稳）。

> 不配置 API_BASE_URL 时，构建产物为「同源直连」版（适合本机单进程部署，见方案 A）。

## 日常更新（改代码 → 推送 → 服务器拉取）

1. **本地改完代码后推送**：双击「推送更新.bat」（输入提交说明自动完成），或命令行 `git add -A && git commit -m "说明" && git push origin main`。
2. **前端自动更新**：推送后 GitHub Actions 会自动重新构建并发布到 GitHub Pages，无需手动操作。
3. **服务器端拉取并重启**（SSH 登录腾讯云后）：

        cd music_api_demo && git pull && pm2 restart ncm-api

    或使用一键脚本：`bash deploy/update.sh`（自动完成 pull → 依赖更新 → 重启）。
4. 若前端部署在服务器 public/ 模式（非 GitHub Pages），还需在服务器上重新构建前端（步骤见 DEPLOYMENT.md 第 8 章）。
### 环境变量速查
- PORT：服务端口（默认 3000）
- HOST：监听地址（默认全部网卡，局域网可访问；若只想本机可设 127.0.0.1）
- CORS_ALLOW_ORIGIN：允许跨域来源（默认宽松，个人使用可不设）

## 以后想扩展成自己的听歌网站？

- 看 web/src/api/client.js —— 它就是你未来网站的“API 层”，照着加接口即可。
- 看 web/src/store.js 的播放队列逻辑 —— 播放器核心。
- 组件全部按功能拆分在 components/ 与 views/，可以直接复用。
- 生产部署时：cd web && npm run build，把 dist/ 交给任意静态服务器，API 服务用 PM2 / Docker 常驻即可。