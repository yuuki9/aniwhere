export type MapQuickChipItem = {
  id: string
  label: string
}

type MapQuickChipsProps = {
  items: MapQuickChipItem[]
  activeItems: Record<string, boolean>
  onToggle: (id: string) => void
}

export function MapQuickChips({ items, activeItems, onToggle }: MapQuickChipsProps) {
  return (
    <div className="map-chip-toolbar">
      <ul className="map-chip-scroll" aria-label="빠른 필터">
        {items.map((item) => {
          const isActive = Boolean(activeItems[item.id])

          return (
            <li key={item.id}>
              <button
                className={`map-chip-status${isActive ? ' map-chip-status-active' : ''}`}
                type="button"
                onClick={() => onToggle(item.id)}
                aria-pressed={isActive}
                aria-label={`${item.label} ${isActive ? '선택됨' : '선택 안 됨'}`}
              >
                {item.label}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
