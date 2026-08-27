import { useEffect, useState } from 'react'
import { useStore, getState, setState, toast, nextSong, prevSong } from '../store.js'
import { resolveSongUrl, lyric } from '../api/client.js'
import { audio } from '../audio.js'
import { formatTime, parseLyric } from '../utils.js'

// 底部播放器：全局唯一 <audio> 的控制中心
// 切歌时调用 /song/url 拿播放地址、/lyric 拿歌词
export default function PlayerBar() {
  const { queue, queueIndex, playing, mode } = useStore()
  const song = queue[queueIndex] || null
  const [progress, setProgress] = useState(0)   // 0-100
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [loading, setLoading] = useState(false)
  const [quality, setQuality] = useState(null)  // 当前实际音质 { br, level, source }

  // 当前歌曲变化 → 获取播放地址 + 歌词
  useEffect(() => {
    if (!song) {
      audio.pause()
      audio.removeAttribute('src')
      setDuration(0)
      setCurrent(0)
      setProgress(0)
      return
    }
    let cancelled = false
    setLoading(true)
    setCurrent(0)
    setProgress(0)
    setDuration(0)
    setQuality(null)
    // 多级取流：标准接口 → v1(超高) → v1(无损) → 下载接口（详见 client.js 的 resolveSongUrl）
    // 音质取决于登录账号：VIP 账号返回完整音质，未登录多为 128k 试听
    resolveSongUrl(song.id)
      .then((res) => {
        if (cancelled) return
        if (!res || !res.url) {
          setLoading(false)
          toast('《' + song.name + '》无可用播放源（版权/会员限制）。登录 VIP 账号后通常可播放', 'error')
          return
        }
        setQuality(res)
        audio.src = res.url
        audio.play().catch(() => setState({ playing: false }))
        setLoading(false)
      })
      .catch((e) => {
        if (!cancelled) {
          setLoading(false)
          toast('获取播放地址失败：' + e.message, 'error')
        }
      })
    // /lyric：同步歌词
    lyric(song.id)
      .then((res) => setState({ currentLyric: parseLyric(res.lrc?.lyric || '') }))
      .catch(() => setState({ currentLyric: [] }))
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.id])

  // 绑定 audio 事件（只绑定一次；回调里通过 getState 读取最新状态避免闭包过期）
  useEffect(() => {
    const onTime = () => {
      setCurrent(audio.currentTime)
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100)
    }
    const onDur = () => setDuration(audio.duration || 0)
    const onPlay = () => setState({ playing: true })
    const onPause = () => setState({ playing: false })
    const onEnded = () => {
      // 播放结束：单曲循环→重播本首；列表循环→顺序播放到尾回第一首；随机播放→随机挑下一首
      // （列表循环与随机播放的逻辑都在 store.js 的 nextSong 里按 mode 处理）
      const { mode } = getState()
      if (mode === 'single') {
        audio.currentTime = 0
        audio.play().catch(() => {})
      } else {
        nextSong()
      }
    }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('durationchange', onDur)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('durationchange', onDur)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 音量
  useEffect(() => { audio.volume = volume }, [volume])

  // 音质标签：根据取流返回的 level / br 展示（登录 VIP 后这里会从 128k 试听变为 320k/无损）
  const qLabel = (() => {
    if (!quality) return ''
    const lvl = (quality.level || '').toLowerCase()
    if (lvl === 'lossless') return '无损'
    if (lvl === 'hires') return 'Hi-Res'
    if (lvl === 'sky') return '环绕声'
    if (lvl === 'jymaster') return '母带'
    const br = quality.br ? Math.round(quality.br / 1000) : 0
    return br >= 320 ? br + 'k' : br + 'k·试听'
  })()

  if (!song) {
    return <div className="playerbar empty">搜索或点击任意歌曲开始播放 🎵（播放地址来自 /song/url 多级取流）</div>
  }

  const togglePlay = () => {
    if (!audio.src) return
    if (audio.paused) audio.play().catch(() => {})
    else audio.pause()
  }
  const onSeek = (e) => {
    const v = +e.target.value
    if (audio.duration) audio.currentTime = (v / 100) * audio.duration
    setProgress(v)
  }
  const modeLabel = { order: '列表循环', single: '单曲循环', random: '随机播放' }[mode]

  return (
    <div className="playerbar">
      <div className="pb-info" title="查看歌曲详情" onClick={() => setState({ songDetailId: song.id })}>
        {song.picUrl ? <img className="pb-cover" src={song.picUrl + '?param=60y60'} alt="" /> : <div className="pb-cover placeholder" />}
        <div className="pb-meta">
          <p className="pb-name">
            {song.name}
            {qLabel && (
              <span className="pb-quality" title={quality ? '音质来源：' + quality.source : ''}>{qLabel}</span>
            )}
          </p>
          <p className="pb-artist">{song.artists}</p>
        </div>
      </div>
      <div className="pb-center">
        <div className="pb-btns">
          <button className="btn-icon" title={'播放模式：' + modeLabel} onClick={() => setState({ mode: mode === 'order' ? 'single' : mode === 'single' ? 'random' : 'order' })}>
            {mode === 'random' ? '🔀' : mode === 'single' ? '🔁' : '🔂'}
          </button>
          <button className="btn-icon" title="上一首" onClick={prevSong}>⏮</button>
          <button className="btn-play" title={playing ? '暂停' : '播放'} onClick={togglePlay}>
            {loading ? '⋯' : playing ? '⏸' : '▶'}
          </button>
          <button className="btn-icon" title="下一首" onClick={nextSong}>⏭</button>
          <button className="btn-icon" title="歌词" onClick={() => setState({ lyricsOpen: !useStore().lyricsOpen })}>📃</button>
        </div>
        <div className="pb-progress">
          <span className="muted">{formatTime(current)}</span>
          <input className="range" type="range" min="0" max="100" step="0.1" value={progress} onChange={onSeek} />
          <span className="muted">{formatTime(duration)}</span>
        </div>
      </div>
      <div className="pb-volume" title="音量">
        <span>🔊</span>
        <input className="range vol" type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(+e.target.value)} />
      </div>
    </div>
  )
}
