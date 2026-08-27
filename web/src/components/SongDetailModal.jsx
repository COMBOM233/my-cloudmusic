import { useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import { songDetail, simiSong, commentMusic, commentLike } from '../api/client.js'
import { useStore, setState, playSong, toast } from '../store.js'
import { normalizeSong, normalizeSongs, formatTime } from '../utils.js'

// 歌曲详情弹层：歌曲信息（/song/detail）+
//                相似歌曲（/simi/song）+
//                热门评论（/comment/music）与评论点赞（/comment/like）
export default function SongDetailModal() {
  const { songDetailId, user } = useStore()
  const [info, setInfo] = useState(null)
  const [simi, setSimi] = useState([])
  const [comments, setComments] = useState([])
  const [liked, setLiked] = useState({})

  const close = () => setState({ songDetailId: null })

  useEffect(() => {
    if (!songDetailId) return
    setInfo(null)
    setSimi([])
    setComments([])
    songDetail(songDetailId)
      .then((res) => setInfo(normalizeSong(res.songs?.[0])))
      .catch(() => {})
    simiSong(songDetailId)
      .then((res) => setSimi(normalizeSongs(res.songs || res.data?.songs)))
      .catch(() => {})
    commentMusic(songDetailId, 15)
      .then((res) => {
        const hot = res.hotComments || []
        const fresh = res.comments || []
        setComments([...hot, ...fresh])
      })
      .catch(() => {})
  }, [songDetailId])

  const likeComment = async (cid) => {
    if (!user) { toast('请先登录', 'warn'); setState({ loginOpen: true }); return }
    try {
      const t = liked[cid] ? 0 : 1
      await commentLike(songDetailId, cid, 1, t)
      setLiked((p) => ({ ...p, [cid]: !p[cid] }))
      toast(t ? '已点赞 👍' : '已取消点赞')
    } catch (e) {
      toast('点赞失败：' + e.message, 'error')
    }
  }

  return (
    <Modal open={!!songDetailId} onClose={close} title="歌曲详情" width={760}>
      {info && (
        <div className="song-detail-head">
          {info.picUrl ? <img src={info.picUrl + '?param=150y150'} alt="" /> : <div className="cover-lg placeholder" />}
          <div className="song-detail-meta">
            <h2>{info.name}</h2>
            <p>歌手：{info.artists}</p>
            <p>专辑：{info.album}</p>
            <p>时长：{formatTime(info.duration / 1000)}</p>
            <button className="btn primary" onClick={() => playSong(info)}>▶ 播放这首歌</button>
          </div>
        </div>
      )}
      <h4>相似歌曲（/simi/song）</h4>
      {simi.length === 0 && <p className="muted">加载中…</p>}
      {simi.map((s, i) => (
        <div key={s.id} className="song-row" onClick={() => playSong(s, simi)}>
          <span className="song-index">{i + 1}</span>
          <span className="song-name">{s.name}</span>
          <span className="song-artist">{s.artists}</span>
          <span className="song-duration">{formatTime(s.duration / 1000)}</span>
          <span className="song-actions"><button className="btn-icon" title="播放">▶</button></span>
        </div>
      ))}
      <h4>热门评论（/comment/music）</h4>
      {comments.length === 0 && <p className="muted">暂无评论</p>}
      {comments.map((c) => (
        <div key={c.commentId} className="comment-item">
          <img src={c.user?.avatarUrl + '?param=40y40'} alt="" />
          <div className="comment-main">
            <p><b>{c.user?.nickname}</b>：{c.content}</p>
            <p className="muted">{new Date(c.time).toLocaleString()} · 赞 {c.likedCount}</p>
          </div>
          <button className="btn small" onClick={() => likeComment(c.commentId)}>
            {liked[c.commentId] ? '👍 已赞' : '👍 点赞'}
          </button>
        </div>
      ))}
    </Modal>
  )
}
