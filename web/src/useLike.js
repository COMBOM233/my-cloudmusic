// 红心/取消红心 逻辑（SongRow 与 PlayerBar 共用，避免重复实现）
import { useState } from 'react'
import { useStore, setState, toast } from './store.js'
import { likeSong } from './api/client.js'

export function useLike(songId) {
  const { user } = useStore()
  const [liked, setLiked] = useState(false)

  const toggle = async () => {
    if (!user) {
      toast('请先登录', 'warn')
      setState({ loginOpen: true })
      return
    }
    try {
      await likeSong(songId, !liked)
      setLiked(!liked)
      toast(liked ? '已取消红心' : '已红心 ❤️')
    } catch (e) {
      toast('操作失败：' + e.message, 'error')
    }
  }

  return { liked, toggle }
}
