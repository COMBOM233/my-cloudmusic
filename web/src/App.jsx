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
import { IconHome, IconCompass, IconLibrary, IconSearch, IconBook, IconTerminal, IconUser, IconUsers } from './components/icons.jsx'
import EveryoneView from './views/EveryoneView.jsx'

// 侧边栏导航（Melodia 风格：SVG 图标 + 激活态强调条）
const NAV = [
  { name: 'toplists', label: '首页', icon: IconHome },
  { name: 'playlists', label: '发现', icon: IconCompass },
  { name: 'my', label: '我的歌单', icon: IconLibrary },
  { name: 'search', label: '搜索', icon: IconSearch },
  { name: 'everyone', label: '大家在听', icon: IconUsers },
  { name: 'docs', label: 'API 文档', icon: IconBook },
]

export default function App() {
  const s = useStore()
  const { view, user, toasts } = s

  // 启动时恢复登录态
  useEffect(() => {
    loginStatus()
      .then((res) => {
        const profile = res.data?.profile
        if (profile) setState({ user: profile })
      })
      .catch(() => {})
  }, [])

  const goSearch = (kw) => {
    if (!kw.trim()) return
    navigate('search', { q: kw.trim() })
  }

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

  const doLogout = async () => {
    try { await logout() } catch { /* 忽略 */ }
    setAuthCookie('')
    setState({ user: null, myPlaylists: [] })
    toast('已退出登录')
  }

  let content
  if (view.name === 'toplists') content = <ToplistsView />
  else if (view.name === 'playlists') content = <PlaylistsView />
  else if (view.name === 'my') content = <MyPlaylistsView />
  else if (view.name === 'search') content = <SearchView />
  else if (view.name === 'everyone') content = <EveryoneView />
  else if (view.name === 'playlist') content = <PlaylistDetailView id={view.params?.id} manage={!!view.params?.manage} />
  else if (view.name === 'artist') content = <ArtistView id={view.params?.id} />
  else if (view.name === 'album') content = <AlbumView id={view.params?.id} />
  else if (view.name === 'docs') content = <ApiDocsView />
  else content = <ToplistsView />

  return (
    <div className="app">
      {/* 极光动态背景 */}
      <div className="aurora" aria-hidden="true">
        <div className="aurora-blob b1" />
        <div className="aurora-blob b2" />
        <div className="aurora-blob b3" />
        <div className="aurora-vignette" />
      </div>

      {/* 侧边栏 */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo" title={user ? user.nickname : '点击登录'} onClick={() => setState({ loginOpen: true })}>
            {user ? (
              <img className="logo-avatar" src={user.avatarUrl + '?param=100y100'} alt="" />
            ) : (
              <span className="logo-icon"><IconUser size={17} /></span>
            )}
            <span className="logo-text">MyMusic</span>
          </div>
          <button
            className={'sidebar-top-btn' + (s.apiLogs.length ? ' has' : '')}
            title="API 调用日志"
            onClick={() => setState({ apiLogOpen: !s.apiLogOpen })}
          >
            <IconTerminal size={15} />
            <span>{s.apiLogs.length ? s.apiLogs.length : ''}</span>
          </button>
        </div>

        {/* 搜索框：回车直达搜索页 */}
        <div className="search-box">
          <IconSearch size={15} />
          <input
            type="text"
            placeholder="搜索音乐..."
            onKeyDown={(e) => { if (e.key === 'Enter') goSearch(e.target.value) }}
          />
        </div>

        <nav className="nav-menu">
          {NAV.map((n) => {
            const Icon = n.icon
            return (
              <button
                key={n.name}
                className={'nav-item' + (view.name === n.name ? ' on' : '')}
                onClick={() => navigate(n.name)}
              >
                <Icon size={19} />
                <span>{n.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          {user ? (
            <>
              <div className="user-box">
                <img className="avatar" src={user.avatarUrl + '?param=100y100'} alt="" />
                <div className="user-meta">
                  <p className="user-name" title={user.nickname}>{user.nickname}</p>
                </div>
              </div>
              <div className="user-links">
                <button className="link" onClick={copyCookie}>复制 Cookie</button>
                <button className="link" onClick={doLogout}>退出登录</button>
              </div>
            </>
          ) : (
            <button className="btn block" onClick={() => setState({ loginOpen: true })}>扫码登录</button>
          )}
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
