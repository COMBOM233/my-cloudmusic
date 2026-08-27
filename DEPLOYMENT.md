# 网易云音乐 API 演示站 · 部署手册

> 适用：个人使用、成本最低。API 版本 v4.29.17（NeteaseCloudMusicApiEnhanced 系），前端 React + Vite。

## 0. 先选一种形态

| 形态 | 成本 | 访问方式 | 特点 |
| --- | --- | --- | --- |
| A. 本机单进程 | 0 元 | localhost / 局域网 | 最简，一个端口同时提供前端和 API |
| B. GitHub Pages + 隧道 | 0 元 | 外网（域名/临时域名） | 前端托管 GitHub，API 走 Cloudflare 隧道；电脑需开机 |
| C. 云服务器 7x24 | 0~几十元/月 | 外网 | 完全在线，不依赖自己电脑 |

三种形态共用的 API 配置见第 1 章；GitHub Pages 见第 2 章；Cloudflare 命名隧道见第 3 章；快速隧道见第 4 章；云服务器见第 5 章。

---

## 1. API 服务配置详解

### 1.1 启动方式

    # 调试/前台运行（推荐，跳过版本检查的 spawn）
    node start-demo.js

    # 官方入口（会联网检查更新，不影响功能）
    node app.js

    # 生产常驻（需要 pm2：npm i -g pm2）
    pm2 start start-demo.js --name ncm-api
    pm2 save && pm2 startup        # 开机自启

### 1.2 环境变量总表

在 `NeteaseCloudMusicApi/` 目录下新建 `.env` 文件（不要提交到 Git，已加入 .gitignore）。服务启动时自动加载。

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| PORT | 3000 | 服务端口 |
| HOST | 空（全部网卡） | 监听地址；只想本机访问可设 127.0.0.1 |
| CORS_ALLOW_ORIGIN | * | 跨域来源；GitHub Pages 部署时保持 * |
| NETEASE_COOKIE | 空 | 固化登录 cookie（MUSIC_U=xxx），重启不掉登录，见 1.4 |
| ENABLE_GENERAL_UNBLOCK | false | true 时自动“解灰”：无版权/试听歌曲自动从其他平台匹配音源 |
| ENABLE_FLAC | false | 解灰时优先无损 |
| SELECT_MAX_BR | false | 解灰时选最高音质 |
| UNBLOCK_SOURCE | pyncmd,bodian,kuwo,qq,migu,kugou | 解灰音源及顺序 |
| FOLLOW_SOURCE_ORDER | false | 是否严格按音源顺序匹配 |
| ENABLE_PROXY / PROXY_URL | false / 空 | 反代地址（酷我音源播放可能需要） |
| DEBUG | 空 | 设为 1 输出调试日志 |

### 1.3 推荐 .env 配置

    PORT=3000

    # 固化登录态（强烈推荐）：把演示站里「复制登录 Cookie」按钮得到的内容粘到这里
    # 这样重启服务后依然保持登录（VIP 音质、创建歌单都可用），部署后也无需再扫码
    NETEASE_COOKIE=MUSIC_U=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

    # 开启全局解灰：无版权/会员试听歌曲自动从其他平台取流（可选，默认关闭）
    ENABLE_GENERAL_UNBLOCK=true
    ENABLE_FLAC=true

> 解灰说明：开启后播放 /song/url 返回试听/空地址的歌曲时，服务端会尝试从 pyncmd/qq/咪咕/酷狗/酷我等平台匹配可用音源。海外部署或遇到灰歌时很有用；代价是首次匹配稍慢、音质取决于对方平台。

### 1.4 获取登录 Cookie（三种方法）

- 方法一（推荐）：在演示站扫码登录后，侧边栏用户区点「复制登录 Cookie」，把复制的内容填入 .env 的 NETEASE_COOKIE。
- 方法二：浏览器打开 music.163.com 登录，F12 → Application → Cookies，复制 MUSIC_U 的值，写成 NETEASE_COOKIE=MUSIC_U=该值。
- 方法三：F12 → Network 里查看 /login/qr/check 响应，其 body 里的 cookie 字段就是完整 cookie。

### 1.5 验证

    # 应返回 code:200 与歌曲列表
    curl "http://localhost:3000/search?keywords=%E6%B5%B7%E9%98%94%E5%A4%A9%E7%A9%BA&type=1&limit=3"

---

## 2. GitHub Pages 托管前端（形态 B 的前端部分）

