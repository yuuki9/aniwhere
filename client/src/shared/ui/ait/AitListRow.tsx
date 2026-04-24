import type { ReactNode } from 'react'

type AitListRowProps = {
  asset?: ReactNode
  title: ReactNode
  description?: ReactNode
  border?: 'none' | 'indented'
  className?: string
}

export function AitListRow({ asset, title, description, border = 'indented', className }: AitListRowProps) {
  return (
    <li className={['ait-list-row', className].filter(Boolean).join(' ')} data-border={border}>
      {asset ? <span className="ait-list-row-asset">{asset}</span> : null}
      <span className="ait-list-row-copy">
        <strong>{title}</strong>
        {description ? <span>{description}</span> : null}
      </span>
    </li>
  )
}
