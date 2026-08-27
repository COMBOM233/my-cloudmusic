// 全局唯一 <audio> 元素，由底部播放器统一控制
// 放在独立模块里，歌词面板等其他组件也能直接读取播放进度
export const audio = new Audio()
audio.preload = 'metadata'
