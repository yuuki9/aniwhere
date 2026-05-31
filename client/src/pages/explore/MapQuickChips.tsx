export type MapQuickChipItem = {
  id: string
  label: string
  icon: MapQuickChipIconName
  ariaLabel?: string
  hidden?: boolean
  hideLabel?: boolean
}

type MapQuickChipIconName = 'time' | 'star'

type MapQuickChipsProps = {
  items: MapQuickChipItem[]
  activeItems: Record<string, boolean>
  onToggle: (id: string) => void
}

function MapQuickChipIcon({ icon }: { icon: MapQuickChipIconName }) {
  if (icon === 'time') {
    return (
      <svg className="map-chip-status-icon map-chip-status-icon-time" aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path className="map-chip-status-icon-mark" d="M12 7.5v4.8l3.2 1.9" />
      </svg>
    )
  }

  if (icon === 'star') {
    return (
      <svg className="map-chip-status-icon map-chip-status-icon-star" aria-hidden="true" viewBox="0 0 24 24">
        <path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8L12 4Z" />
      </svg>
    )
  }

  return null
}

export function MapQuickChips({ items, activeItems, onToggle }: MapQuickChipsProps) {
  return (
    <div className="map-chip-toolbar">
      <ul className="map-chip-scroll" aria-label="빠른 필터">
        {items
          .filter((item) => item.hidden !== true)
          .map((item) => {
          const isActive = Boolean(activeItems[item.id])

          return (
            <li key={item.id}>
              <button
                className={`map-chip-status map-chip-status-${item.icon}${isActive ? ' map-chip-status-active' : ''}`}
                type="button"
                onClick={() => onToggle(item.id)}
                aria-pressed={isActive}
                aria-label={`${item.ariaLabel ?? item.label} ${isActive ? '선택됨' : '선택 안 됨'}`}
              >
                <MapQuickChipIcon icon={item.icon} />
                <span className={item.hideLabel === true ? 'map-chip-status-label-hidden' : undefined}>
                  {item.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
