import { useEffect, useState } from 'react'
import { search } from '../api/client.js'
import { playAll, navigate, toast } from '../store.js'
import { normalizeSongs } from '../utils.js'
import SongRow from '../components/SongRow.jsx'
import PlaylistCard from '../components/PlaylistCard.jsx'

// 搜索页：/search，支持 单曲/歌单/歌手/专辑 四种类型
const TYPES = [
  { value: 1, label: '单曲' },
  { value: 1000, label: '歌单' },
  { value: 100, label: '歌手' },
  { value: 10, label: '专辑' },
]

export default function SearchView() {
  const [kw, setKw] = useState('海阔天空')
  const [type, setType] = useState(1)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const doSearch = async (k = kw, t = type) => {
    const keyword = k.trim()
    if (!keyword) { toast('请输入搜索关键词', 'warn'); return }
    setLoading(true)
    setSearched(false)
    try {
      const res = await search(keyword, t, 30)
      const d = res.result || res.data?.result || {}
      setResults({
        songs: normalizeSongs(d.songs || []),
        playlists: d.playlists || [],
        artists: d.artists || [],
        albums: d.albums || [],
      })
      setSearched(true)
    } catch (e) {
      toast('搜索失败：' + e.message, 'error')
      setResults({ songs: [], playlists: [], artists: [], albums: [] })
    } finally {
      setLoading(false)
    }
  }

  // 首次进入自动搜索示例关键词
  useEffect(() => { doSearch('海阔天空', 1) }, []) // eslint-disable-line

  const switchType = (t) => {
    setType(t)
    doSearch(kw, t)
  }

  return (
    <div className="view">
      <div className="search-bar">
        <input
          className="search-input"
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && doSearch()}
          placeholder="搜索歌曲 / 歌单 / 歌手 / 专辑…"
        />
        <button className="btn primary" onClick={() => doSearch()} disabled={loading}>{loading ? '搜索中…' : '🔍 搜索'}</button>
      </div>
      <div className="cat-tabs">
        {TYPES.map((t) => (
          <button key={t.value} className={'tab' + (type === t.value ? ' on' : '')} onClick={() => switchType(t.value)}>
            {t.label}
          </button>
        ))}
      </div>
      {searched && type === 1 && (
        <>
          <h3>单曲结果（{results?.songs?.length || 0}）</h3>
          {results?.songs?.map((s, i) => (
            <SongRow key={s.id} song={s} index={i + 1} queue={results.songs} />
          ))}
          {results?.songs?.length > 0 && (
            <button className="btn" onClick={() => playAll(results.songs)}>▶ 播放全部结果</button>
          )}
        </>
      )}
      {searched && type === 1000 && (
        <>
          <h3>歌单结果（{results?.playlists?.length || 0}）</h3>
          <div className="card-grid">
            {results.playlists.map((p) => <PlaylistCard key={p.id} playlist={p} onClick={() => navigate('playlist', { id: p.id })} />)}
          </div>
        </>
      )}
      {searched && type === 100 && (
        <>
          <h3>歌手结果（{results?.artists?.length || 0}）</h3>
          <div className="artist-list">
            {results.artists.map((a) => (
              <div key={a.id} className="artist-item" onClick={() => navigate('artist', { id: a.id })}>
                {a.picUrl ? <img src={a.picUrl + '?param=100y100'} alt="" loading="lazy" /> : <div className="artist-avatar placeholder" />}
                <p>{a.name}</p>
              </div>
            ))}
          </div>
        </>
      )}
      {searched && type === 10 && (
        <>
          <h3>专辑结果（{results?.albums?.length || 0}）</h3>
          <div className="card-grid">
            {results.albums.map((a) => (
              <div key={a.id} className="card" onClick={() => navigate('album', { id: a.id })}>
                <div className="card-cover">
                  {a.picUrl ? <img src={a.picUrl + '?param=200y200'} alt={a.name} loading="lazy" /> : <div className="card-cover placeholder" />}
                </div>
                <p className="card-name">{a.name}<br /><span className="muted">{a.artist?.name}</span></p>
              </div>
            ))}
          </div>
        </>
      )}
      {searched && results && !results.songs.length && !results.playlists.length && !results.artists.length && !results.albums.length && (
        <p className="muted">没有找到相关结果</p>
      )}
    </div>
  )
}
