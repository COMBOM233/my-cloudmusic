import { useEffect } from 'react'
import { useStore, setState, navigate, toast } from './store.js'
import { logout, loginStatus, setAuthCookie, getAuthCookie } from './api/client.js'
import ToplistsView from './views/ToplistsView.jsx'
import PlaylistsView from './views/PlaylistsView.jsx'
import PlaylistDetailView from './views/PlaylistDetailView.jsx'
import MyPlaylistsView from './views/MyPlaylistsView.jsx'
import SearchView from './views/SearchView.jsx'
import ArtistView from './views/ArtistView.jsx'
import AlbumView from './views/AlbumView.jsx'
import ApiDocsView from './views/ApiDocsView.jsx'
import PlayerBar from './components/PlayerBar.jsx'
import LyricsPanel from './components/LyricsPanel.jsx'
import ApiLogDrawer from './components/ApiLogDrawer.jsx'
import LoginModal from './components/LoginModal.jsx'
import SongDetailModal from './components/SongDetailModal.jsx'

const NAV = [
  { name: 'toplists', label: '🏆 排行榜' },
  { name: 'playlists', label: '🎵 歌单广场' },
  { name: 'my', label: '📁 我的歌单' },
  { name: 'search', label: '🔍 搜索' },
  { name: 'docs', label: '📖 API 使用说明' },
]

export default function App() {
  const s = useStore()
  const { view, user, toasts } = s

  // 启动时恢复登录态（服务端 cookie 若仍在则自动恢复）
  useEffect(() => {
    loginStatus()
      .then((res) => {
        const profile = res.data?.profile
        if (profile) setState({ user: profile })
      })
      .catch(() => {})
  }, [])

  const doLogout = async () => {
    try { await logout() } catch { /* 忽略 */ }
    setAuthCookie('')
    setState({ user: null, myPlaylists: [] })
    toast('已退出登录')
  }

  // 复制登录 cookie：部署到服务器时填入 .env 的 NETEASE_COOKIE 即可固化登录态
  const copyCookie = async () => {
    const c = getAuthCookie()
    if (!c) { toast('当前没有登录 Cookie（请先扫码登录）', 'warn'); return }
    try {
      await navigator.clipboard.writeText(c)
      toast('登录 Cookie 已复制 ✅ 可填入 .env 的 NETEASE_COOKIE')
    } catch {
      toast('复制失败，请手动从 /login/qr/check 响应中复制', 'error')
    }
  }

  let content
  if (view.name === 'toplists') content = <ToplistsView />
  else if (view.name === 'playlists') content = <PlaylistsView />
  else if (view.name === 'my') content = <MyPlaylistsView />
  else if (view.name === 'search') content = <SearchView />
  else if (view.name === 'playlist') content = <PlaylistDetailView id={view.params?.id} manage={!!view.params?.manage} />
  else if (view.name === 'artist') content = <ArtistView id={view.params?.id} />
  else if (view.name === 'album') content = <AlbumView id={view.params?.id} />
  else if (view.name === 'docs') content = <ApiDocsView />
  else content = <ToplistsView />

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">🎧 网易云 API 演示站</div>
        <nav className="nav">
          {NAV.map((n) => (
            <button
              key={n.name}
              className={'nav-item' + (view.name === n.name ? ' on' : '')}
              onClick={() => navigate(n.name)}
            >
              {n.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {user ? (
            <div className="user-box">
              <img className="avatar" src={user.avatarUrl + '?param=60y60'} alt="" />
              <div className="user-meta">
                <p className="user-name" title={user.nickname}>{user.nickname}</p>
                <div className="user-links">
                  <button className="link" onClick={copyCookie}>复制登录 Cookie</button>
                  <button className="link" onClick={doLogout}>退出登录</button>
                </div>
              </div>
            </div>
          ) : (
            <button className="btn primary block" onClick={() => setState({ loginOpen: true })}>登录（扫码）</button>
          )}
          <button
            className={'link api-log-toggle' + (s.apiLogs.length ? ' has' : '')}
            onClick={() => setState({ apiLogOpen: !s.apiLogOpen })}
          >
            📡 API 调用日志{s.apiLogs.length ? '（' + s.apiLogs.length + '）' : ''}
          </button>
        </div>
      </aside>
      <main className="main">{content}</main>
      <PlayerBar />
      <LyricsPanel />
      <ApiLogDrawer />
      <LoginModal />
      <SongDetailModal />
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={'toast ' + t.type}>{t.msg}</div>
        ))}
      </div>
    </div>
  )
}
