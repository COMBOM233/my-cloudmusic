// API 使用说明页：把演示站用到的所有接口整理成一份「用法说明书」
import { useState } from 'react'

const API_DOCS = [
  {
    group: '搜索',
    items: [
      { path: 'GET /search', params: 'keywords, type(1单曲/10专辑/100歌手/1000歌单), limit, offset', desc: '通用搜索。type=1 返回 result.songs[]', used: '搜索页' },
      { path: 'GET /search/suggest', params: 'keywords, type=mobile', desc: '搜索建议（联想）', used: '未使用' },
    ],
  },
  {
    group: '歌曲 / 播放 / 歌词',
    items: [
      { path: 'GET /song/detail', params: 'ids（逗号分隔，可多首）', desc: '歌曲详情，返回 songs[]（含 ar 歌手、al 专辑、dt 时长）', used: '歌曲详情弹层' },
      { path: 'GET /song/url', params: 'id, br(码率，999000=最高)', desc: '获取播放地址。⚠️ 版权/会员歌曲可能返回 url:null', used: '播放器·多级取流第 1 级' },
      { path: 'GET /song/url/v1', params: 'id, level(standard/exhigh/lossless/hires/sky/jymaster)', desc: '按音质等级取流（Android 通道）。无损/Hi-Res 需 VIP 账号', used: '播放器·多级取流第 2/3 级' },
      { path: 'GET /song/download/url', params: 'id, br', desc: '下载链接接口，某些歌曲用它可拿到播放地址', used: '播放器·多级取流第 4 级' },
      { path: 'GET /lyric', params: 'id', desc: '返回 lrc（原文）与 tlyric（翻译）两种 LRC 歌词', used: '播放器·歌词面板' },
      { path: 'GET /simi/song', params: 'id', desc: '相似歌曲推荐', used: '歌曲详情弹层' },
    ],
  },
  {
    group: '歌单',
    items: [
      { path: 'GET /top/playlist', params: 'cat(分类名，如 流行), limit, offset', desc: '热门歌单列表，返回 playlists[]', used: '歌单广场' },
      { path: 'GET /playlist/catlist', params: '', desc: '歌单分类列表，返回 categories 对象', used: '歌单广场·分类' },
      { path: 'GET /playlist/detail', params: 'id', desc: '歌单详情：playlist（信息）+ playlist.tracks（歌曲数组）', used: '歌单详情页' },
      { path: 'GET /personalized', params: 'limit', desc: '推荐歌单', used: '歌单广场·推荐' },
      { path: 'GET /playlist/create', params: 'name', desc: '创建歌单（需登录），返回 playlist.id', used: '我的歌单' },
      { path: 'GET /playlist/tracks', params: 'op(add|del), pid, tracks(逗号分隔的歌曲id)', desc: '向歌单添加/删除歌曲（需登录）', used: '我的歌单·加歌/删歌' },
      { path: 'GET /playlist/delete', params: 'id', desc: '删除歌单（需登录）', used: '我的歌单' },
      { path: 'GET /user/playlist', params: 'uid, limit', desc: '某个用户的歌单列表', used: '我的歌单' },
    ],
  },
  {
    group: '榜单 / 推荐',
    items: [
      { path: 'GET /toplist', params: '', desc: '所有榜单概要；每个榜单的 id 就是歌单 id', used: '发现页' },
      { path: 'GET /recommend/songs', params: '', desc: '每日推荐（需登录），返回 data.dailySongs[]', used: '发现页·每日推荐' },
      { path: 'GET /banner', params: '', desc: '首页轮播图', used: '发现页·轮播' },
    ],
  },
  {
    group: '评论',
    items: [
      { path: 'GET /comment/music', params: 'id(歌曲), limit, offset', desc: '歌曲评论，返回 hotComments + comments', used: '歌曲详情弹层' },
      { path: 'GET /comment/playlist', params: 'id(歌单), limit', desc: '歌单评论', used: '歌单详情页' },
      { path: 'GET /comment/like', params: 'id, cid(评论id), type(1歌曲/2歌单), t(1赞/0取消)', desc: '评论点赞（需登录）', used: '歌曲详情弹层' },
    ],
  },
  {
    group: '歌手 / 专辑',
    items: [
      { path: 'GET /artist/detail', params: 'id', desc: '歌手详情', used: '歌手页' },
      { path: 'GET /artists', params: 'id', desc: '歌手热门 50 首，返回 hotSongs[]', used: '歌手页' },
      { path: 'GET /artist/album', params: 'id, limit', desc: '歌手专辑列表', used: '歌手页' },
      { path: 'GET /artist/desc', params: 'id', desc: '歌手简介', used: '歌手页' },
      { path: 'GET /album', params: 'id', desc: '专辑详情：album + songs[]', used: '专辑页' },
    ],
  },
  {
    group: '登录 / 用户',
    items: [
      { path: 'GET /login/qr/key', params: 'timestamp', desc: '获取扫码登录的 key（data.unikey）', used: '登录弹窗' },
      { path: 'GET /login/qr/create', params: 'key, qrimg=true', desc: '生成二维码图片（data.qrimg 为 base64）', used: '登录弹窗' },
      { path: 'GET /login/qr/check', params: 'key, timestamp', desc: '轮询扫码状态：顶层 code 800过期/801等待/802已扫码/803成功；803 时响应带 cookie', used: '登录弹窗' },
      { path: 'GET /login/status', params: 'timestamp', desc: '当前登录状态，data.profile 为用户信息', used: '登录弹窗' },
      { path: 'GET /logout', params: '', desc: '退出登录', used: '侧边栏' },
      { path: 'GET /like', params: 'id(歌曲), like(true/false)', desc: '红心 / 取消红心（需登录）', used: '歌曲行·红心' },
    ],
  },
]

