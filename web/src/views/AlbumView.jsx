import { useEffect, useState } from 'react'
import { album } from '../api/client.js'
import { playAll, toast, navigate } from '../store.js'
import { normalizeSongs } from '../utils.js'
import SongRow from '../components/SongRow.jsx'

// 专辑页：/album 返回专辑信息 + 歌曲列表
export default function AlbumView({ id }) {
  const [albumInfo, setAlbumInfo] = useState(null)
  const [songs, setSongs] = useState([])

  useEffect(() => {
    if (!id) return
    setAlbumInfo(null)
    setSongs([])
    album(id)
      .then((res) => {
        setAlbumInfo(res.album || res.data?.album)
        setSongs(normalizeSongs(res.songs || res.data?.songs))
      })
      .catch((e) => toast('专辑加载失败：' + e.message, 'error'))
  }, [id])

  return (
    <div className="view">
      <div className="pl-head">
        {albumInfo?.picUrl
          ? <img src={albumInfo.picUrl + '?param=200y200'} alt="" />
          : <div className="cover-lg placeholder" />}
        <div className="pl-meta">
          <h2>{albumInfo?.name || '加载中…'}</h2>
          {albumInfo && (
            <>
              <p className="muted">歌手：{albumInfo.artist?.name || '未知'} · 发行：{albumInfo.publishTime ? new Date(albumInfo.publishTime).toLocaleDateString() : '未知'}</p>
              <div className="btn-row">
                <button className="btn primary" disabled={!songs.length} onClick={() => songs.length && playAll(songs)}>▶ 播放整张专辑</button>
                {albumInfo.artist && <button className="btn" onClick={() => navigate('artist', { id: albumInfo.artist.id })}>查看歌手</button>}
              </div>
              {albumInfo.description && <p className="muted pl-desc">{albumInfo.description}</p>}
            </>
          )}
        </div>
      </div>
      <h3>歌曲列表（/album）</h3>
      {songs.map((s, i) => <SongRow key={s.id} song={s} index={i + 1} queue={songs} />)}
    </div>
  )
}
