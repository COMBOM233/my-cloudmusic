import { useState } from 'react'
import { useStore, setState } from '../store.js'

// 右侧抽屉：展示每一次 API 调用的 路径 / 参数 / 状态码 / 耗时 / 完整 JSON 响应
// 这是本演示站的「教学核心」：点开任意一条，就能看到库的真实请求与返回
export default function ApiLogDrawer() {
  const { apiLogOpen, apiLogs } = useStore()
  const [expanded, setExpanded] = useState(null)
  const [copied, setCopied] = useState(null)

  if (!apiLogOpen) return null

  const copy = async (log, i) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(log.body, null, 2))
      setCopied(i)
      setTimeout(() => setCopied(null), 1500)
    } catch { /* 忽略 */ }
  }

  return (
    <div className="api-log-mask" onMouseDown={(e) => { if (e.target === e.currentTarget) setState({ apiLogOpen: false }) }}>
      <div className="api-log-drawer">
        <div className="api-log-head">
          <h3>📡 API 调用日志</h3>
          <div className="btn-row">
            <button className="btn small" onClick={() => setState({ apiLogs: [] })}>清空</button>
            <button className="btn small" onClick={() => setState({ apiLogOpen: false })}>关闭</button>
          </div>
        </div>
        <div className="api-log-list">
          {apiLogs.length === 0 && <p className="muted">暂无请求记录 — 去页面操作一下吧</p>}
          {apiLogs.map((log, i) => (
            <div key={i} className={'api-log-item' + (log.isError ? ' err' : '')}>
              <div className="api-log-line" onClick={() => setExpanded(expanded === i ? null : i)}>
                <span className={'badge ' + (log.status === 200 ? 'ok' : 'bad')}>{log.status}</span>
                <span className="api-path">GET {log.path}</span>
                <span className="api-meta">{log.ms}ms · {log.time}</span>
              </div>
              {expanded === i && (
                <div className="api-log-detail">
                  <p className="muted">Query 参数：{JSON.stringify(log.query)}</p>
                  <button className="btn small" onClick={() => copy(log, i)}>{copied === i ? '已复制 ✓' : '复制 JSON'}</button>
                  <pre>{JSON.stringify(log.body, null, 2)}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
