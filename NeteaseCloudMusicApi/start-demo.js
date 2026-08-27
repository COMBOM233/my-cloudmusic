// 本地演示专用启动脚本
// 与 app.js 逻辑一致，唯一区别：跳过「检查最新版本」（checkVersion 内部会 spawn 子进程执行
// npm info，在部分受限环境下不可用；该检查只用于提示升级，不影响任何功能）
const fs = require('fs')
const path = require('path')
const os = require('os')

async function start() {
  const tmpPath = os.tmpdir()
  if (!fs.existsSync(path.resolve(tmpPath, 'anonymous_token'))) {
    fs.writeFileSync(path.resolve(tmpPath, 'anonymous_token'), '', 'utf-8')
  }
  const generateConfig = require('./generateConfig')
  await generateConfig()
  require('./server').serveNcmApi({
    checkVersion: false,
  })
}

start()
