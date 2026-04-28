import { useCallback, useEffect, useRef, useState } from 'react'
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
  triggerLabel = '메뉴 열기',
}: GlobalNavigationMenuProps) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const drawerRef = useRef<HTMLElement | null>(null)

  const close = useCallback(() => {
    setOpen(false)
    window.setTimeout(() => triggerRef.current?.focus(), 0)
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      const first = focusable?.[0]
      const last = focusable?.[focusable.length - 1]

      if (!first || !last) {
        return
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    window.requestAnimationFrame(() => closeRef.current?.focus())

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [close, open])

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
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
      >
        <MenuIcon />
      </button>

      {open ? (
        <div className="global-nav-layer" role="presentation">
          <button aria-label="메뉴 닫기" className="global-nav-backdrop" type="button" onClick={close} />

          <aside aria-label="전체 메뉴" aria-modal="true" className="global-nav-drawer" ref={drawerRef} role="dialog">
            <div className="global-nav-drawer-head">
              <strong>Aniwhere</strong>
              <button aria-label="메뉴 닫기" className="global-nav-close" ref={closeRef} type="button" onClick={close}>
                ×
              </button>
            </div>

            <nav aria-label="화면 이동" className="global-nav-list">
              {APP_NAV_ITEMS.map((item) => {
                const active = isNavigationItemActive(location.pathname, item)

                return (
                  <button
                    aria-current={active ? 'page' : undefined}
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
