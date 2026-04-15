import { NavLink } from 'react-router-dom'

function HomeIcon() {
  return (
    <svg aria-hidden="true" className="tabbar-icon" viewBox="0 0 24 24">
      <path
        d="M4.5 10.5 12 4l7.5 6.5v8a1 1 0 0 1-1 1h-4.75v-5h-3.5v5H5.5a1 1 0 0 1-1-1z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function ExploreIcon() {
  return (
    <svg aria-hidden="true" className="tabbar-icon" viewBox="0 0 24 24">
      <path
        d="M14.5 9.5 9 12l2.5 5.5L17 15l2.5-5.5z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" />
    </svg>
  )
}

function CommunityIcon() {
  return (
    <svg aria-hidden="true" className="tabbar-icon" viewBox="0 0 24 24">
      <path
        d="M6.5 7.5h11a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H12l-3.5 2v-2H6.5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

const tabs = [
  {
    to: '/discover',
    label: '홈',
    icon: <HomeIcon />,
  },
  {
    to: '/explore',
    label: '탐색',
    icon: <ExploreIcon />,
  },
  {
    to: '/community',
    label: '커뮤니티',
    icon: <CommunityIcon />,
  },
]

export function FloatingTabBar() {
  return (
    <nav aria-label="주요 화면 이동" className="floating-tabbar">
      {tabs.map((tab) => (
        <NavLink
          className={({ isActive }) => `tabbar-item ${isActive ? 'tabbar-item-active' : ''}`}
          key={tab.to}
          to={tab.to}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
