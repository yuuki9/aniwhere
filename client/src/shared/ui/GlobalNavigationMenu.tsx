import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { APP_NAV_ITEMS, isNavigationItemActive } from './appNavigation'

type GlobalNavigationMenuProps = {
  triggerClassName?: string
  triggerLabel?: string
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" className="global-nav-trigger-icon" viewBox="0 0 24 24">
      <path
        d="M5 7.5h14M5 12h14M5 16.5h14"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export function GlobalNavigationMenu({
  triggerClassName = 'global-nav-trigger',
  triggerLabel = '메뉴',
}: GlobalNavigationMenuProps) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const close = () => setOpen(false)

  const move = (to: string) => {
    close()

    if (location.pathname === to) {
      return
    }

    navigate(to)
  }

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={triggerLabel}
        className={triggerClassName}
        type="button"
        onClick={() => setOpen(true)}
      >
        <MenuIcon />
      </button>

      {open ? (
        <div className="global-nav-layer" role="presentation">
          <button aria-label="메뉴 닫기" className="global-nav-backdrop" type="button" onClick={close} />

          <aside aria-label="전역 메뉴" aria-modal="true" className="global-nav-drawer" role="dialog">
            <div className="global-nav-drawer-head">
              <strong>Aniwhere</strong>
              <button aria-label="메뉴 닫기" className="global-nav-close" type="button" onClick={close}>
                ×
              </button>
            </div>

            <nav aria-label="화면 이동" className="global-nav-list">
              {APP_NAV_ITEMS.map((item) => {
                const active = isNavigationItemActive(location.pathname, item)

                return (
                  <button
                    className={`global-nav-item ${active ? 'global-nav-item-active' : ''}`}
                    key={item.key}
                    type="button"
                    onClick={() => move(item.to)}
                  >
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </aside>
        </div>
      ) : null}
    </>
  )
}
