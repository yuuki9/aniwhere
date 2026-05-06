import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import aniwhereIcon from '../../../assets/aniwhere_icon.png'
import { isAppsInTossRuntime } from '../../lib/auth'

type AitNavigationProps = {
  title?: string
  showBack?: boolean
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

export function AitNavigation({ title = '애니웨어', showBack = false, trailing, className }: AitNavigationProps) {
  const navigate = useNavigate()
  const shouldUseTossNavigation = useMemo(() => isAppsInTossRuntime(), [])

  if (shouldUseTossNavigation) {
    return null
  }

  return (
    <header className={['ait-navigation', className].filter(Boolean).join(' ')}>
      <div className="ait-navigation-side">
        {showBack ? (
          <button className="ait-navigation-icon-button" type="button" aria-label="뒤로가기" onClick={() => navigate(-1)}>
            <BackIcon />
          </button>
        ) : null}
      </div>

      <div className="ait-navigation-brand" aria-label={title}>
        <img className="ait-navigation-logo" src={aniwhereIcon} alt="" aria-hidden="true" />
        <span>{title}</span>
      </div>

      <div className="ait-navigation-side ait-navigation-side-trailing">{trailing}</div>
    </header>
  )
}
