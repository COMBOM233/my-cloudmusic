// 全功能冒烟测试：在 jsdom 中真实渲染 <App/>，遍历各页面与交互，捕获任何运行时崩溃
import { JSDOM } from 'jsdom'

// ---------- 准备 jsdom 环境（必须在 import 应用模块之前） ----------
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:5173/',
})
global.window = dom.window
global.document = dom.window.document
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true })
global.localStorage = dom.window.localStorage
global.getComputedStyle = dom.window.getComputedStyle
global.HTMLElement = dom.window.HTMLElement
global.Node = dom.window.Node

// Audio stub（jsdom 没有音频实现）
class FakeAudio {
  constructor() { this._ls = {}; this.paused = true; this.src = ''; this.currentTime = 0; this.duration = 120; this.volume = 0.8; }
  addEventListener(t, f) { (this._ls[t] = this._ls[t] || []).push(f) }
  removeEventListener(t, f) { this._ls[t] = (this._ls[t] || []).filter(x => x !== f) }
  play() { this.paused = false; (this._ls.play || []).forEach(f => f()); return Promise.resolve() }
  pause() { this.paused = true; (this._ls.pause || []).forEach(f => f()) }
  removeAttribute() {}
}
global.Audio = FakeAudio
global.HTMLMediaElement = FakeAudio
// jsdom 未实现 scrollIntoView，补 stub
dom.window.Element.prototype.scrollIntoView = function () {}

// ---------- fetch stub：按路由返回罐头数据 ----------
const SONG_AL = (id, name) => ({ id, name, ar: [{ id: 201, name: '歌手A' }], al: { id: 301, name: '专辑甲', picUrl: '' }, dt: 210000 })
const SONG_ART = (id, name) => ({ id, name, artists: [{ id: 202, name: '歌手B' }], album: { id: 302, name: '专辑乙', picUrl: '' }, duration: 180000 })
const routes = {
  '/login/status': { code: 200, data: { profile: null } },
  '/toplist': { code: 200, list: [{ id: 1, name: '飙升榜', coverImgUrl: '' }, { id: 2, name: '热歌榜', coverImgUrl: '' }] },
  '/banner': { code: 200, banners: [] },
  '/personalized': { code: 200, result: [{ id: 10, name: '推荐歌单', coverImgUrl: '', playCount: 5 }] },
  '/playlist/catlist': { code: 200, categories: { 0: '流行' } },
  '/top/playlist': { code: 200, playlists: [{ id: 11, name: '流行精选', coverImgUrl: '', playCount: 99 }] },
  '/playlist/detail': { code: 200, playlist: { id: 10, name: '测试歌单', creator: { nickname: '管理员' }, playCount: 1, trackCount: 2, coverImgUrl: '', description: '描述', tracks: [SONG_AL(1001, '歌一'), SONG_AL(1002, '歌二')] } },
  '/search': { code: 200, result: { songs: [SONG_ART(2001, '搜索歌A'), SONG_ART(2002, '搜索歌B')] } },
  '/song/detail': { code: 200, songs: [SONG_AL(1001, '歌一')] },
  '/song/url': { code: 200, data: [{ id: '?', url: 'https://cdn.example.com/a.mp3', br: 320000 }] },
  '/song/url/v1': { code: 200, data: [{ id: '?', url: 'https://cdn.example.com/a.mp3', br: 320000, level: 'exhigh' }] },
  '/song/download/url': { code: 200, data: { url: 'https://cdn.example.com/a.mp3', br: 320000 } },
  '/lyric': { code: 200, lrc: { lyric: '[00:00.00] 测试歌词' } },
  '/simi/song': { code: 200, songs: [SONG_AL(1003, '相似歌')] },
  '/comment/music': { code: 200, hotComments: [], comments: [{ commentId: 1, content: '好歌', user: { nickname: '听友' }, time: Date.now(), likedCount: 1 }] },
  '/artists': { code: 200, artist: { name: '歌手A' }, hotSongs: [SONG_AL(1001, '歌一')] },
  '/artist/detail': { code: 200, data: { artist: { name: '歌手A', picUrl: '', musicSize: 1, albumSize: 1 } } },
  '/artist/album': { code: 200, hotAlbums: [{ id: 31, name: '专辑甲', picUrl: '', publishTime: 0 }] },
  '/artist/desc': { code: 200, briefDesc: '歌手简介文本' },
  '/album': { code: 200, album: { id: 301, name: '专辑甲', picUrl: '', artist: { id: 201, name: '歌手A' } }, songs: [SONG_AL(1001, '歌一')] },
  '/nowplaying': { code: 200, list: [] },
  '/login/qr/key': { code: 200, data: { unikey: 'test-key' } },
  '/login/qr/create': { code: 200, data: { qrimg: 'data:image/png;base64,AAAA' } },
  '/login/qr/check': { code: 801, message: '等待扫码' },
  '/like': { code: 200 },
}
global.fetch = async (url) => {
  const u = String(url).replace('/api', '')
  const path = u.split('?')[0]
  const body = routes[path] || { code: 404 }
  const json = JSON.stringify(body)
  return { status: 200, ok: true, json: async () => body, text: async () => json }
}

