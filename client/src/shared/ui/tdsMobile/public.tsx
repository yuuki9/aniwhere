import { useEffect } from 'react'

type PublicToastProps = {
  open: boolean
  text: string
  duration?: number
  position?: 'top' | 'bottom'
  higherThanCTA?: boolean
  onClose?: () => void
  'aria-live'?: 'off' | 'polite' | 'assertive'
}

export function Toast({
  open,
  text,
  duration = 3000,
  position = 'bottom',
  higherThanCTA = false,
  onClose,
  'aria-live': ariaLive = 'polite',
}: PublicToastProps) {
  useEffect(() => {
    if (!open || duration <= 0 || onClose == null) {
      return undefined
    }

    const timer = window.setTimeout(onClose, duration)
    return () => window.clearTimeout(timer)
  }, [duration, onClose, open])

  if (!open) {
    return null
  }

  return (
    <div
      aria-live={ariaLive}
      className={[
        'ait-toast',
        position === 'top' ? 'ait-toast-top' : 'ait-toast-bottom',
        higherThanCTA ? 'ait-toast-higher-than-cta' : null,
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
    >
      {text}
    </div>
  )
}