> 前置：项目已初始化 git 并完成首次提交。API 不能上 GitHub Pages（无 Node 运行时），只托管前端界面。

### 2.1 推送代码到 GitHub

    git remote add origin https://github.com/你的用户名/你的仓库名.git
    git push -u origin main

### 2.2 配置 API 后端地址（Secret）

仓库页面 → Settings → Secrets and variables → Actions → New repository secret：

    Name:  API_BASE_URL
    Value: https://api.example.com    （你的 API 公网地址，见第 3/4/5 章）

> 不配置时构建产物为“同源直连”版（只适合形态 A 本机单进程）。

### 2.3 开启 GitHub Pages

仓库页面 → Settings → Pages → Source 选 Deploy from a branch → Branch 选 gh-pages / (root) → Save。
等待 Actions 页面的「部署前端到 GitHub Pages」工作流跑完（首次约 1-2 分钟）。

### 2.4 访问与自动更新

    https://你的用户名.github.io/你的仓库名/

之后每次 push 到 main/master，Actions 自动重新构建发布；也可以在 Actions 页手动 Run workflow 强制更新。

---

## 3. Cloudflare 命名隧道（固定域名，0 元）

目标：把本机 3000 端口的 API 通过固定域名（如 api.example.com）暴露到公网，地址永久不变。

### 3.1 准备
- 一个域名（Cloudflare 注册，或把现有域名 DNS 托管到 Cloudflare，解析服务免费）。
- 一个 Cloudflare 账号。

### 3.2 安装 cloudflared（Windows）

    # 方法一：winget 安装
    winget install --id Cloudflare.cloudflared

    # 方法二：手动安装
    # 下载 https://github.com/cloudflare/cloudflared/releases 的 cloudflared-windows-amd64.exe
    # 改名 cloudflared.exe，放到 C:\cloudflared\，并把 C:\cloudflared 加入系统 PATH

    # 验证
    cloudflared --version

### 3.3 登录并授权域名

    cloudflared tunnel login

浏览器会打开 Cloudflare 授权页，选择你的域名并授权。完成后在 `C:\Users\你的用户名\.cloudflared\` 下生成 `cert.pem`。

### 3.4 创建隧道

    cloudflared tunnel create ncm-api

输出类似：`Created tunnel ncm-api with id xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`，并在 .cloudflared 目录生成同名的凭据 JSON 文件（记录 Tunnel ID）。把 Tunnel ID 记下来。

### 3.5 配置 DNS 记录

    cloudflared tunnel route dns ncm-api api.example.com

自动创建 CNAME：api.example.com → xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.cfargotunnel.com。

### 3.6 编写配置文件

编辑 `C:\Users\你的用户名\.cloudflared\config.yml`：

```yaml
tunnel: ncm-api
credentials-file: C:\Users\你的用户名\.cloudflared\xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.json

ingress:
  - hostname: api.example.com
    service: http://localhost:3000
  - service: http_status:404
```

注意：tunnel 名、凭据文件路径、ingress 最后一条兜底规则（http_status:404）都是必填。
校验配置：`cloudflared tunnel ingress validate`

### 3.7 启动隧道

    cloudflared tunnel run ncm-api

看到 `Registered tunnel connection` 即成功。此时 https://api.example.com 已可访问。

### 3.8 开机自启（Windows 服务，可选）

以管理员身份打开 CMD：

    cloudflared service install
    net start cloudflared

之后开机自动运行该隧道（不再需要手动开窗口）。卸载：`cloudflared service uninstall`。

### 3.9 验证并接入前端

    # 应返回 JSON
    curl "https://api.example.com/search?keywords=%E6%B5%B7%E9%98%94%E5%A4%A9%E7%A9%BA"

然后回到 2.2，把 API_BASE_URL 设为 https://api.example.com（已设置则无需改动）。

---

## 4. 快速隧道（临时域名，0 元，备选）

不想配置域名时，一条命令即可外网访问（地址每次重启会变）：

    # 确保本机 3000 端口服务已启动
    cloudflared tunnel --url http://localhost:3000

输出 `https://随机名.trycloudflare.com`，直接把该地址填到 GitHub 的 API_BASE_URL。地址变了需要：改 Secret → 重新触发 Actions。适合临时体验。

---

## 5. 云服务器 7x24（形态 C）

### 5.1 0 元：Oracle Cloud 永久免费 ARM