// ---------- 加载真实应用 ----------
const { createRoot } = await import('react-dom/client')
const { createElement } = await import('react')
const { default: App } = await import('./src/App.jsx')
const store = await import('./src/store.js')

// ---------- 工具 ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const $ = (sel) => document.querySelector(sel)
const $$ = (sel) => [...document.querySelectorAll(sel)]
const errors = []
window.addEventListener('error', (e) => errors.push(e.error || e.message))
window.addEventListener('unhandledrejection', (e) => errors.push(e.reason || 'unhandledrejection'))

let rootAlive = () => !!$('.app') && $$('#root > *').length > 0
let passed = 0, failed = 0
function assert(name, cond, extra) {
  if (cond) { passed++; console.log('PASS | ' + name) }
  else { failed++; console.log('FAIL | ' + name + (extra ? ' | ' + extra : '')) }
}
async function step(name, fn) {
  try { await fn() } catch (e) {
    failed++
    console.log('CRASH | ' + name + ' | ' + (e && e.message ? e.message : e))
    errors.push(e)
  }
}

const container = document.getElementById('root')
const root = createRoot(container)
root.render(createElement(App))
await sleep(120)
assert('初始渲染：应用骨架存在（非黑屏）', rootAlive(), 'root children=' + $$('#root > *').length)
assert('初始渲染：侧边栏品牌可见', ($('.logo-text') || {}).textContent === 'MyMusic')

// ---------- 遍历所有导航页面 ----------
async function navTo(label) {
  const btn = $$('.nav-item').find((b) => b.textContent.includes(label))
  if (!btn) throw new Error('找不到导航: ' + label)
  btn.click()
  await sleep(120)
}

await step('页面：首页(排行榜)', async () => {
  await navTo('首页'); assert('首页含榜单内容', ($('.main') || {}).textContent.includes('飙升榜'))
})
await step('页面：发现(歌单广场)', async () => {
  await navTo('发现'); assert('发现页含歌单', ($('.main') || {}).textContent.includes('流行精选'))
})
await step('页面：搜索', async () => {
  await navTo('搜索'); assert('搜索页含结果行', $$('.song-row').length > 0)
})
await step('页面：大家在听(空态)', async () => {
  await navTo('大家在听'); assert('空态文案', ($('.main') || {}).textContent.includes('暂时还没有人'))
})
await step('页面：API文档', async () => {
  await navTo('API 文档'); assert('文档页渲染', ($('.main') || {}).textContent.includes('API 使用说明'))
})
await step('页面：我的歌单(未登录)', async () => {
  await navTo('我的歌单'); assert('未登录提示', ($('.main') || {}).textContent.includes('我的歌单') && ($('.main') || {}).textContent.includes('登录'))
})

// ---------- 歌单详情 + 点击歌曲播放（复现黑屏场景） ----------
await step('歌单详情页', async () => {
  store.navigate('playlist', { id: 10 })
  await sleep(150)
  assert('歌单行渲染', $$('.song-row').length >= 2, 'rows=' + $$('.song-row').length)
})
await step('★ 点击歌曲行播放（用户报黑屏场景）', async () => {
  const row = $$('.song-row')[0]
  row.click()
  await sleep(200)
  assert('播放后未崩溃（应用存活）', rootAlive())
  assert('播放器显示歌名', ($('.pb-name') || {}).textContent.includes('歌一'))
})
await step('播放器：切播放模式 循环→单曲→随机', async () => {
  $$('.pb-ctl')[0].click(); await sleep(30)
  $$('.pb-ctl')[0].click(); await sleep(30)
  assert('随机模式高亮', !!$('.pb-ctl.mode-on'))
})
await step('播放器：上一首/播放暂停/下一首', async () => {
  const btns = $$('.pb-ctl')
  btns[1].click(); await sleep(30)   // 上一首
  $('.btn-play').click(); await sleep(30)  // 暂停
  $('.btn-play').click(); await sleep(30)  // 播放
  btns[3].click(); await sleep(30)   // 下一首
  assert('控制操作后未崩溃', rootAlive())
})

