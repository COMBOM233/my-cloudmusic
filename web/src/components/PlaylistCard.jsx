import { formatCount } from '../utils.js'

// 歌单卡片：封面 + 播放量 + 名称
export default function PlaylistCard({ playlist, onClick }) {
  if (!playlist) return null
  const cover = playlist.coverImgUrl || playlist.picUrl || ''
  return (
    <div className="card" onClick={onClick}>
      <div className="card-cover">
        {cover ? <img src={cover + '?param=200y200'} alt={playlist.name} loading="lazy" /> : <div className="card-cover placeholder" />}
        {playlist.playCount > 0 && <span className="card-playcount">▶ {formatCount(playlist.playCount)}</span>}
      </div>
      <p className="card-name" title={playlist.name}>{playlist.name}</p>
    </div>
  )
}