1. 注册 Oracle Cloud（需信用卡验证，不扣费）。
2. 创建 Compute 实例：镜像 Ubuntu 22.04/24.04，机型选 Always Free 的 VM.Standard.A1.Flex（4 核 / 24G 内存 / 最高 200G 存储），生成 SSH 密钥。
3. 安全组 Ingress Rules 放行 3000 端口（或 80/443 + Nginx）。

### 5.2 部署步骤（Ubuntu）

    # 安装 Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs git

    # 获取代码（方式一：直接 clone 你的 GitHub 仓库，推荐）
    git clone https://github.com/你的用户名/你的仓库名.git
    cd 你的仓库名/NeteaseCloudMusicApi

    # 安装依赖
    npm install --ignore-scripts

    # 配置 .env（同 1.3，含 NETEASE_COOKIE 与解灰选项）
    nano .env

    # 启动（前台调试）
    node start-demo.js

    # 或常驻（推荐）：
    sudo npm install -g pm2
    pm2 start start-demo.js --name ncm-api
    pm2 save && pm2 startup

> 前端两种部署法：① 只部署 API，前端继续用 GitHub Pages（最省资源，推荐）；② 整站部署：本地构建后把 web/dist 内容复制到 NeteaseCloudMusicApi/public/，直接访问服务器 3000 端口即可（同源模式，无需 API_BASE_URL）。

### 5.3 海外服务器访问网易云的限制

- 网易云对海外 IP 部分内容受限（地区版权）。
- 解法一（推荐）：开启解灰（ENABLE_GENERAL_UNBLOCK=true）。
- 解法二：给请求带 realIP 参数伪装国内 IP。前端构建时注入 VITE_REAL_IP（如 116.25.146.177）即可全局生效：

    # 构建前端时
    VITE_REAL_IP=116.25.146.177 npm run build

---

### 5.4 腾讯云免费服务器部署（分步实操）

**5.4.1 关于免费试用机**

- 腾讯云对新用户提供轻量应用服务器 / CVM 免费试用（常见 1核2G~2核4G，时长 15 天~3 个月不等，需实名认证）。
- 免费机适合先跑通验证；**到期后数据可能被回收**，要么按活动价续费，要么重装。代码都在 Git 里，重装很快，不用担心。
- 开通时系统建议选 **Ubuntu 22.04 / 24.04**（下文命令基于 Ubuntu；CentOS 变体见 5.4.8）。

**5.4.2 登录服务器**

    # 方式一（推荐）：控制台网页终端
    腾讯云控制台 → 轻量应用服务器 / CVM → 实例列表 → 「登录」→ OrcaTerm 网页终端

    # 方式二：本机 SSH
    ssh root@你的公网IP        # 输入购买时设置的密码，首次登录可能要求改密

**5.4.3 安装 Node.js 20**

    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs git
    node -v                     # 应显示 v20.x

**5.4.4 获取项目代码**

    # 方式一（推荐，需先把项目推到 GitHub，仓库公开或用 SSH key）
    git clone https://github.com/你的用户名/你的仓库.git
    cd 你的仓库/NeteaseCloudMusicApi

    # 方式二（还没推 GitHub）：本地打包上传，控制台「文件管理」或 scp 上传后解压即可

**5.4.5 安装依赖、配置、启动**

    npm install --ignore-scripts --no-audit --no-fund
    nano .env                   # 参考 1.3；把演示站「复制登录 Cookie」的内容填入 NETEASE_COOKIE
    node start-demo.js          # 前台试运行，确认无报错后 Ctrl+C
    sudo npm install -g pm2
    pm2 start start-demo.js --name ncm-api
    pm2 save && pm2 startup     # 常驻 + 开机自启

**5.4.6 放行端口（必做！否则外网访问不了）**

    # 轻量应用服务器：控制台 → 实例 → 「防火墙」→ 添加规则
    协议 TCP / 端口 3000 / 来源 0.0.0.0/0

    # CVM：控制台 → 安全组 → 入站规则 → 添加
    TCP:3000，来源 0.0.0.0/0

> 只给自己用的话，来源可只填你的家庭宽带公网 IP，更安全。

**5.4.7 验证**

    # 浏览器打开下面地址，应返回 JSON
    http://你的公网IP:3000/search?keywords=海阔天空

- 完整站点：把前端产物复制到 public/（见 5.2 备注）后，访问 `http://你的公网IP:3000` 即完整网站；
- 或前端继续用 GitHub Pages，把 `API_BASE_URL` 设为 `http://你的公网IP:3000`（注意 GitHub Pages 是 https，访问 http 后端属“混合内容”，部分浏览器会拦——此时建议后端套 Cloudflare 隧道转 https，见第 3 章）。