// ---------- 行内交互 ----------
await step('点击歌手跳转歌手页', async () => {
  const link = $$('.song-row')[0].querySelector('.cell-link[title^="查看歌手"]')
  if (link) { link.click(); await sleep(150) }
  assert('进入歌手页', ($('.main') || {}).textContent.includes('歌手A') && rootAlive())
})
await step('点击专辑跳转专辑页', async () => {
  store.navigate('playlist', { id: 10 }); await sleep(150)
  const link = $$('.song-row')[0].querySelector('.cell-link[title^="查看专辑"]')
  if (link) { link.click(); await sleep(150) }
  assert('进入专辑页', ($('.main') || {}).textContent.includes('专辑甲') && rootAlive())
})

await step('红心（未登录→弹登录窗）', async () => {
  store.navigate('playlist', { id: 10 }); await sleep(120)
  const heart = $$('.song-row')[0].querySelector('.btn-icon[title="红心"], .btn-icon[title="取消红心"]')
  if (heart) { heart.click(); await sleep(80) }
  assert('弹出登录窗', !!$('.modal') && rootAlive())
  // 关闭登录窗
  const close = $('.modal-head .btn-icon')
  if (close) { close.click(); await sleep(60) }
  assert('关闭登录窗后正常', rootAlive())
})

await step('加入歌单菜单（未登录路径，验证 user 修复）', async () => {
  const btn = $$('.song-row')[0].querySelector('.btn-icon[title="加入歌单"]')
  if (btn) { btn.click(); await sleep(50) }
  const menu = $('.add-menu')
  assert('加入歌单菜单打开且未崩溃', !!menu && rootAlive(), 'menu=' + !!menu)
  assert('未登录提示显示', menu ? menu.textContent.includes('登录后可加入歌单') : false)
})

// ---------- 歌曲详情弹层 / 歌词 / API 日志 ----------
await step('打开歌曲详情弹层', async () => {
  store.setState({ songDetailId: 1001 }); await sleep(150)
  assert('详情弹层含相似歌曲', ($('.modal') || {}).textContent.includes('相似歌曲') && rootAlive())
  store.setState({ songDetailId: null }); await sleep(50)
})
await step('歌词面板开关', async () => {
  store.setState({ lyricsOpen: true }); await sleep(60)
  assert('歌词面板显示', !!$('.lyrics-overlay') && ($('.lyrics-list') || {}).textContent.includes('测试歌词'))
  store.setState({ lyricsOpen: false }); await sleep(40)
})
await step('API 日志抽屉', async () => {
  $('.sidebar-top-btn').click(); await sleep(60)
  assert('日志抽屉打开', !!$('.api-log-drawer'))
  const firstLog = $('.api-log-line')
  if (firstLog) { firstLog.click(); await sleep(40) }
  assert('日志可展开', !!$('.api-log-detail'))
  // 关闭
  const closeBtn = $$('.api-log-head .btn').find((b) => b.textContent.includes('关闭'))
  if (closeBtn) closeBtn.click()
  await sleep(40)
  assert('日志抽屉关闭', !$('.api-log-drawer'))
})

// ---------- 登录弹窗完整流程（扫码） ----------
await step('扫码登录弹窗', async () => {
  store.setState({ loginOpen: true }); await sleep(150)
  assert('二维码渲染', !!$('.login-qr') && rootAlive())
  const close = $('.modal-head .btn-icon')
  if (close) close.click(); await sleep(50)
  assert('登录窗关闭', !$('.modal') && rootAlive())
})

// 清理定时器并收尾
root.unmount()
console.log('\n===== 汇总 =====')
console.log('通过: ' + passed + ' | 失败: ' + failed)
if (errors.length) { console.log('捕获到的错误:'); errors.forEach((e) => console.log(' -', e && e.message ? e.message : e)) }
process.exit(failed || errors.length ? 1 : 0)
