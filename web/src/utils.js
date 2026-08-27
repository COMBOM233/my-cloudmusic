// 通用工具函数

// 秒 -> mm:ss
export function formatTime(sec) {
  if (!sec || sec < 0 || !isFinite(sec)) return '00:00'
  sec = Math.floor(sec)
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
}

// 大数字 -> 中文习惯的缩写（12345 -> 1.2万）
export function formatCount(n) {
  if (n == null) return ''
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿'
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return String(n)
}

// 把网易云返回的两种歌曲字段结构（ar/al 与 artists/album）统一成一种
export function normalizeSong(s) {
  if (!s) return null
  const ar = s.ar || s.artists || []
  const al = s.al || s.album || {}
  return {
    id: s.id,
    name: s.name,
    artists: ar.map((a) => a.name).join(' / '),
    album: al.name || '',
    picUrl: al.picUrl || '',
    duration: s.dt || s.duration || 0,
    mv: s.mv || 0,
    raw: s,
  }
}

export function normalizeSongs(list) {
  return (list || []).map(normalizeSong).filter(Boolean)
}

// 解析 LRC 格式歌词 -> [{ time(秒), text }]，按时间排序
export function parseLyric(lrc = '') {
  const result = []
  const re = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g
  for (const raw of lrc.split('\n')) {
    const matches = [...raw.matchAll(re)]
    if (!matches.length) continue
    const text = raw.replace(re, '').trim()
    for (const m of matches) {
      const min = +m[1]
      const sec = +m[2]
      const frac = m[3] ? +m[3].padEnd(3, '0') / 1000 : 0
      result.push({ time: min * 60 + sec + frac, text })
    }
  }
  result.sort((a, b) => a.time - b.time)
  return result
}
