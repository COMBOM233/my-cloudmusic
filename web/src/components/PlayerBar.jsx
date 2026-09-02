import { useEffect, useState } from 'react'
import { useStore, getState, setState, toast, nextSong, prevSong, setMode, viewerInfo } from '../store.js'
import { resolveSongUrl, lyric, reportNowPlaying } from '../api/client.js'
import { audio } from '../audio.js'
import { formatTime, parseLyric } from '../utils.js'
import { IconPrev, IconPlay, IconPause, IconNext, IconRepeat, IconRepeatOne, IconShuffle, IconNote, IconHeart, IconVolume } from './icons.jsx'
import { useLike } from '../useLike.js'

// 底部播放器（Melodia 风格）：顶部发光进度条 + 圆形播放键 + 等宽时间
export default function PlayerBar() {
  const { queue, queueIndex, playing, mode } = useStore()
  const song = queue[queueIndex] || null
  const { liked, toggle: toggleLike } = useLike(song?.id)
  const [progress, setProgress] = useState(0)   // 0-100
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [loading, setLoading] = useState(false)
  const [quality, setQuality] = useState(null)

  // 当前歌曲变化 → 多级取流 + 歌词
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
    // 多级取流：标准 → v1(exhigh) → v1(lossless) → download（详见 client.js resolveSongUrl）
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
    lyric(song.id)
      .then((res) => setState({ currentLyric: parseLyric(res.lrc?.lyric || '') }))
      .catch(() => setState({ currentLyric: [] }))
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.id])

  // 绑定 audio 事件（播放进度、结束行为）
  useEffect(() => {
    const onTime = () => {
      setCurrent(audio.currentTime)
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100)
    }
    const onDur = () => setDuration(audio.duration || 0)
    const onPlay = () => setState({ playing: true })
    const onPause = () => setState({ playing: false })
    const onEnded = () => {
      // 单曲循环→重播本首；列表循环/随机（洗牌）→交给 nextSong 按 mode 处理
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

  // 「大家在听」上报：真正开始播放时上报，播放期间每分钟心跳续期
  useEffect(() => {
    if (!song || !getState().playing || !audio.src) return
    const report = () => {
      reportNowPlaying({
        ...viewerInfo(),
        songId: song.id,
        songName: song.name,
        artists: song.artists,
        album: song.album,
        picUrl: song.picUrl || '',
      }).catch(() => {})
    }
    report()
    const timer = setInterval(report, 60000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.id, playing])

  if (!song) {
    return <div className="playerbar empty">搜索或点击歌曲开始播放 · MyMusic</div>
  }

  const togglePlay = () => {
    if (!audio.src) return
    if (audio.paused) audio.play().catch(() => {})
    else audio.pause()
  }

  // 点击顶部进度条跳转
  const seekByClick = (e) => {
    if (!audio.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    audio.currentTime = ratio * audio.duration
    setProgress(ratio * 100)
  }

  // 音质标签
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

  const modeIcon = mode === 'random' ? <IconShuffle size={19} /> : mode === 'single' ? <IconRepeatOne size={19} /> : <IconRepeat size={19} />
  const modeLabel = mode === 'random' ? '随机播放（洗牌）' : mode === 'single' ? '单曲循环' : '列表循环'

  return (
    <div className="playerbar">
      {/* 顶部发光进度条 */}
      <div className="pb-progress-top" onClick={seekByClick}>
        <div className="pb-progress-track">
          <div className="pb-progress-fill" style={{ width: progress + '%' }} />
          <div className="pb-progress-handle" style={{ left: progress + '%' }} />
        </div>
      </div>

      {/* 左：封面 + 信息 + 红心 */}
      <div className="pb-left">
        {song.picUrl
          ? <img className="pb-cover" src={song.picUrl + '?param=120y120'} alt="" onClick={() => setState({ songDetailId: song.id })} />
          : <div className="pb-cover placeholder" onClick={() => setState({ songDetailId: song.id })} />}
        <div className="pb-meta" onClick={() => setState({ songDetailId: song.id })}>
          <p className="pb-name">
            {song.name}
            {qLabel && <span className="pb-quality" title={quality ? '音质来源：' + quality.source : ''}>{qLabel}</span>}
          </p>
          <p className="pb-artist">{song.artists}</p>
        </div>
        <button className={'pb-like' + (liked ? ' on' : '')} title={liked ? '取消红心' : '红心'} onClick={toggleLike}>
          <IconHeart size={20} filled={liked} />
        </button>
      </div>

      {/* 中：控制 + 时间 */}
      <div className="pb-center">
        <div className="pb-btns">
          <button className={'pb-ctl' + (mode !== 'order' ? ' mode-on' : '')} title={'播放模式：' + modeLabel} onClick={() => setMode(mode === 'order' ? 'single' : mode === 'single' ? 'random' : 'order')}>
            {modeIcon}
          </button>
          <button className="pb-ctl" title="上一首" onClick={prevSong}><IconPrev size={19} /></button>
          <button className="btn-play" title={playing ? '暂停' : '播放'} onClick={togglePlay}>
            {loading ? <span style={{ fontSize: 12 }}>···</span> : playing ? <IconPause size={18} /> : <IconPlay size={18} className="ic-play" />}
          </button>
          <button className="pb-ctl" title="下一首" onClick={nextSong}><IconNext size={19} /></button>
          <button className="pb-ctl" title="歌词" onClick={() => setState({ lyricsOpen: !getState().lyricsOpen })}><IconNote size={19} /></button>
        </div>
        <div className="pb-time">
          <span>{formatTime(current)}</span>
          <span className="sep">/</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* 右：音量 */}
      <div className="pb-right">
        <div className="pb-volume">
          <IconVolume size={19} />
          <input className="range vol" type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(+e.target.value)} />
        </div>
      </div>
    </div>
  )
}
