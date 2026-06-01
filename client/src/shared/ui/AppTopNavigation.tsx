import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import aniwhereIcon from '../../assets/aniwhere_icon.png'
import { isAppsInTossRuntime } from '../lib/auth'

type AppTopNavigationProps = {
  title?: string
  showBack?: boolean
  showLogo?: boolean
  renderInToss?: boolean
  onBack?: () => void
  trailing?: ReactNode
  className?: string
}

function BackIcon() {
  return (
    <svg aria-hidden="true" className="ait-navigation-icon" viewBox="0 0 24 24">
      <path
        d="M15 5 8 12l7 7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg aria-hidden="true" className="ait-navigation-profile-icon" viewBox="0 0 24 24">
      <path
        d="M12 12.2a4.1 4.1 0 1 0 0-8.2 4.1 4.1 0 0 0 0 8.2Zm-7 7.1c.78-3.52 3.52-5.7 7-5.7s6.22 2.18 7 5.7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.1"
      />
    </svg>
  )
}

export function AppTopNavigation({
  title = 'Aniwhere',
  showBack = false,
  showLogo = true,
  renderInToss = false,
  onBack,
  trailing,
  className,
}: AppTopNavigationProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const shouldUseTossNavigation = useMemo(() => isAppsInTossRuntime(), [])
  const shouldShowProfileEntry = location.pathname !== '/my'

  if (shouldUseTossNavigation && !renderInToss) {
    return null
  }

  return (
    <header className={['ait-navigation', className].filter(Boolean).join(' ')}>
      <div className="ait-navigation-side">
        {showBack ? (
          <button
            aria-label="Go back"
            className="ait-navigation-icon-button"
            type="button"
            onClick={onBack ?? (() => navigate(-1))}
          >
            <BackIcon />
          </button>
        ) : null}
      </div>

      <div className="ait-navigation-brand" aria-label={title}>
        {showLogo ? <img className="ait-navigation-logo" src={aniwhereIcon} alt="" aria-hidden="true" /> : null}
        <span>{title}</span>
      </div>

      <div className="ait-navigation-side ait-navigation-side-trailing">
        {trailing}
        {shouldShowProfileEntry ? (
          <button
            aria-label="내 정보"
            className="ait-navigation-icon-button ait-navigation-profile-button"
            type="button"
            onClick={() => navigate('/my')}
          >
            <ProfileIcon />
          </button>
        ) : null}
      </div>
    </header>
  )
}
