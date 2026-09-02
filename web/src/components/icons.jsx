// 细描边 SVG 图标集（风格仿 Melodia：24x24、stroke=currentColor、圆角端点）
// 用法：<IconHome size={20} />，颜色随 CSS color 变化

function base(size = 20) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
}

export const IconHome = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
    <path d="M9.5 21v-6h5v6" />
  </svg>
)

export const IconCompass = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m15.5 8.5-2 5-5 2 2-5z" />
  </svg>
)

export const IconLibrary = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M4 3h13a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4z" />
    <path d="M8 3v18" />
    <path d="m14 10 3-2v6l-3-2" />
  </svg>
)

export const IconHeart = ({ size, filled, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M12 20.5C7 16.5 3 13.3 3 9.3 3 6.6 5.1 4.5 7.7 4.5c1.7 0 3.2.9 4.3 2.3 1.1-1.4 2.6-2.3 4.3-2.3C18.9 4.5 21 6.6 21 9.3c0 4-4 7.2-9 11.2z" />
  </svg>
)

export const IconSearch = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m16.5 16.5 4 4" />
  </svg>
)

export const IconBook = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
    <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
  </svg>
)

export const IconPlay = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M8 5.5v13l11-6.5z" />
  </svg>
)

export const IconPause = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M9 5v14" /><path d="M15 5v14" />
  </svg>
)

export const IconPrev = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M6 5v14" /><path d="M18 6.5v11L9.5 12z" />
  </svg>
)

export const IconNext = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M18 5v14" /><path d="M6 6.5v11l8.5-5.5z" />
  </svg>
)

export const IconShuffle = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M3 7h3.5c3 0 4.5 5 7.5 5H21" />
    <path d="m17.5 4.5 3 2.5-3 2.5" />
    <path d="M3 17h3.5c3 0 4.5-5 7.5-5H21" />
    <path d="m17.5 14.5 3 2.5-3 2.5" />
  </svg>
)

export const IconRepeat = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M17 2.5 20.5 6 17 9.5" />
    <path d="M3.5 6h17" />
    <path d="M7 21.5 3.5 18 7 14.5" />
    <path d="M20.5 18h-17" />
  </svg>
)

export const IconRepeatOne = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M17 2.5 20.5 6 17 9.5" />
    <path d="M3.5 6h17" />
    <path d="M7 21.5 3.5 18 7 14.5" />
    <path d="M20.5 18h-17" />
    <path d="M12 9v6" /><path d="m12 9 1.6 1" />
  </svg>
)

export const IconVolume = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M4 9v6h4l5 4V5L8 9z" />
    <path d="M16.5 9a4.2 4.2 0 0 1 0 6" />
    <path d="M19 6.5a8 8 0 0 1 0 11" />
  </svg>
)

export const IconNote = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M9 18V5l11-2v13" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="17.5" cy="16" r="2.5" />
  </svg>
)

export const IconTerminal = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="m7 9 3 3-3 3" /><path d="M12 15h5" />
  </svg>
)

export const IconUser = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </svg>
)

export const IconX = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const IconPlus = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconTrash = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M4 7h16" /><path d="M9 7V4h6v3" />
    <path d="M6.5 7 7.5 20h9l1-13" />
    <path d="M10 11v5M14 11v5" />
  </svg>
)

export const IconMusic = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
)
