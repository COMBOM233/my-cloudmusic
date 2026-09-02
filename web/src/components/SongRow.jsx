import { useState } from 'react'
import { useStore, setState, playSong, toast, addToPlaylist, navigate } from '../store.js'
import { likeSong } from '../api/client.js'
import { formatTime } from '../utils.js'

// 歌曲行（列表里的一行）：序号 / 封面 / 歌名 / 歌手 / 专辑 / 时长
// 悬停时出现操作按钮：播放 ▶、红心 ❤️、加入歌单 ➕
export default function SongRow({ song, index, queue, manage = false, onRemove }) {
  const { user, myPlaylists, queueIndex, queue: curQueue } = useStore()
  const [liked, setLiked] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const isCurrent = curQueue[queueIndex]?.id === song.id

  const handleLike = async (e) => {
    e.stopPropagation()
    if (!user) { toast('请先登录', 'warn'); setState({ loginOpen: true }); return }
    try {
      await likeSong(song.id, !liked)
      setLiked(!liked)
      toast(liked ? '已取消红心' : '已红心 ❤️')
    } catch (err) { toast('操作失败：' + err.message, 'error') }
  }

  return (
    <div className={'song-row' + (isCurrent ? ' current' : '')} onClick={() => playSong(song, queue)}>
      <span className="song-index">{index}</span>
      {song.picUrl ? (
        <img className="song-cover" src={song.picUrl + '?param=60y60'} alt="" loading="lazy" />
      ) : <span className="song-cover placeholder" />}
      <span className="song-name">{song.name}</span>
      {/* 歌手：逐个可点击跳转歌手页 */}
      <span className="song-artist">
        {(song.artistsList && song.artistsList.length ? song.artistsList : [{ id: null, name: song.artists }]).map((a, i) => (
          <span key={i}>
            {i > 0 && <span className="cell-sep"> / </span>}
            {a.id ? (
              <button
                className="cell-link"
                title={'查看歌手：' + a.name}
                onClick={(e) => { e.stopPropagation(); navigate('artist', { id: a.id }) }}
              >{a.name}</button>
            ) : <span>{a.name}</span>}
          </span>
        ))}
      </span>
      {/* 专辑：可点击跳转专辑页 */}
      <span className="song-album">
        {song.albumId ? (
          <button
            className="cell-link"
            title={'查看专辑：' + song.album}
            onClick={(e) => { e.stopPropagation(); navigate('album', { id: song.albumId }) }}
          >{song.album}</button>
        ) : song.album}
      </span>
      <span className="song-duration">{formatTime(song.duration / 1000)}</span>
      <span className="song-actions" onClick={(e) => e.stopPropagation()}>
        <button className="btn-icon" title="播放" onClick={() => playSong(song, queue)}>▶</button>
        <button className="btn-icon" title="红心" onClick={handleLike}>{liked ? '❤️' : '🤍'}</button>
        <span className="add-menu-wrap">
          <button className="btn-icon" title="加入歌单" onClick={() => setMenuOpen(!menuOpen)}>➕</button>
          {menuOpen && (
            <div className="add-menu">
              {!user && <p className="muted small" onClick={() => setState({ loginOpen: true })}>登录后可加入歌单</p>}
              {user && myPlaylists.length === 0 && <p className="muted small">还没有自己的歌单</p>}
              {myPlaylists.map((p) => (
                <button key={p.id} className="add-menu-item" onClick={() => { addToPlaylist(p.id, song); setMenuOpen(false) }}>
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </span>
        {manage && onRemove && (
          <button className="btn-icon danger" title="从歌单移除" onClick={onRemove}>🗑</button>
        )}
      </span>
    </div>
  )
}
