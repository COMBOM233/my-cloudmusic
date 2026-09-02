// ============================================================================
// NeteaseCloudMusicApi 前端封装层
// ----------------------------------------------------------------------------
// 说明：
//   NeteaseCloudMusicApi 是一个运行在本地的 Node.js 服务（默认 http://localhost:3000）。
//   它的每一个「路由」就是一个接口，例如 GET /search?keywords=xxx 表示搜索。
//   Vite 开发服务器把 /api 前缀代理到 3000 端口（见 vite.config.js），
//   所以前端代码里统一用相对路径 '/api/xxx' 发起请求，浏览器无跨域问题。
//
//   本文件做了三件事：
//   1. request()：统一请求入口，自动拼 query、解析 JSON、校验 code
//   2. 每次请求都会广播一条日志（onApiLog），供右下角的「API 调用日志」面板展示
//   3. 按业务分类封装了所有演示用到的接口函数，每个函数都标注了
//      官方文档地址、参数含义、返回结构要点 —— 这就是库的「用法说明书」
// ============================================================================

// ---------- 极简发布订阅：API 日志广播 ----------
const listeners = new Set()
export function onApiLog(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
function emit(log) {
  listeners.forEach((fn) => fn(log))
}

// ---------- 环境变量（兼容 Vite 构建与普通 Node 运行） ----------
const META_ENV =
  typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {}

// ---------- 登录 cookie ----------
// 扫码登录成功后，把服务端返回的 cookie 字符串保存在这里；
// 之后所有请求都会自动带上 ?cookie=xxx（该库支持这个参数，等价于浏览器 Cookie 头），
// 这样即使浏览器没有存下 cookie，登录态也一定有效。
let authCookie = ''
export function setAuthCookie(cookie) {
  authCookie = cookie || ''
}
export function getAuthCookie() {
  return authCookie
}

// ---------- 统一请求入口 ----------
// path:  接口路径，例如 '/search'
// params: 查询参数对象，例如 { keywords: '海阔天空', type: 1 }
// opts:   { skipCodeCheck: true } 表示不校验顶层 code（用于扫码登录等“状态码即业务含义”的接口）
// 返回：完整 JSON（{ code, data, ... }）
export async function request(path, params = {}, opts = {}) {
  const { skipCodeCheck = false } = opts
  const query = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    // 跳过空值，避免拼出无意义参数
    if (v !== undefined && v !== null && v !== '') query.set(k, v)
  })
  // 已登录时自动携带 cookie
  if (authCookie && !query.has('cookie')) query.set('cookie', authCookie)
  // 可选：构建时注入 VITE_REAL_IP（如 116.25.146.177），海外部署时让网易云认为请求来自国内
  if (META_ENV.VITE_REAL_IP) query.set('realIP', META_ENV.VITE_REAL_IP)

  // 日志中隐藏 cookie 明文
  const queryForLog = { ...Object.fromEntries(query) }
  if (queryForLog.cookie) queryForLog.cookie = '***（已隐藏）'

  const qs = query.toString()
  // API 地址优先级：
  //   1) 构建时注入的 VITE_API_BASE（如部署到 GitHub Pages 时指向独立 API 后端）
  //   2) 开发模式走 Vite 代理 /api
  //   3) 生产模式同源直连（前端由 API 服务直接托管时）
  const API_BASE = META_ENV.VITE_API_BASE || (META_ENV.PROD ? '' : '/api')
  const url = API_BASE + path + (qs ? '?' + qs : '')
  const start = Date.now()
  let status = null
  let body = null
  let errMsg = null
  try {
    const resp = await fetch(url, { headers: { Accept: 'application/json' } })
    status = resp.status
    const text = await resp.text()
    try {
      body = JSON.parse(text)
    } catch {
      body = { raw: text.slice(0, 2000) }
      errMsg = '响应不是合法 JSON'
    }
    emit({ time: new Date().toLocaleTimeString(), method: 'GET', path, query: queryForLog, status, ms: Date.now() - start, body, isError: !!errMsg })
    if (!skipCodeCheck && body.code !== undefined && body.code !== 200) {
      const e = new Error('接口返回 code=' + body.code + '：' + (body.message || '未知错误'))
      e.code = body.code
      throw e
    }
    if (errMsg) throw new Error(errMsg)
    return body
  } catch (e) {
    if (!(e instanceof SyntaxError)) {
      emit({ time: new Date().toLocaleTimeString(), method: 'GET', path, query: queryForLog, status: status || 'ERR', ms: Date.now() - start, body: { error: String(e.message) }, isError: true })
    }
    throw e
  }
}