**5.4.8 备案与域名说明**

- 不绑域名、用 IP + 3000 端口：**无需备案**，个人自用推荐。
- 大陆节点想用域名（80/443）：必须 ICP 备案（免费，1~3 周），期间可先用 IP:3000。
- 香港/新加坡节点：免备案，但访问网易云可能有地区限制（见 5.3，用 realIP 或解灰缓解）。

**5.4.9 一键脚本**

仓库自带 `deploy/tencent-setup.sh`，Ubuntu 系统一条命令完成 5.4.3~5.4.5：

    bash deploy/tencent-setup.sh https://github.com/你的用户名/你的仓库.git
    # 也可顺带传入登录 Cookie：
    bash deploy/tencent-setup.sh https://github.com/你的用户名/你的仓库.git "MUSIC_U=xxxx"

脚本会：装 Node → 克隆代码 → 装依赖 → 生成 .env → pm2 常驻 → 输出访问地址与放行端口提示。
---

## 6. 部署后验证清单

- [ ] `curl http://localhost:3000/search?keywords=海阔天空` 返回 code 200
- [ ] GitHub Pages 页面能打开，搜索/榜单/歌单可加载
- [ ] 扫码登录成功；或 NETEASE_COOKIE 生效（重启服务后仍是登录态）
- [ ] VIP 歌曲播放器音质标签为 320k / 无损
- [ ] 创建歌单、加歌、红心均成功
- [ ] 手机（外网）能访问且能播放
- [ ] 解灰（若开启）：无版权歌曲也能播放

## 8. 日常更新流程（改代码 → 推送 → 服务器拉取）

### 8.1 本地改完代码后推送

    # 方式一（推荐）：双击根目录「推送更新.bat」，输入提交说明，自动 add/commit/push

    # 方式二：命令行
    git add -A
    git commit -m "本次修改说明"
    git push origin main

说明：
- 首次推送前需关联远程（本项目已完成）：`git remote add origin https://github.com/COMBOM233/my-cloudmusic.git`
- HTTPS 认证：push 时提示输入用户名与密码，密码填 **Personal Access Token**（GitHub → Settings → Developer settings → Personal access tokens → Generate new token，勾选 repo 权限）。也可改用 SSH 免密。
- 推送后 GitHub Actions 自动重新构建前端并发布到 gh-pages，前端无需手动操作（可在仓库 Actions 页看进度）。

### 8.2 服务器拉取更新

SSH 登录腾讯云服务器后执行：

    cd music_api_demo
    git pull
    pm2 restart ncm-api

或直接运行仓库自带脚本：

    bash deploy/update.sh

该脚本自动完成：git pull → npm install → pm2 restart。
**注意**：
- .env 已被 gitignore，不会被覆盖，服务器上的登录 Cookie 保持不变；
- 若前端也部署在服务器 public/ 模式（而不是 GitHub Pages），需要额外重新构建前端——脚本里有注释掉的步骤，取消注释即可。

### 8.3 常见情况处理

- **push 被拒（远程有新提交）**：先 `git pull --rebase` 再 `git push`。
- **服务器 git pull 报冲突**：服务器上有本地改动，先 `git stash` 再 pull。
- **改了什么**：`git status` 看改动列表，`git diff` 看具体差异。
- **前端没更新**：检查 Actions 是否跑完；确认 Settings → Pages 指向 gh-pages 分支。
## 7. 常见问题（FAQ）

- **扫码登录一直失败？** 确认本机能访问 music.163.com；换网络（如手机热点）排除 IP 风控；稍后再试。
- **播放地址是 null / 只能试听？** 未登录或非 VIP：先登录/配置 NETEASE_COOKIE；仍不行开启解灰。
- **隧道访问不了？** `cloudflared tunnel ingress validate` 检查配置；看 cloudflared 日志；确认 3000 端口服务在跑。
- **cookie 失效（需要重新登录）？** 网易云 cookie 会过期，重新扫码登录并更新 .env 的 NETEASE_COOKIE，重启服务。
- **GitHub Pages 页面打不开/白屏？** 检查 Actions 是否成功、Pages 是否选了 gh-pages 分支；F12 看资源是否 404（确认构建时 base 是 ./）。
- **跨域报错？** CORS_ALLOW_ORIGIN 保持 *；确认 API_BASE_URL 填写正确且不带尾部斜杠问题。
- **.env 会被提交到 GitHub 吗？** 不会，已加入 .gitignore；推送前可用 `git status` 确认。