export default function ApiDocsView() {
  const [open, setOpen] = useState({})

  return (
    <div className="view">
      <div className="view-head"><h2>📖 API 使用说明</h2></div>
      <div className="docs-intro">
        <p>本演示站的前端代码就是一份「活文档」：</p>
        <ul>
          <li>所有接口调用都封装在 <code>src/api/client.js</code>，每个函数都有中文注释（参数、返回结构、注意事项）。</li>
          <li>页面上任意操作后，打开右下角「📡 API 调用日志」，可看到每一次真实请求的 URL、参数与完整 JSON 返回。</li>
          <li>下方表格汇总了本演示站用到的全部接口。</li>
        </ul>
      </div>
      {API_DOCS.map((g) => (
        <div key={g.group} className="docs-group">
          <h3>{g.group}</h3>
          <table className="docs-table">
            <thead>
              <tr><th>接口</th><th>参数</th><th>说明</th><th>演示站位置</th></tr>
            </thead>
            <tbody>
              {g.items.map((it) => (
                <tr key={it.path}>
                  <td><code>{it.path}</code></td>
                  <td>{it.params || '—'}</td>
                  <td>{it.desc}</td>
                  <td>{it.used}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      <div className="docs-note">
        <h3>⚠️ 常见坑</h3>
        <ul>
          <li><b>播放地址为 null 或只有 128k 试听</b>：版权/会员歌曲未登录时要么返回 <code>url: null</code>，要么只给 128k 试听流。<b>扫码登录自己的 VIP 账号后</b>，播放器会自动以会员身份取流，多数歌曲可解锁完整音质（320k / 无损 / Hi-Res）——播放器会显示当前实际音质。</li>
          <li><b>需要登录的接口</b>：创建歌单、加歌、红心、评论点赞、每日推荐都必须先扫码登录（cookie 保存在 API 服务端与浏览器）。</li>
          <li><b>原仓库状态</b>：Binaryify/NeteaseCloudMusicApi 原仓库已停止维护并清空代码。本演示站使用 v4.29.17（NeteaseCloudMusicApiEnhanced 系），其扫码登录已适配网易云新版协议（type:3）——旧版 type:1 的扫码登录会被拦截。</li>
          <li><b>开发环境</b>：启动 API（3000 端口）后，前端 <code>npm run dev</code>（5173 端口），Vite 已配置 <code>/api</code> 代理。</li>
        </ul>
      </div>
    </div>
  )
}