// ============================================================================
// 接口封装（按业务分类）
// 官方文档：https://neteasecloudmusicapi.vercel.app
// ============================================================================

// ---------- 1. 搜索 ----------
// 文档：/search 搜索
// type: 1=单曲 10=专辑 100=歌手 1000=歌单 1002=用户 1004=MV 1006=歌词 1009=电台
// 返回：data.songs[]（type=1 时）或 data.playlists[] / data.artists[] / data.albums[]
export const search = (keywords, type = 1, limit = 30, offset = 0) =>
  request('/search', { keywords, type, limit, offset })

// 搜索建议（下拉联想）：type=mobile 返回包含 songs/artists/albums 的合并结果
export const searchSuggest = (keywords) => request('/search/suggest', { keywords, type: 'mobile' })

// ---------- 2. 歌曲 ----------
// 文档：/song/detail 歌曲详情（一次可查多首，ids 用逗号分隔）
export const songDetail = (ids) =>
  request('/song/detail', { ids: Array.isArray(ids) ? ids.join(',') : ids })

// 文档：/song/url 获取播放地址（重要！版权/会员歌曲可能返回 url:null）
// br: 码率，999000 表示取最高可用音质
export const songUrl = (id, br = 999000) => request('/song/url', { id, br })

// 文档：/lyric 获取歌词（返回 lrc 与 tlyric 两种 LRC 文本）
export const lyric = (id) => request('/lyric', { id })

// 文档：/simi/song 相似歌曲
export const simiSong = (id) => request('/simi/song', { id })

// 文档：/song/url/v1 按音质等级取流（standard/exhigh/lossless/hires/sky/jymaster）
// 说明：v1 走 Android 通道，部分歌曲用它能取到更高音质；无损/Hi-Res 需 VIP 账号
export const songUrlV1 = (id, level = 'exhigh') => request('/song/url/v1', { id, level })

// 文档：/song/download/url 获取下载链接（登录 VIP 后可取高音质）
export const songDownloadUrl = (id, br = 320000) => request('/song/download/url', { id, br })

// ---------- 播放地址解析（多级回退） ----------
// 依次尝试：标准接口 → v1(exhigh) → v1(lossless) → 下载接口
// 返回 { url, br, level, source }；全部失败返回 null
// 说明：是否拿到高音质取决于登录账号 —— VIP 账号返回完整音质，未登录多为 128k 试听
export async function resolveSongUrl(id) {
  const attempts = [
    { label: '/song/url', run: () => songUrl(id, 999000).then((r) => r.data?.[0]) },
    { label: '/song/url/v1(exhigh)', run: () => songUrlV1(id, 'exhigh').then((r) => r.data?.[0]) },
    { label: '/song/url/v1(lossless)', run: () => songUrlV1(id, 'lossless').then((r) => r.data?.[0]) },
    { label: '/song/download/url', run: () => songDownloadUrl(id, 320000).then((r) => r.data) },
  ]
  for (const a of attempts) {
    try {
      const d = await a.run()
      if (d && d.url) return { url: d.url, br: d.br, level: d.level || '', source: a.label }
    } catch {
      /* 该通道失败，继续尝试下一个 */
    }
  }
  return null
}

// ---------- 3. 歌单 ----------
// 文档：/top/playlist 热门歌单（cat 分类名，order=hot|new）
export const topPlaylist = (cat = '全部', limit = 30, offset = 0) =>
  request('/top/playlist', { cat, limit, offset })

// 文档：/playlist/catlist 歌单分类列表
export const playlistCatlist = () => request('/playlist/catlist')

// 文档：/playlist/detail 歌单详情（含歌曲列表 tracks）
export const playlistDetail = (id) => request('/playlist/detail', { id })

// 文档：/playlist/create 创建歌单（需登录）
export const playlistCreate = (name) => request('/playlist/create', { name })

// 文档：/playlist/tracks 向歌单添加/删除歌曲（需登录）
// op: add | del，tracks 为逗号分隔的歌曲 id 列表
export const playlistTracks = (op, pid, tracks) =>
  request('/playlist/tracks', { op, pid, tracks: Array.isArray(tracks) ? tracks.join(',') : tracks })

