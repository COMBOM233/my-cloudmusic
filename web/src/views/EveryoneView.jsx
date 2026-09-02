import { useEffect, useState } from 'react'
import { fetchNowPlaying } from '../api/client.js'
import { playAll, playSong, toast, useStore } from '../store.js'
import { IconUsers } from '../components/icons.jsx'

// 大家在听：展示所有正在使用本站的用户当前播放的歌曲（每 5 秒轮询 /nowplaying）
export default function EveryoneView() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const res = await fetchNowPlaying()
        if (alive) setList(res.list || [])
      } catch (e) {
        if (alive) toast('获取失败：' + e.message, 'error')
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    const timer = setInterval(load, 5000)
    return () => { alive = false; clearInterval(timer) }
  }, [])

  // 把当前所有听众的歌组成播放队列
  const queueSongs = () =>
    list
      .filter((x) => x.songId)
      .map((x) => ({
        id: Number(x.songId),
        name: x.songName,
        artists: x.artists || '',
        album: x.album || '',
        picUrl: x.picUrl || '',
        duration: 0,
      }))

  const playListener = (item) => {
    const songs = queueSongs()
    const song = songs.find((s) => String(s.id) === String(item.songId))
    if (song) playSong(song, songs)
  }

  const timeAgo = (ts) => {
    if (!ts) return ''
    const sec = Math.max(0, Math.floor(Date.now() / 1000 - ts))
    if (sec < 60) return '刚刚'
    if (sec < 3600) return Math.floor(sec / 60) + ' 分钟前'
    return Math.floor(sec / 3600) + ' 小时前'
  }

  const songs = queueSongs()

  return (
    <div className="view">
      <div className="view-head">
        <h2>大家在听</h2>
        <div className="btn-row">
          <button className="btn primary" disabled={!songs.length} onClick={() => { playAll(songs); toast('已开始播放大家在听的歌 🎧') }}>
            播放大家的歌
          </button>
          <span className="muted small">共 {list.length} 位听众 · 每 5 秒刷新</span>
        </div>
      </div>

      {loading && list.length === 0 && <p className="muted">加载中…</p>}
      {!loading && list.length === 0 && (
        <div className="view center">
          <span className="everyone-empty-icon"><IconUsers size={44} /></span>
          <p className="muted">暂时还没有人在听——去播放一首歌，就会出现在这里</p>
        </div>
      )}

      <div className="everyone-list">
        {list.map((v) => (
          <div key={v.vid} className="everyone-item" onClick={() => playListener(v)} title="点击播放这首歌">
            {v.avatar ? (
              <img className="everyone-avatar" src={v.avatar + '?param=100y100'} alt="" loading="lazy" />
            ) : (
              <span className="everyone-avatar fallback"><IconUsers size={20} /></span>
            )}
            {v.picUrl ? (
              <img className="everyone-cover" src={v.picUrl + '?param=100y100'} alt="" loading="lazy" />
            ) : <span className="everyone-cover placeholder" />}
            <div className="everyone-info">
              <p className="everyone-song" title={v.songName}>{v.songName}</p>
              <p className="everyone-sub">{v.artists || '未知歌手'}{v.album ? ' · ' + v.album : ''}</p>
            </div>
            <div className="everyone-who">
              <p className="everyone-name" title={v.name}>{v.name}</p>
              <p className="everyone-meta">{timeAgo(v.ts)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
