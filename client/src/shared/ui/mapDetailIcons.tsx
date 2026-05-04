export type MapDetailIconName = 'pin' | 'clock' | 'layers' | 'tag' | 'link'

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
    case 'link':
      return (
        <svg {...commonProps}>
          <path d="M10.3 13.7 8.2 15.8a3 3 0 1 1-4.2-4.2l2.8-2.8a3 3 0 0 1 4.2 0" />
          <path d="M13.7 10.3 15.8 8.2a3 3 0 1 1 4.2 4.2l-2.8 2.8a3 3 0 0 1-4.2 0" />
          <path d="m9 15 6-6" />
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
