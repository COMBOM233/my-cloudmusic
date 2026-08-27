import { useEffect, useState } from 'react'
import { userPlaylist, playlistCreate, playlistDelete } from '../api/client.js'
import { navigate, toast, useStore, setState } from '../store.js'

// 我的歌单：登录后可创建（/playlist/create）、删除（/playlist/delete）自己的歌单
export default function MyPlaylistsView() {
  const { user } = useStore()
  const [mine, setMine] = useState([])
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)

  const load = async () => {
    if (!user) return
    try {
      const res = await userPlaylist(user.userId, 50)
      const all = res.playlist || res.data?.playlist || []
      // 只展示自己创建的歌单
      setMine(all.filter((p) => p.creator?.userId === user.userId))
    } catch (e) { toast('加载歌单失败：' + e.message, 'error') }
  }

  useEffect(() => { load() }, [user?.userId])

  const create = async () => {
    if (!name.trim()) { toast('请输入歌单名称', 'warn'); return }
    setCreating(true)
    try {
      const res = await playlistCreate(name.trim())
      if (res.code === 200) {
        toast('歌单创建成功！')
        const pid = res.playlist?.id || res.data?.playlist?.id
        setName('')
        await load()
        if (pid) navigate('playlist', { id: pid, manage: true })
      } else {
        toast('创建失败：' + (res.message || ''), 'error')
      }
    } catch (e) { toast('创建失败：' + e.message, 'error') }
    finally { setCreating(false) }
  }

  const del = async (p) => {
    if (!window.confirm('确定删除歌单「' + p.name + '」吗？')) return
    try {
      const res = await playlistDelete(p.id)
      if (res.code === 200) { toast('已删除'); load() }
      else toast('删除失败：' + (res.message || ''), 'error')
    } catch (e) { toast('删除失败：' + e.message, 'error') }
  }

  if (!user) {
    return (
      <div className="view center">
        <h2>我的歌单</h2>
        <p className="muted">登录后才能查看和创建自己的歌单</p>
        <button className="btn primary" onClick={() => setState({ loginOpen: true })}>去登录（扫码）</button>
      </div>
    )
  }

  return (
    <div className="view">
      <div className="view-head">
        <h2>我的歌单</h2>
        <span className="muted">共 {mine.length} 个</span>
      </div>
      <div className="create-box">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="新歌单名称…"
          onKeyDown={(e) => e.key === 'Enter' && create()}
        />
        <button className="btn primary" onClick={create} disabled={creating}>{creating ? '创建中…' : '＋ 创建歌单（/playlist/create）'}</button>
      </div>
      <div className="card-grid">
        {mine.map((p) => (
          <div key={p.id} className="card">
            <div className="card-cover">
              {p.coverImgUrl || p.picUrl
                ? <img src={(p.coverImgUrl || p.picUrl) + '?param=200y200'} alt={p.name} loading="lazy" onClick={() => navigate('playlist', { id: p.id, manage: true })} />
                : <div className="card-cover placeholder" onClick={() => navigate('playlist', { id: p.id, manage: true })} />}
              <button className="card-del" title="删除歌单" onClick={() => del(p)}>🗑</button>
            </div>
            <p className="card-name" onClick={() => navigate('playlist', { id: p.id, manage: true })}>{p.name}</p>
          </div>
        ))}
        {mine.length === 0 && <p className="muted">还没有歌单，创建一个吧！</p>}
      </div>
    </div>
  )
}
