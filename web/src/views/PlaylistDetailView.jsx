import { useEffect, useState } from 'react'
import { playlistDetail, commentPlaylist, playlistTracks } from '../api/client.js'
import { playAll, toast, useStore } from '../store.js'
import { normalizeSongs, formatCount } from '../utils.js'
import SongRow from '../components/SongRow.jsx'

// 歌单详情页：歌曲列表（/playlist/detail）+ 评论（/comment/playlist）
// manage=true 时（从「我的歌单」进入）显示移除按钮（/playlist/tracks?op=del）
export default function PlaylistDetailView({ id, manage = false }) {
  const [pl, setPl] = useState(null)
  const [songs, setSongs] = useState([])
  const [tab, setTab] = useState('songs')
  const [comments, setComments] = useState([])
  const { user } = useStore()

  useEffect(() => {
    if (!id) return
    setPl(null)
    setSongs([])
    setComments([])
    playlistDetail(id)
      .then((res) => {
        const playlist = res.playlist || res.data?.playlist
        setPl(playlist)
        setSongs(normalizeSongs(playlist.tracks || playlist.songs || []))
      })
      .catch((e) => toast('歌单加载失败：' + e.message, 'error'))
  }, [id])

  const loadComments = () => {
    commentPlaylist(id, 20)
      .then((res) => {
        const hot = res.hotComments || []
        const fresh = res.comments || []
        setComments([...hot, ...fresh])
      })
      .catch(() => {})
  }

  const removeSong = async (song) => {
    try {
      const res = await playlistTracks('del', id, song.id)
      if (res.code === 200) {
        toast('已从歌单移除《' + song.name + '》')
        setSongs(songs.filter((s) => s.id !== song.id))
      } else {
        toast('移除失败：' + (res.message || ''), 'error')
      }
    } catch (e) { toast('移除失败：' + e.message, 'error') }
  }

  if (!pl) return <div className="view"><p className="muted">加载中…</p></div>

  return (
    <div className="view">
      <div className="pl-head">
        {pl.coverImgUrl || pl.picUrl
          ? <img src={(pl.coverImgUrl || pl.picUrl) + '?param=200y200'} alt="" />
          : <div className="cover-lg placeholder" />}
        <div className="pl-meta">
          <h2>{pl.name}</h2>
          <p className="muted">创建者：{pl.creator?.nickname} · 播放 {formatCount(pl.playCount)} 次 · {pl.trackCount || songs.length} 首</p>
          {pl.tags?.length > 0 && <p className="muted">{pl.tags.map((t) => '#' + t).join(' ')}</p>}
          <div className="btn-row">
            <button className="btn primary" disabled={!songs.length} onClick={() => songs.length && playAll(songs)}>▶ 播放全部</button>
            <button className="btn" onClick={() => setTab('comments')}>💬 评论（{pl.commentCount ?? '?'}）</button>
          </div>
          {pl.description && <p className="muted pl-desc">{pl.description}</p>}
        </div>
      </div>
      {tab === 'songs' ? (
        <>
          <div className="song-table-head">
            <span className="song-index">#</span>
            <span className="song-cover" />
            <span className="song-name">歌曲</span>
            <span className="song-artist">歌手</span>
            <span className="song-album">专辑</span>
            <span className="song-duration">时长</span>
            <span className="song-actions" />
          </div>
          {songs.map((s, i) => (
            <SongRow key={s.id} song={s} index={i + 1} queue={songs} manage={manage} onRemove={() => removeSong(s)} />
          ))}
        </>
      ) : (
        <>
          <div className="btn-row">
            <button className="btn small" onClick={loadComments}>加载评论</button>
          </div>
          {comments.map((c) => (
            <div key={c.commentId} className="comment-item">
              <img src={c.user?.avatarUrl + '?param=40y40'} alt="" />
              <div className="comment-main">
                <p><b>{c.user?.nickname}</b>：{c.content}</p>
                <p className="muted">{new Date(c.time).toLocaleString()} · 赞 {c.likedCount}</p>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
