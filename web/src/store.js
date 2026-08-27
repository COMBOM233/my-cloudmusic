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
  mode: 'order',       // 播放模式：order(列表循环) | single(单曲循环) | random(随机播放)
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
// 播放一首歌；若传入 queue 则把整个列表作为播放队列
export function playSong(song, queue = null) {
  if (queue && queue.length) {
    const idx = queue.findIndex((s) => s.id === song.id)
    setState({ queue, queueIndex: idx >= 0 ? idx : 0, playing: true })
  } else {
    const idx = state.queue.findIndex((s) => s.id === song.id)
    if (idx >= 0) {
      setState({ queueIndex: idx, playing: true })
    } else {
      setState({ queue: [...state.queue, song], queueIndex: state.queue.length, playing: true })
    }
  }
}

// 整张列表播放（从第一首开始）
export function playAll(songs) {
  if (!songs.length) return
  setState({ queue: songs, queueIndex: 0, playing: true })
}

export function nextSong() {
  if (!state.queue.length) return
  let idx
  if (state.mode === 'random' && state.queue.length > 1) {
    // 随机播放：随机挑一首（避免与当前相同）
    do {
      idx = Math.floor(Math.random() * state.queue.length)
    } while (idx === state.queueIndex)
  } else {
    // 列表循环：顺序播放，播完最后一首回到第一首
    idx = state.queueIndex + 1 >= state.queue.length ? 0 : state.queueIndex + 1
  }
  setState({ queueIndex: idx, playing: true })
}

export function prevSong() {
  if (!state.queue.length) return
  let idx
  if (state.mode === 'random' && state.queue.length > 1) {
    // 随机播放：随机挑一首（避免与当前相同）
    do {
      idx = Math.floor(Math.random() * state.queue.length)
    } while (idx === state.queueIndex)
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
