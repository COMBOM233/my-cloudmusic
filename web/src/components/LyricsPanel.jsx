import { useEffect, useRef, useState } from 'react'
import { audio } from '../audio.js'
import { useStore, setState } from '../store.js'

// 全屏歌词面板：根据播放进度高亮当前行，并自动滚动
export default function LyricsPanel() {
  const { lyricsOpen, currentLyric, queue, queueIndex } = useStore()
  const [active, setActive] = useState(-1)
  const listRef = useRef(null)
  const song = queue[queueIndex]

  // 定时（250ms）根据 audio.currentTime 计算当前歌词行
  useEffect(() => {
    if (!lyricsOpen) return
    const t = setInterval(() => {
      const cur = audio.currentTime
      let idx = -1
      for (let i = 0; i < currentLyric.length; i++) {
        if (currentLyric[i].time <= cur) idx = i
        else break
      }
      setActive(idx)
    }, 250)
    return () => clearInterval(t)
  }, [lyricsOpen, currentLyric])

  // 高亮行变化时自动滚动到中间
  useEffect(() => {
    if (active >= 0 && listRef.current?.children?.[active]) {
      listRef.current.children[active].scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [active])

  if (!lyricsOpen) return null

  return (
    <div className="lyrics-overlay" onClick={() => setState({ lyricsOpen: false })}>
      <div className="lyrics-box" onClick={(e) => e.stopPropagation()}>
        <h3>{song?.name} <span className="muted">— {song?.artists}</span></h3>
        <div className="lyrics-list" ref={listRef}>
          {currentLyric.length === 0 && <p className="muted">纯音乐 / 暂无歌词</p>}
          {currentLyric.map((l, i) => (
            <p key={i} className={'lyric-line' + (i === active ? ' active' : '')}>{l.text || '♪'}</p>
          ))}
        </div>
      </div>
    </div>
  )
}
