import type { ReactNode } from 'react'

type AitTopProps = {
  brand?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  className?: string
}

export function AitTop({ brand, title, subtitle, className }: AitTopProps) {
  return (
    <div className={['ait-top', className].filter(Boolean).join(' ')}>
      {brand ? <div className="ait-top-brand">{brand}</div> : null}
      <div className="ait-top-copy">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
    </div>
  )
}
