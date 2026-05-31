/* eslint-disable react-refresh/only-export-components */
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  HTMLAttributes,
  InputHTMLAttributes,
  LiHTMLAttributes,
  MouseEvent,
  ReactNode,
  Ref,
} from 'react'
import { useEffect, useState } from 'react'

type PublicButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  display?: 'inline' | 'block' | 'full'
  loading?: boolean
  size?: 'small' | 'medium' | 'large' | 'xlarge'
  color?: 'primary' | 'danger' | 'light' | 'dark'
  variant?: 'fill' | 'weak'
}

type PublicIconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & {
  'aria-label': string
  bgColor?: string
  color?: string
  iconSize?: number
  name?: string
  src?: string
  variant?: 'fill' | 'clear' | 'border'
}

type PublicBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  color?: 'blue' | 'teal' | 'green' | 'red' | 'yellow' | 'elephant'
  size: 'xsmall' | 'small' | 'medium' | 'large'
  variant: 'fill' | 'weak'
}

type PublicAssetLottieProps = HTMLAttributes<HTMLSpanElement> & {
  src: string
  frameShape?: { width?: number; height?: number }
  loop?: boolean
  'aria-hidden'?: boolean
}

type PublicAssetImageProps = HTMLAttributes<HTMLSpanElement> & {
  alt: string
  src: string
  frameShape?: { width?: number; height?: number; radius?: number | string }
}

type PublicAssetIconProps = HTMLAttributes<HTMLSpanElement> & {
  name: string
  color?: string
  frameShape?: { width?: number; height?: number }
}

function AssetImage({
  alt,
  className,
  frameShape,
  src,
  style,
  ...props
}: PublicAssetImageProps) {
  return (
    <span
      className={['ait-asset-image', className].filter(Boolean).join(' ')}
      style={{
        width: frameShape?.width,
        height: frameShape?.height,
        borderRadius: frameShape?.radius,
        ...style,
      }}
      {...props}
    >
      <img alt={alt} src={src} />
    </span>
  )
}

function AssetIcon({ className, color, frameShape, name, style, ...props }: PublicAssetIconProps) {
  return (
    <span
      aria-hidden="true"
      className={['ait-asset-icon', className].filter(Boolean).join(' ')}
      data-icon-name={name}
      style={{
        width: frameShape?.width,
        height: frameShape?.height,
        color,
        ...style,
      }}
      {...props}
    >
      ₩
    </span>
  )
}

function AssetLottie({
  className,
  frameShape,
  src,
  style,
  ...props
}: PublicAssetLottieProps) {
  return (
    <span
      className={['ait-asset-lottie', className].filter(Boolean).join(' ')}
      data-src={src}
      style={{
        width: frameShape?.width,
        height: frameShape?.height,
        ...style,
      }}
      {...props}
    >
      {'₩'}
    </span>
  )
}

export const Asset = {
  frameShape: {
    CleanW60: { width: 60, height: 60 },
  },
  Icon: AssetIcon,
  Image: AssetImage,
  Lottie: AssetLottie,
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

type PublicResultProps = HTMLAttributes<HTMLDivElement> & {
  figure?: ReactNode
  title?: ReactNode
  description?: ReactNode
  button?: ReactNode
}

function ResultRoot({ button, children, className, description, figure, title, ...props }: PublicResultProps) {
  return (
    <div className={['ait-result', className].filter(Boolean).join(' ')} {...props}>
      {figure != null ? <div className="ait-result-figure">{figure}</div> : null}
      {title != null ? <h2 className="ait-result-title">{title}</h2> : null}
      {description != null ? <p className="ait-result-description">{description}</p> : null}
      {children}
      {button != null ? <div className="ait-result-action">{button}</div> : null}
    </div>
  )
}

function ResultButton({ className, display = 'block', ...props }: PublicButtonProps) {
  return <Button className={['ait-result-button', className].filter(Boolean).join(' ')} display={display} {...props} />
}

export const Result = Object.assign(ResultRoot, {
  Button: ResultButton,
})

export function IconButton({
  children,
  className,
  color,
  bgColor,
  iconSize = 24,
  name,
  src,
  style,
  type = 'button',
  variant = 'clear',
  ...props
}: PublicIconButtonProps) {
  const iconStyle = { width: iconSize, height: iconSize } as CSSProperties

  return (
    <button
      className={['ait-icon-button', className].filter(Boolean).join(' ')}
      data-icon-name={name}
      data-variant={variant}
      style={{ color, backgroundColor: bgColor, ...style }}
      type={type}
      {...props}
    >
      {src != null ? (
        <img alt="" aria-hidden="true" className="ait-icon-button-image" src={src} style={iconStyle} />
      ) : (
        children ?? (
          <span aria-hidden="true" className="ait-icon-button-glyph" style={iconStyle}>
            {name?.includes('arrow-left') ? '‹' : '•'}
          </span>
        )
      )}
    </button>
  )
}

type PublicSearchFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  fixed?: boolean
  fixedSafeZoneOffset?: number
  onDeleteClick?: () => void
  takeSpace?: boolean
}

type PublicTextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> & {
  containerProps?: HTMLAttributes<HTMLDivElement>
  containerRef?: Ref<HTMLDivElement>
  hasError?: boolean
  help?: ReactNode
  label?: string
  labelOption?: 'appear' | 'sustain'
  paddingBottom?: CSSProperties['paddingBottom']
  paddingTop?: CSSProperties['paddingTop']
  prefix?: string
  right?: ReactNode
  suffix?: string
  variant: 'box' | 'line' | 'big' | 'hero'
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

export function TextField({
  className,
  containerProps,
  containerRef,
  hasError = false,
  help,
  id,
  label,
  labelOption = 'appear',
  paddingBottom,
  paddingTop,
  prefix,
  right,
  suffix,
  variant,
  ...props
}: PublicTextFieldProps) {
  const { className: containerClassName, style: containerStyle, ...restContainerProps } = containerProps ?? {}
  const shouldShowLabel = label != null && (labelOption === 'sustain' || String(props.value ?? '').length > 0)

  return (
    <div
      className={['ait-text-field', containerClassName].filter(Boolean).join(' ')}
      data-has-error={hasError ? 'true' : undefined}
      data-label-option={labelOption}
      data-variant={variant}
      ref={containerRef}
      style={{ paddingBottom, paddingTop, ...containerStyle }}
      {...restContainerProps}
    >
      {shouldShowLabel ? (
        <label className="ait-text-field-label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <span className="ait-text-field-control">
        {prefix != null ? <span className="ait-text-field-affix">{prefix}</span> : null}
        <input className={['ait-text-field-input', className].filter(Boolean).join(' ')} id={id} {...props} />
        {suffix != null ? <span className="ait-text-field-affix">{suffix}</span> : null}
        {right != null ? <span className="ait-text-field-right">{right}</span> : null}
      </span>
      {help != null ? <p className="ait-text-field-help">{help}</p> : null}
    </div>
  )
}

type PublicModalProps = {
  children: ReactNode
  open: boolean
  onOpenChange?: (open: boolean) => void
  onExited?: () => void
}

type PublicModalOverlayProps = Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> & {
  onClick?: () => void
}

type PublicModalContentProps = HTMLAttributes<HTMLDivElement>

function ModalRoot({ children, open }: PublicModalProps) {
  if (!open) {
    return null
  }

  return <>{children}</>
}

function ModalOverlay({ className, onClick, ...props }: PublicModalOverlayProps) {
  return (
    <div
      className={['ait-modal-overlay', className].filter(Boolean).join(' ')}
      onClick={onClick}
      {...props}
    />
  )
}

function ModalContent({ children, className, ...props }: PublicModalContentProps) {
  return (
    <div className={['ait-modal-content', className].filter(Boolean).join(' ')} role="dialog" {...props}>
      {children}
    </div>
  )
}

export const Modal = Object.assign(ModalRoot, {
  Overlay: ModalOverlay,
  Content: ModalContent,
})

type PublicMenuDropdownProps = HTMLAttributes<HTMLDivElement> & {
  header?: ReactNode
}

type PublicMenuItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  left?: ReactNode
  right?: ReactNode
}

type PublicMenuCheckItemProps = PublicMenuItemProps & {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

type PublicMenuTriggerProps = HTMLAttributes<HTMLSpanElement> & {
  open?: boolean
  defaultOpen?: boolean
  onOpen?: () => void
  onClose?: () => void
  dropdown?: ReactNode
  placement?: string
}

function MenuDropdown({ children, className, header, ...props }: PublicMenuDropdownProps) {
  return (
    <div className={['ait-menu-dropdown', className].filter(Boolean).join(' ')} role="menu" {...props}>
      {header}
      {children}
    </div>
  )
}

function MenuHeader({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['ait-menu-header', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  )
}

function MenuDropdownItem({ children, className, left, right, type = 'button', ...props }: PublicMenuItemProps) {
  return (
    <button className={['ait-menu-item', className].filter(Boolean).join(' ')} role="menuitem" type={type} {...props}>
      {left != null ? <span className="ait-menu-item-left">{left}</span> : null}
      <span className="ait-menu-item-copy">{children}</span>
      {right != null ? <span className="ait-menu-item-right">{right}</span> : null}
    </button>
  )
}

function MenuDropdownCheckItem({
  checked = false,
  onCheckedChange,
  onClick,
  ...props
}: PublicMenuCheckItemProps) {
  return (
    <MenuDropdownItem
      aria-checked={checked}
      role="menuitemcheckbox"
      onClick={(event) => {
        onCheckedChange?.(!checked)
        onClick?.(event)
      }}
      {...props}
    />
  )
}

function MenuDropdownIcon({ children, className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={['ait-menu-icon', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </span>
  )
}

function MenuTrigger({
  children,
  className,
  defaultOpen = false,
  dropdown,
  onClose,
  onOpen,
  open,
  placement = 'bottom-start',
  ...props
}: PublicMenuTriggerProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isOpen = open ?? internalOpen

  const setOpen = (nextOpen: boolean) => {
    if (open == null) {
      setInternalOpen(nextOpen)
    }

    if (nextOpen) {
      onOpen?.()
    } else {
      onClose?.()
    }
  }

  const handleDropdownClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null
    if (target?.closest('[role="menuitem"], [role="menuitemcheckbox"]')) {
      setOpen(false)
    }
  }

  return (
    <span
      className={['ait-menu-trigger', className].filter(Boolean).join(' ')}
      data-placement={placement}
      {...props}
    >
      <span onClick={() => setOpen(!isOpen)}>{children}</span>
      {isOpen ? (
        <>
          <button
            aria-label="메뉴 닫기"
            className="ait-menu-backdrop"
            type="button"
            onClick={() => setOpen(false)}
          />
          <div onClickCapture={handleDropdownClickCapture}>{dropdown}</div>
        </>
      ) : null}
    </span>
  )
}

export const Menu = {
  Dropdown: MenuDropdown,
  DropdownCheckItem: MenuDropdownCheckItem,
  DropdownIcon: MenuDropdownIcon,
  DropdownItem: MenuDropdownItem,
  Header: MenuHeader,
  Trigger: MenuTrigger,
}

type PublicListRowProps = LiHTMLAttributes<HTMLLIElement> & {
  border?: 'none' | 'indented'
  contents?: ReactNode
  left?: ReactNode
  right?: ReactNode
  verticalPadding?: 'small' | 'medium' | 'large' | 'xlarge'
  horizontalPadding?: 'small' | 'medium'
}

type PublicRatingProps = HTMLAttributes<HTMLDivElement> & {
  value: number
  max?: number
  readOnly: boolean
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'big'
  variant?: 'full' | 'compact' | 'iconOnly'
  activeColor?: string
  disabled?: boolean
  onValueChange?: (value: number) => void
  'aria-label': string
  'aria-valuetext': string
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

export function Rating({
  className,
  disabled = false,
  max = 5,
  onValueChange,
  readOnly,
  size,
  style,
  value,
  variant,
  activeColor,
  'aria-label': ariaLabel,
  'aria-valuetext': ariaValueText,
  ...props
}: PublicRatingProps) {
  const roundedValue = Math.max(0, Math.min(max, Math.round(value)))

  return (
    <div
      aria-label={readOnly ? `${ariaLabel} ${ariaValueText}` : ariaLabel}
      className={['ait-rating', className].filter(Boolean).join(' ')}
      data-size={size}
      data-variant={variant}
      role={readOnly ? 'img' : 'radiogroup'}
      style={{ '--ait-rating-active-color': activeColor, ...style } as CSSProperties}
      {...props}
    >
      {Array.from({ length: max }, (_, index) => {
        const nextValue = index + 1
        const active = nextValue <= roundedValue

        return (
          <button
            aria-label={`${nextValue}점`}
            aria-checked={active}
            className="ait-rating-star"
            data-active={active ? 'true' : undefined}
            disabled={disabled || readOnly}
            key={nextValue}
            role={readOnly ? undefined : 'radio'}
            tabIndex={!readOnly && nextValue === Math.max(1, roundedValue) ? 0 : -1}
            type="button"
            onClick={() => onValueChange?.(nextValue)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onValueChange?.(nextValue)
              }
            }}
          >
            ★
          </button>
        )
      })}
    </div>
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

type PublicTopParagraphProps = HTMLAttributes<HTMLDivElement> & {
  size?: number | string
  typography?: string
}

function TopRoot({
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
        {subtitleBottom != null ? <div className="ait-top-subtitle-bottom">{subtitleBottom}</div> : null}
      </div>
      {right != null ? <div>{right}</div> : null}
      {lower != null ? <div style={lowerGap != null ? { marginTop: lowerGap } : undefined}>{lower}</div> : null}
    </div>
  )
}

function TopTitleParagraph({ children, className, size, typography, ...props }: PublicTopParagraphProps) {
  void size
  void typography

  return (
    <div className={['ait-top-title-paragraph', className].filter(Boolean).join(' ')} role="heading" aria-level={1} {...props}>
      {children}
    </div>
  )
}

function TopSubtitleParagraph({ children, className, size, typography, ...props }: PublicTopParagraphProps) {
  void size
  void typography

  return <div className={['ait-top-subtitle-paragraph', className].filter(Boolean).join(' ')} {...props}>{children}</div>
}

function TopRightAssetContent({ content, className, ...props }: HTMLAttributes<HTMLDivElement> & { content: ReactNode }) {
  return (
    <div className={['ait-top-right-asset-content', className].filter(Boolean).join(' ')} {...props}>
      {content}
    </div>
  )
}

export const Top = Object.assign(TopRoot, {
  RightAssetContent: TopRightAssetContent,
  SubtitleParagraph: TopSubtitleParagraph,
  TitleParagraph: TopTitleParagraph,
})

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
  maxHeight?: number | `${number}vh`
  ariaLabelledBy?: string
  ariaDescribedBy?: string
  UNSAFE_disableFocusLock?: boolean
}

function BottomSheetRoot({
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
  maxHeight,
  style,
  UNSAFE_disableFocusLock = false,
  ...props
}: PublicBottomSheetProps) {
  if (!open) {
    return null
  }

  return (
    <>
      {!disableDimmer && onClose != null ? (
        <button aria-label="바텀시트 닫기" className="ait-bottom-sheet-dimmer" type="button" onClick={onClose} />
      ) : null}
      <section
        aria-describedby={ariaDescribedBy}
        aria-labelledby={ariaLabelledBy}
        className={['ait-bottom-sheet', className].filter(Boolean).join(' ')}
        data-disable-focus-lock={UNSAFE_disableFocusLock ? 'true' : undefined}
        role="dialog"
        style={{
          ...(maxHeight != null ? { maxHeight } : {}),
          ...style,
        }}
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

function BottomSheetHeader({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['ait-bottom-sheet-header', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  )
}

function BottomSheetHeaderDescription({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['ait-bottom-sheet-header-description', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  )
}

export const BottomSheet = Object.assign(BottomSheetRoot, {
  Header: BottomSheetHeader,
  HeaderDescription: BottomSheetHeaderDescription,
})

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
