import type { ShopFacetResponse } from '../api/types'
import {
  buildAppliedShopFilterChips,
  type AppliedShopFilterChip,
  type ShopFilters,
} from '../lib/shopFilters'

type AppliedFilterChipsProps = {
  filters: ShopFilters
  facets?: ShopFacetResponse
  className?: string
  onRemoveFilter: (chip: AppliedShopFilterChip) => void
}

export function AppliedFilterChips({
  filters,
  facets,
  className,
  onRemoveFilter,
}: AppliedFilterChipsProps) {
  const chips = buildAppliedShopFilterChips(filters, facets)

  if (chips.length === 0) {
    return null
  }

  return (
    <ul className={['applied-filter-chip-rail', className].filter(Boolean).join(' ')} aria-label="Applied filters">
      {chips.map((chip) => (
        <li key={chip.key}>
          <button
            className="applied-filter-chip"
            type="button"
            aria-label={chip.removeLabel}
            onClick={() => onRemoveFilter(chip)}
          >
            <span>{chip.label}</span>
            <span className="applied-filter-chip-close" aria-hidden="true">
              x
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
