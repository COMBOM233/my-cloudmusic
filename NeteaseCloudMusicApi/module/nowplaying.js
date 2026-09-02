// 大家在听（本站自建功能）：聚合所有正在使用本站的用户播放状态
// 路由：GET /nowplaying?action=list&t=xxx          -> 查询正在播放列表（t 用于绕过响应缓存）
//       GET /nowplaying?action=report&vid=&name=... -> 上报当前播放
// 数据持久化到 ../listening.json（已 gitignore，不提交）
const fs = require('fs')
const path = require('path')

const DB_FILE = path.resolve(__dirname, '..', 'listening.json')
const STALE_MS = 3 * 60 * 1000 // 超过 3 分钟未上报视为停止
const MAX = 30

function loadDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'))
  } catch (e) {
    return {}
  }
}

function saveDb(db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
  } catch (e) {
    /* 忽略写失败 */
  }
}

module.exports = async (query) => {
  const db = loadDb()

  if (query.action === 'report') {
    // 上报：vid 唯一标识一个听众（登录用户用 userId，未登录用浏览器本地生成的 id）
    const vid = String(query.vid || 'anon').slice(0, 64)
    if (query.songId) {
      db[vid] = {
        vid,
        name: String(query.name || '匿名用户').slice(0, 24),
        avatar: String(query.avatar || ''),
        songId: String(query.songId),
        songName: String(query.songName || '').slice(0, 80),
        artists: String(query.artists || '').slice(0, 80),
        album: String(query.album || '').slice(0, 80),
        picUrl: String(query.picUrl || ''),
        at: Date.now(),
      }
      saveDb(db)
    }
    return { status: 200, body: { code: 200, count: Object.keys(db).length } }
  }

  // 默认 list：清理过期后返回，按最近上报排序
  const cutoff = Date.now() - STALE_MS
  for (const k of Object.keys(db)) {
    if ((db[k].at || 0) < cutoff || !db[k].songId) delete db[k]
  }
  saveDb(db)
  const list = Object.values(db)
    .sort((a, b) => (b.at || 0) - (a.at || 0))
    .slice(0, MAX)
    .map((v) => ({ ...v, ts: Math.round(v.at / 1000) }))
  return { status: 200, body: { code: 200, list } }
}