// 文档：/playlist/delete 删除歌单（需登录）
export const playlistDelete = (id) => request('/playlist/delete', { id })

// 文档：/user/playlist 获取某个用户的歌单列表（需登录后查询自己）
export const userPlaylist = (uid, limit = 50) => request('/user/playlist', { uid, limit })

// ---------- 4. 榜单 ----------
// 文档：/toplist 所有榜单的概要（id 就是歌单 id，可交给 /playlist/detail 查详情）
export const toplist = () => request('/toplist')

// ---------- 5. 推荐 ----------
// 文档：/recommend/songs 每日推荐（需登录），返回 data.dailySongs[]
export const recommendSongs = () => request('/recommend/songs')

// 文档：/banner 首页轮播图
export const banner = () => request('/banner')

// 文档：/personalized 推荐歌单
export const personalized = (limit = 12) => request('/personalized', { limit })

// ---------- 6. 评论 ----------
// 文档：/comment/music 歌曲评论（sortType 默认热评在前）
export const commentMusic = (id, limit = 20, offset = 0) =>
  request('/comment/music', { id, limit, offset })

// 文档：/comment/playlist 歌单评论
export const commentPlaylist = (id, limit = 20) => request('/comment/playlist', { id, limit })

// 文档：/comment/like 给评论点赞（需登录）t=1 点赞 t=0 取消
export const commentLike = (id, cid, type = 1, t = 1) =>
  request('/comment/like', { id, cid, type, t })

// ---------- 7. 歌手 / 专辑 ----------
// 文档：/artist/detail 歌手详情
export const artistDetail = (id) => request('/artist/detail', { id })

// 文档：/artists 歌手热门 50 首，返回 data.hotSongs[]
export const artistSongs = (id) => request('/artists', { id })

// 文档：/artist/album 歌手的专辑列表
export const artistAlbum = (id, limit = 30) => request('/artist/album', { id, limit })

// 文档：/artist/desc 歌手简介
export const artistDesc = (id) => request('/artist/desc', { id })

// 文档：/album 专辑详情，返回 data.album + data.songs[]
export const album = (id) => request('/album', { id })

// ---------- 8. 登录 / 用户 ----------
// 文档：/login/qr/key 获取二维码 key
export const loginQrKey = () => request('/login/qr/key', { timestamp: Date.now() })

// 文档：/login/qr/create 生成二维码图片（qrimg=true 时 data.qrimg 为 base64 图片）
export const loginQrCreate = (key) => request('/login/qr/create', { key, qrimg: true, timestamp: Date.now() })

// 文档：/login/qr/check 轮询扫码状态
// 返回顶层 code：800=过期 801=等待扫码 802=已扫码待确认 803=登录成功（需带 timestamp 防缓存）
// 803 时响应里还带 cookie（服务端返回的完整 cookie 字符串）
// 注意：扫码轮询返回的 800/801/802/803 是“业务状态码”而非错误，所以跳过通用 code 校验
export const loginQrCheck = (key) =>
  request('/login/qr/check', { key, timestamp: Date.now() }, { skipCodeCheck: true })

// 文档：/login/status 当前登录状态，data.profile 为用户信息
export const loginStatus = () => request('/login/status', { timestamp: Date.now() })

// 文档：/logout 退出登录
export const logout = () => request('/logout')

// 文档：/user/account 账号信息（含是否匿名、会员状态）
export const userAccount = () => request('/user/account')

// 文档：/user/detail 用户详情（uid 必填）
export const userDetail = (uid) => request('/user/detail', { uid })

// 文档：/likelist 我喜欢的音乐 id 列表（uid 必填）
export const likelist = (uid) => request('/likelist', { uid })

// 文档：/like 红心/取消红心某首歌（需登录）like=true|false
export const likeSong = (id, like = true) => request('/like', { id, like })

// ---------- 9. 本站自建功能：大家在听 ----------
// 路由由 NeteaseCloudMusicApi/module/nowplaying.js 提供（不调用网易云）
// 上报当前正在播放（vid 标识听众，payload 含歌曲信息）
export const reportNowPlaying = (payload) => request('/nowplaying', { ...payload, action: 'report' })
// 查询大家正在听（t 为时间戳，绕过服务端 2 分钟响应缓存，保证轮询实时）
export const fetchNowPlaying = () => request('/nowplaying', { action: 'list', t: Date.now() })
