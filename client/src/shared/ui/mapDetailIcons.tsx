export type MapDetailIconName =
  | 'pin'
  | 'clock'
  | 'layers'
  | 'tag'
  | 'building'
  | 'collection'
  | 'sparkle'
  | 'calendar'
  | 'link'
  | 'route'

export function MapDetailIcon({ name }: { name: MapDetailIconName }) {
  const commonProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  switch (name) {
    case 'pin':
      return (
        <svg {...commonProps}>
          <path d="M12 21s-5.25-5.1-5.25-9.55A5.25 5.25 0 1 1 17.25 11.45C17.25 15.9 12 21 12 21Z" />
          <circle cx="12" cy="11.25" r="1.9" />
        </svg>
      )
    case 'clock':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 7.8v4.8l3.1 1.9" />
        </svg>
      )
    case 'layers':
      return (
        <svg {...commonProps}>
          <path d="m12 5 7 3.8-7 3.7-7-3.7L12 5Z" />
          <path d="m5 12.6 7 3.8 7-3.8" />
          <path d="m5 16.2 7 3.8 7-3.8" />
        </svg>
      )
    case 'tag':
      return (
        <svg {...commonProps}>
          <path d="M20 10.6 13.6 17a2 2 0 0 1-2.8 0L4.9 11.1V5h6.1L17 10.8a2 2 0 0 1 0 2.8Z" />
          <circle cx="8.1" cy="8.1" r="1.1" />
        </svg>
      )
    case 'building':
      return (
        <svg {...commonProps}>
          <path d="M5.5 20V6.4a1.9 1.9 0 0 1 1.9-1.9h6.2a1.9 1.9 0 0 1 1.9 1.9V20" />
          <path d="M4 20h16" />
          <path d="M9 8.2h3" />
          <path d="M9 11.5h3" />
          <path d="M9 14.8h3" />
          <path d="M15.5 10.2h1.2a1.8 1.8 0 0 1 1.8 1.8v8" />
        </svg>
      )
    case 'collection':
      return (
        <svg {...commonProps}>
          <rect x="4.5" y="5" width="6.2" height="6.2" rx="1.4" />
          <rect x="13.3" y="5" width="6.2" height="6.2" rx="1.4" />
          <rect x="4.5" y="13.8" width="6.2" height="6.2" rx="1.4" />
          <rect x="13.3" y="13.8" width="6.2" height="6.2" rx="1.4" />
        </svg>
      )
    case 'sparkle':
      return (
        <svg {...commonProps}>
          <path d="M12 4.5 13.7 9l4.3 1.7-4.3 1.7L12 17l-1.7-4.6L6 10.7 10.3 9 12 4.5Z" />
          <path d="M18.2 15.2 19 17l1.8.8-1.8.8-.8 1.9-.8-1.9-1.8-.8 1.8-.8.8-1.8Z" />
          <path d="M5.8 14.8 6.4 16l1.2.6-1.2.6-.6 1.2-.6-1.2-1.2-.6 1.2-.6.6-1.2Z" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...commonProps}>
          <rect x="4.5" y="5.5" width="15" height="14" rx="2.2" />
          <path d="M8.2 3.8v3.4" />
          <path d="M15.8 3.8v3.4" />
          <path d="M4.5 9.5h15" />
          <path d="M8 13h2" />
          <path d="M13.5 13h2" />
          <path d="M8 16h2" />
        </svg>
      )
    case 'link':
      return (
        <svg {...commonProps}>
          <path d="M10.3 13.7 8.2 15.8a3 3 0 1 1-4.2-4.2l2.8-2.8a3 3 0 0 1 4.2 0" />
          <path d="M13.7 10.3 15.8 8.2a3 3 0 1 1 4.2 4.2l-2.8 2.8a3 3 0 0 1-4.2 0" />
          <path d="m9 15 6-6" />
        </svg>
      )
    case 'route':
      return (
        <svg {...commonProps}>
          <path d="M5.5 18.5h3.2a3 3 0 0 0 0-6H7.4a3 3 0 0 1 0-6h2.1" />
          <path d="m16 5 3 3-3 3" />
          <path d="M12.5 8H19" />
          <circle cx="5.5" cy="18.5" r="1.4" />
        </svg>
      )
    default:
      return null
  }
}

export function MapAssistantIcon() {
  return (
    <svg className="map-control-icon" aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <rect x="5.25" y="7" width="13.5" height="10.5" rx="5.25" fill="currentColor" opacity="0.18" />
      <path
        d="M9 19.5v-1.6m6 1.6v-1.6m-3-14v2.1m-5.4 3.5h10.8A2.6 2.6 0 0 1 20 12.1v3.4a2.6 2.6 0 0 1-2.6 2.6H9.7L6 20v-1.9a2.6 2.6 0 0 1-2-2.6v-3.4A2.6 2.6 0 0 1 6.6 9.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="9.5" cy="13.5" r="1" fill="currentColor" />
      <circle cx="14.5" cy="13.5" r="1" fill="currentColor" />
    </svg>
  )
}
