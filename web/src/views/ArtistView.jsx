import { useEffect, useState } from 'react'
import { artistDetail, artistSongs, artistAlbum, artistDesc } from '../api/client.js'
import { navigate, playAll, toast } from '../store.js'
import { normalizeSongs, formatCount } from '../utils.js'
import SongRow from '../components/SongRow.jsx'

// 歌手页：/artist/detail + /artists（热门50首）+ /artist/album + /artist/desc
export default function ArtistView({ id }) {
  const [artist, setArtist] = useState(null)
  const [hot, setHot] = useState([])
  const [albums, setAlbums] = useState([])
  const [desc, setDesc] = useState('')

  useEffect(() => {
    if (!id) return
    setArtist(null)
    setHot([])
    setAlbums([])
    setDesc('')
    artistDetail(id).then((res) => setArtist(res.data?.artist || res.artist)).catch(() => {})
    artistSongs(id)
      .then((res) => setHot(normalizeSongs(res.hotSongs || res.data?.hotSongs)))
      .catch((e) => toast('歌手歌曲加载失败：' + e.message, 'error'))
    artistAlbum(id, 20)
      .then((res) => setAlbums(res.hotAlbums || res.data?.hotAlbums || []))
      .catch(() => {})
    artistDesc(id)
      .then((res) => setDesc(res.data?.briefDesc || res.briefDesc || ''))
      .catch(() => {})
  }, [id])

  return (
    <div className="view">
      <div className="pl-head">
        {artist?.picUrl
          ? <img src={artist.picUrl + '?param=200y200'} alt="" />
          : <div className="cover-lg placeholder" />}
        <div className="pl-meta">
          <h2>{artist?.name || '加载中…'}</h2>
          {artist && <p className="muted">粉丝 {formatCount(artist.fansCount)} · 歌曲 {artist.musicSize} · 专辑 {artist.albumSize}</p>}
          <div className="btn-row">
            <button className="btn primary" disabled={!hot.length} onClick={() => hot.length && playAll(hot)}>▶ 播放热门 50 首</button>
          </div>
          {desc && <p className="muted pl-desc">{desc}</p>}
        </div>
      </div>
      <h3>热门歌曲（/artists）</h3>
      {hot.map((s, i) => <SongRow key={s.id} song={s} index={i + 1} queue={hot} />)}
      <h3>专辑（/artist/album）</h3>
      <div className="card-grid">
        {albums.map((a) => (
          <div key={a.id} className="card" onClick={() => navigate('album', { id: a.id })}>
            <div className="card-cover">
              {a.picUrl ? <img src={a.picUrl + '?param=200y200'} alt={a.name} loading="lazy" /> : <div className="card-cover placeholder" />}
            </div>
            <p className="card-name">{a.name}<br /><span className="muted">{a.publishTime ? new Date(a.publishTime).getFullYear() : ''}</span></p>
          </div>
        ))}
      </div>
    </div>
  )
}
