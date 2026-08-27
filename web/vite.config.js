// Vite 开发服务器配置
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 相对路径：部署到 GitHub Pages 子路径（https://用户名.github.io/仓库名）时资源路径正确
  base: './',
  server: {
    port: 5173,
    // 关键：把所有 /api 开头的请求代理到本地 NeteaseCloudMusicApi 服务（默认端口 3000）
    // 这样前端代码里直接写 fetch('/api/xxx') 即可，无需关心跨域
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
