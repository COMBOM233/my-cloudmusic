import { useEffect, useState } from 'react'
import { topPlaylist, playlistCatlist, personalized } from '../api/client.js'
import { navigate, toast } from '../store.js'
import PlaylistCard from '../components/PlaylistCard.jsx'

// 歌单广场：分类（/playlist/catlist）+ 热门歌单（/top/playlist）+ 推荐歌单（/personalized）
export default function PlaylistsView() {
  const [cats, setCats] = useState([])
  const [cat, setCat] = useState('全部')
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(false)
  const [recs, setRecs] = useState([])

  useEffect(() => {
    playlistCatlist()
      .then((res) => setCats(res.categories ? Object.values(res.categories) : []))
      .catch(() => {})
    personalized(12)
      .then((res) => setRecs(res.result || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    topPlaylist(cat, 30)
      .then((res) => setLists(res.playlists || res.data?.playlists || []))
      .catch((e) => toast('歌单加载失败：' + e.message, 'error'))
      .finally(() => setLoading(false))
  }, [cat])

  return (
    <div className="view">
      <div className="view-head"><h2>歌单广场</h2></div>
      <div className="cat-tabs">
        <button className={'tab' + (cat === '全部' ? ' on' : '')} onClick={() => setCat('全部')}>全部</button>
        {cats.map((c) => (
          <button key={c} className={'tab' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      {recs.length > 0 && cat === '全部' && (
        <>
          <h3>🎁 为你推荐（/personalized）</h3>
          <div className="card-grid">
            {recs.map((p) => <PlaylistCard key={p.id} playlist={p} onClick={() => navigate('playlist', { id: p.id })} />)}
          </div>
        </>
      )}
      <h3>{cat} · 热门（/top/playlist）</h3>
      {loading && <p className="muted">加载中…</p>}
      <div className="card-grid">
        {lists.map((p) => <PlaylistCard key={p.id} playlist={p} onClick={() => navigate('playlist', { id: p.id })} />)}
      </div>
    </div>
  )
}
