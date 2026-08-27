import { useEffect, useState } from 'react'
import { toplist, banner, recommendSongs } from '../api/client.js'
import { navigate, playAll, toast, useStore, setState } from '../store.js'
import { normalizeSongs } from '../utils.js'

// 发现页：轮播图（/banner）+ 排行榜（/toplist）+ 每日推荐（/recommend/songs，需登录）
export default function ToplistsView() {
  const [lists, setLists] = useState([])
  const [banners, setBanners] = useState([])
  const [bannerIdx, setBannerIdx] = useState(0)
  const { user } = useStore()

  useEffect(() => {
    toplist()
      .then((res) => setLists(res.list || res.data?.list || []))
      .catch((e) => toast('榜单加载失败：' + e.message, 'error'))
    banner()
      .then((res) => setBanners((res.banners || []).slice(0, 5)))
      .catch(() => {})
  }, [])

  // 轮播自动切换
  useEffect(() => {
    if (!banners.length) return
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % banners.length), 5000)
    return () => clearInterval(t)
  }, [banners])

  const openBanner = () => {
    const b = banners[bannerIdx]
    if (!b) return
    if (b.targetType === 1000 && b.targetId) navigate('playlist', { id: b.targetId })
    else if (b.targetType === 1 && b.targetId) setState({ songDetailId: b.targetId })
    else if (b.targetType === 10 && b.targetId) navigate('album', { id: b.targetId })
  }

  const daily = async () => {
    if (!user) { toast('每日推荐需要登录', 'warn'); setState({ loginOpen: true }); return }
    try {
      const res = await recommendSongs()
      const songs = normalizeSongs(res.data?.dailySongs || [])
      if (!songs.length) { toast('今日暂无推荐（可能未登录成功）', 'warn'); return }
      playAll(songs)
      toast('已开始播放每日推荐（' + songs.length + ' 首）🎧')
    } catch (e) { toast('每日推荐失败：' + e.message, 'error') }
  }

  return (
    <div className="view">
      {banners.length > 0 && (
        <div className="banner" onClick={openBanner}>
          <img src={banners[bannerIdx]?.imageUrl} alt="" />
          <div className="banner-dots" onClick={(e) => e.stopPropagation()}>
            {banners.map((_, i) => (
              <span key={i} className={i === bannerIdx ? 'on' : ''} onClick={() => setBannerIdx(i)} />
            ))}
          </div>
        </div>
      )}
      <div className="view-head">
        <h2>排行榜</h2>
        <button className="btn" onClick={daily}>🎧 每日推荐（需登录）</button>
      </div>
      <div className="card-grid">
        {lists.map((l) => (
          <div key={l.id} className="card" onClick={() => navigate('playlist', { id: l.id })}>
            <div className="card-cover">
              {l.coverImgUrl ? <img src={l.coverImgUrl + '?param=200y200'} alt={l.name} loading="lazy" /> : <div className="card-cover placeholder" />}
            </div>
            <p className="card-name" title={l.name}>{l.name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
