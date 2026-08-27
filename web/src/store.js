// ============================================================================
// 全局状态（极简版，不引入 Redux 等重型方案）
// 用「发布订阅 + useSyncExternalStore」驱动 React 更新
// ============================================================================
import { useSyncExternalStore } from 'react'
import { onApiLog, userPlaylist, playlistTracks } from './api/client.js'

export let state = {
  user: null,          // 当前登录用户（profile 对象）
  myPlaylists: [],     // 当前用户「自己创建」的歌单列表
  queue: [],           // 播放队列（normalize 后的歌曲对象）
  queueIndex: -1,      // 当前播放索引
  playing: false,      // 是否正在播放
  mode: 'order',       // 播放模式：order(列表循环) | single(单曲循环) | random(随机/洗牌播放)
  shuffleOrder: null,  // 随机模式的播放顺序（队列下标的打乱序列）；非随机模式为 null
  currentLyric: [],    // 当前歌曲歌词（[{time, text}]）
  view: { name: 'toplists', params: null },  // 当前页面 {name, params}
  songDetailId: null,  // 歌曲详情弹层
  apiLogOpen: false,   // API 日志面板开关
  lyricsOpen: false,   // 歌词面板开关
  loginOpen: false,    // 登录弹窗开关
  apiLogs: [],         // API 调用日志
  toasts: [],          // 轻提示
}

const listeners = new Set()
export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
export function getState() { return state }
export function setState(patch) {
  state = { ...state, ...patch }
  listeners.forEach((fn) => fn())
}

// 供 React 组件使用的订阅 hook
export function useStore() {
  return useSyncExternalStore(subscribe, getState)
}

// ---------- Toast 轻提示 ----------
let toastId = 0
export function toast(msg, type = 'info') {
  const id = ++toastId
  setState({ toasts: [...state.toasts, { id, msg, type }] })
  setTimeout(() => {
    setState({ toasts: state.toasts.filter((t) => t.id !== id) })
  }, 2800)
}

// ---------- 页面导航 ----------
export function navigate(name, params = null) {
  setState({ view: { name, params } })
}

// ---------- 播放控制 ----------

// 洗牌（Fisher-Yates）：生成「当前歌排第一、其余打乱」的播放顺序表
function buildShuffleOrder(queue, currentIndex) {
  const n = queue.length
  const rest = []
  for (let i = 0; i < n; i++) if (i !== currentIndex) rest.push(i)
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = rest[i]
    rest[i] = rest[j]
    rest[j] = tmp
  }
  return [currentIndex, ...rest]
}

// 切换播放模式：进入随机时生成洗牌顺序（当前歌第一，其余打乱）；退出随机时清除
export function setMode(mode) {
  if (mode === state.mode) return
  let shuffleOrder = null
  if (mode === 'random') {
    shuffleOrder = buildShuffleOrder(state.queue, state.queueIndex)
  }
  setState({ mode, shuffleOrder })
}

// 播放一首歌；若传入 queue 则把整个列表作为播放队列
export function playSong(song, queue = null) {
  let q, idx
  if (queue && queue.length) {
    const i = queue.findIndex((s) => s.id === song.id)
    q = queue
    idx = i >= 0 ? i : 0
  } else {
    const i = state.queue.findIndex((s) => s.id === song.id)
    if (i >= 0) {
      q = state.queue
      idx = i
    } else {
      q = [...state.queue, song]
      idx = state.queue.length
    }
  }
  const patch = { queue: q, queueIndex: idx, playing: true }
  // 随机模式下队列变化后重新洗牌（保持当前歌第一）
  if (state.mode === 'random') patch.shuffleOrder = buildShuffleOrder(q, idx)
  setState(patch)
}

// 整张列表播放（从第一首开始）
export function playAll(songs) {
  if (!songs.length) return
  const patch = { queue: songs, queueIndex: 0, playing: true }
  if (state.mode === 'random') patch.shuffleOrder = buildShuffleOrder(songs, 0)
  setState(patch)
}

// 下一首：随机模式沿洗牌顺序走（到尾回开头）；其他模式顺序循环
export function nextSong() {
  if (!state.queue.length) return
  let idx
  if (state.mode === 'random' && state.shuffleOrder && state.shuffleOrder.length) {
    const pos = state.shuffleOrder.indexOf(state.queueIndex)
    idx = state.shuffleOrder[(pos + 1) % state.shuffleOrder.length]
  } else {
    // 列表循环：顺序播放，播完最后一首回到第一首
    idx = state.queueIndex + 1 >= state.queue.length ? 0 : state.queueIndex + 1
  }
  setState({ queueIndex: idx, playing: true })
}

// 上一首：随机模式沿洗牌顺序回退（到开头则回末尾）；其他模式顺序回退
export function prevSong() {
  if (!state.queue.length) return
  let idx
  if (state.mode === 'random' && state.shuffleOrder && state.shuffleOrder.length) {
    const pos = state.shuffleOrder.indexOf(state.queueIndex)
    const len = state.shuffleOrder.length
    idx = state.shuffleOrder[(pos - 1 + len) % len]
  } else {
    idx = state.queueIndex - 1 < 0 ? state.queue.length - 1 : state.queueIndex - 1
  }
  setState({ queueIndex: idx, playing: true })
}

// ---------- 我的歌单 ----------
// 拉取当前用户自己创建的歌单（用于「加入歌单」菜单和「我的歌单」页）
export async function refreshMyPlaylists(uid) {
  const uid0 = uid || state.user?.userId
  if (!uid0) {
    setState({ myPlaylists: [] })
    return
  }
  try {
    const res = await userPlaylist(uid0, 50)
    const mine = (res.playlist || []).filter((p) => p.creator?.userId === uid0)
    setState({ myPlaylists: mine })
  } catch {
    /* 忽略失败，保持现状 */
  }
}

// 把一首歌加入指定歌单（/playlist/tracks?op=add）
export async function addToPlaylist(pid, song) {
  try {
    const res = await playlistTracks('add', pid, song.id)
    if (res.code === 200) toast('已把《' + song.name + '》加入歌单 ✅')
    else toast('加入失败：' + (res.message || '未知错误'), 'error')
  } catch (e) {
    toast('加入失败：' + e.message, 'error')
  }
}

// ---------- 初始化：把每一次 API 调用写入日志面板 ----------
onApiLog((log) => {
  setState({ apiLogs: [log, ...state.apiLogs].slice(0, 200) })
})
