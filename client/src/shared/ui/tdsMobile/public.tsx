import type { ButtonHTMLAttributes, CSSProperties, LiHTMLAttributes, ReactNode } from 'react'
import { useEffect } from 'react'

type PublicButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  display?: 'inline' | 'block' | 'full'
  loading?: boolean
  size?: 'small' | 'medium' | 'large' | 'xlarge'
  color?: 'primary' | 'danger' | 'light' | 'dark'
  variant?: 'fill' | 'weak'
}

export function Button({
  className,
  display = 'inline',
  loading = false,
  size = 'xlarge',
  type = 'button',
  disabled,
  children,
  ...props
}: PublicButtonProps) {
  return (
    <button
      className={['ait-button', display !== 'inline' ? 'ait-button-full' : null, className].filter(Boolean).join(' ')}
      data-display={display}
      data-size={size}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}

type PublicListRowProps = LiHTMLAttributes<HTMLLIElement> & {
  border?: 'none' | 'indented'
  contents?: ReactNode
  left?: ReactNode
  right?: ReactNode
  verticalPadding?: 'small' | 'medium' | 'large' | 'xlarge'
  horizontalPadding?: 'small' | 'medium'
}

export function ListRow({
  border = 'indented',
  className,
  contents,
  horizontalPadding,
  left,
  right,
  verticalPadding,
  ...props
}: PublicListRowProps) {
  void horizontalPadding
  void verticalPadding

  return (
    <li className={['ait-list-row', className].filter(Boolean).join(' ')} data-border={border} {...props}>
      {left ? <span className="ait-list-row-asset">{left}</span> : null}
      {contents ? <span className="ait-list-row-copy">{contents}</span> : null}
      {right ? <span className="ait-list-row-right">{right}</span> : null}
    </li>
  )
}

type PublicTopProps = {
  id?: string
  className?: string
  style?: CSSProperties
  lowerGap?: number
  title: ReactNode
  subtitleBottom?: ReactNode
  upper?: ReactNode
  upperGap?: number
  lower?: ReactNode
  right?: ReactNode
}

export function Top({
  className,
  lower,
  lowerGap,
  right,
  subtitleBottom,
  title,
  upper,
  upperGap,
  ...props
}: PublicTopProps) {
  void lowerGap
  void upperGap

  return (
    <div className={['ait-top', className].filter(Boolean).join(' ')} {...props}>
      {upper ? <div className="ait-top-brand">{upper}</div> : null}
      <div className="ait-top-copy">
        <h1>{title}</h1>
        {subtitleBottom ? <p>{subtitleBottom}</p> : null}
      </div>
      {right ? <div>{right}</div> : null}
      {lower ? <div>{lower}</div> : null}
    </div>
  )
}

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
