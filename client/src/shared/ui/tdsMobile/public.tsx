import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, InputHTMLAttributes, LiHTMLAttributes, ReactNode } from 'react'
import { useEffect } from 'react'

type PublicButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  display?: 'inline' | 'block' | 'full'
  loading?: boolean
  size?: 'small' | 'medium' | 'large' | 'xlarge'
  color?: 'primary' | 'danger' | 'light' | 'dark'
  variant?: 'fill' | 'weak'
}

type PublicBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  color?: 'blue' | 'teal' | 'green' | 'red' | 'yellow' | 'elephant'
  size: 'xsmall' | 'small' | 'medium' | 'large'
  variant: 'fill' | 'weak'
}

export function Badge({ className, color = 'blue', size, variant, ...props }: PublicBadgeProps) {
  return (
    <span
      className={['ait-badge', className].filter(Boolean).join(' ')}
      data-color={color}
      data-size={size}
      data-variant={variant}
      {...props}
    />
  )
}

export function Button({
  className,
  color,
  display = 'inline',
  loading = false,
  size = 'xlarge',
  type = 'button',
  disabled,
  children,
  variant,
  ...props
}: PublicButtonProps) {
  return (
    <button
      className={['ait-button', display !== 'inline' ? 'ait-button-full' : null, className].filter(Boolean).join(' ')}
      data-color={color}
      data-display={display}
      data-size={size}
      data-variant={variant}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}

type PublicSearchFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  fixed?: boolean
  fixedSafeZoneOffset?: number
  onDeleteClick?: () => void
  takeSpace?: boolean
}

export function SearchField({
  className,
  fixed = false,
  fixedSafeZoneOffset = 0,
  onDeleteClick,
  onKeyDown,
  takeSpace = true,
  type = 'search',
  value,
  ...props
}: PublicSearchFieldProps) {
  return (
    <input
      className={['ait-search-field', className].filter(Boolean).join(' ')}
      data-fixed={fixed ? 'true' : undefined}
      data-fixed-safe-zone-offset={fixed ? fixedSafeZoneOffset : undefined}
      data-take-space={takeSpace ? 'true' : 'false'}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && onDeleteClick != null && String(value ?? '').length > 0) {
          event.preventDefault()
          onDeleteClick()
          return
        }

        onKeyDown?.(event)
      }}
      type={type}
      value={value}
      {...props}
    />
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
  style,
  verticalPadding,
  ...props
}: PublicListRowProps) {
  const listRowStyle: CSSProperties = {
    ...(horizontalPadding != null ? { paddingInline: `var(--ait-space-${horizontalPadding === 'small' ? '4' : '6'})` } : {}),
    ...(verticalPadding != null
      ? {
          paddingBlock: `var(--ait-space-${
            verticalPadding === 'small' ? '3' : verticalPadding === 'medium' ? '4' : verticalPadding === 'large' ? '5' : '6'
          })`,
        }
      : {}),
    ...style,
  }

  return (
    <li
      className={['ait-list-row', className].filter(Boolean).join(' ')}
      data-border={border}
      data-horizontal-padding={horizontalPadding}
      data-vertical-padding={verticalPadding}
      style={listRowStyle}
      {...props}
    >
      {left != null ? <span className="ait-list-row-asset">{left}</span> : null}
      {contents != null ? <span className="ait-list-row-copy">{contents}</span> : null}
      {right != null ? <span className="ait-list-row-right">{right}</span> : null}
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
  return (
    <div className={['ait-top', className].filter(Boolean).join(' ')} {...props}>
      {upper != null ? (
        <div className="ait-top-brand" style={upperGap != null ? { marginBottom: upperGap } : undefined}>
          {upper}
        </div>
      ) : null}
      <div className="ait-top-copy">
        <h1>{title}</h1>
        {subtitleBottom != null ? <p>{subtitleBottom}</p> : null}
      </div>
      {right != null ? <div>{right}</div> : null}
      {lower != null ? <div style={lowerGap != null ? { marginTop: lowerGap } : undefined}>{lower}</div> : null}
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

type PublicBottomSheetProps = HTMLAttributes<HTMLElement> & {
  open: boolean
  onClose?: () => void
  header?: ReactNode
  headerDescription?: ReactNode
  cta?: ReactNode
  disableDimmer?: boolean
  ariaLabelledBy?: string
  ariaDescribedBy?: string
  UNSAFE_disableFocusLock?: boolean
}

export function BottomSheet({
  children,
  className,
  cta,
  header,
  headerDescription,
  open,
  onClose,
  disableDimmer = false,
  ariaLabelledBy,
  ariaDescribedBy,
  UNSAFE_disableFocusLock = false,
  ...props
}: PublicBottomSheetProps) {
  if (!open) {
    return null
  }

  return (
    <>
      {!disableDimmer ? <button aria-label="바텀시트 닫기" className="ait-bottom-sheet-dimmer" type="button" onClick={onClose} /> : null}
      <section
        aria-describedby={ariaDescribedBy}
        aria-labelledby={ariaLabelledBy}
        className={['ait-bottom-sheet', className].filter(Boolean).join(' ')}
        data-disable-focus-lock={UNSAFE_disableFocusLock ? 'true' : undefined}
        role="dialog"
        {...props}
      >
        {header}
        {headerDescription}
        {children}
        {cta != null ? <div className="ait-bottom-sheet-cta">{cta}</div> : null}
      </section>
    </>
  )
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
