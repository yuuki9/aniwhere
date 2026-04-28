import type { ButtonHTMLAttributes } from 'react'

type AitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  display?: 'inline' | 'full'
}

export function AitButton({ className, display = 'inline', type = 'button', ...props }: AitButtonProps) {
  return (
    <button
      className={['ait-button', display === 'full' ? 'ait-button-full' : null, className].filter(Boolean).join(' ')}
      type={type}
      {...props}
    />
  )
}
