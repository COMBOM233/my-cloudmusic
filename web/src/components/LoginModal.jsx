import { useEffect, useRef, useState } from 'react'
import Modal from './Modal.jsx'
import { loginQrKey, loginQrCreate, loginQrCheck, loginStatus, setAuthCookie } from '../api/client.js'
import { useStore, setState, toast, refreshMyPlaylists } from '../store.js'

// 扫码登录弹窗
// 流程：/login/qr/key 拿 key → /login/qr/create 生成二维码图片
//       → 每 2 秒轮询 /login/qr/check，顶层 code 803 表示登录成功
export default function LoginModal() {
  const { loginOpen } = useStore()
  const [qrImg, setQrImg] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const timerRef = useRef(null)

  const close = () => setState({ loginOpen: false })

  const genQr = async () => {
    setStatusMsg('正在生成二维码…')
    setQrImg('')
    try {
      const keyRes = await loginQrKey()
      const key = keyRes.data.unikey
      const qrRes = await loginQrCreate(key)
      setQrImg(qrRes.data.qrimg)
      setStatusMsg('请使用网易云音乐 App 扫码登录')
      poll(key)
    } catch (e) {
      setStatusMsg('二维码生成失败：' + e.message + '（请确认 API 服务已启动且能访问网易云）')
    }
  }

  // 轮询扫码状态：800=过期 801=等待 802=已扫码 803=成功
  const poll = (key) => {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(async () => {
      try {
        const res = await loginQrCheck(key)
        const code = res.code
        if (code === 800) { setStatusMsg('二维码已过期，重新生成中…'); genQr() }
        else if (code === 801) setStatusMsg('请使用 App 扫码…')
        else if (code === 802) setStatusMsg('已扫码，请在手机上确认登录')
        else if (code === 803) {
          clearInterval(timerRef.current)
          setStatusMsg('登录成功！')
          // 保存 cookie（后续请求自动携带，保证登录态有效）
          if (res.cookie) setAuthCookie(res.cookie)
          try {
            const st = await loginStatus()
            const profile = st.data?.profile
            if (profile) {
              setState({ user: profile, loginOpen: false })
              toast('欢迎，' + profile.nickname + ' 👋')
              refreshMyPlaylists(profile.userId)
            } else {
              toast('登录成功，但未获取到用户信息', 'warn')
            }
          } catch (e2) {
            toast('登录成功，获取用户信息失败：' + e2.message, 'error')
          }
        }
      } catch (e) { /* 网络波动时忽略，继续轮询 */ }
    }, 2000)
  }

  useEffect(() => {
    if (loginOpen) genQr()
    return () => clearInterval(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginOpen])

  return (
    <Modal open={loginOpen} onClose={close} title="扫码登录" width={380}>
      <div className="login-box">
        {qrImg ? (
          <img className="login-qr" src={qrImg} alt="登录二维码" />
        ) : (
          <div className="login-qr loading">二维码加载中…</div>
        )}
        <p className="login-status">{statusMsg}</p>
        <p className="login-tip">登录后可：创建/管理自己的歌单、红心收藏、查看每日推荐。</p>
        <button className="btn block" onClick={genQr}>刷新二维码</button>
      </div>
    </Modal>
  )
}
