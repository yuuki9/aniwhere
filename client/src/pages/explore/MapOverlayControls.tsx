type MapOverlayControlsProps = {
  visible: boolean
  isListSheetOpen: boolean
  locationState: 'idle' | 'loading' | 'ready' | 'error'
  onListClick: () => void
  onLocationClick: () => void
}

export function MapOverlayControls({
  visible,
  isListSheetOpen,
  locationState,
  onListClick,
  onLocationClick,
}: MapOverlayControlsProps) {
  if (!visible) {
    return null
  }

  return (
    <>
      <button
        aria-label={isListSheetOpen ? '지도 보기' : '목록 보기'}
        className={`map-list-fab ${isListSheetOpen ? 'map-list-fab-map' : ''}`}
        type="button"
        onClick={onListClick}
      >
        <span className="map-list-fab-icon" aria-hidden="true">
          {isListSheetOpen ? (
            <svg className="map-list-fab-map-icon map-control-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path d="m4 5 5-2 6 2 5-2v16l-5 2-6-2-5 2V5Z" />
              <path d="M9 3v16" />
              <path d="M15 5v16" />
            </svg>
          ) : (
            <svg className="map-list-fab-list-icon map-control-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path d="M9 7h10" />
              <path d="M9 12h10" />
              <path d="M9 17h10" />
              <circle cx="5.25" cy="7" r="1.1" />
              <circle cx="5.25" cy="12" r="1.1" />
              <circle cx="5.25" cy="17" r="1.1" />
            </svg>
          )}
        </span>
      </button>

      {!isListSheetOpen ? (
        <button
          className={`map-location-fab ${locationState === 'ready' ? 'map-location-fab-active' : ''}`}
          type="button"
          onClick={onLocationClick}
          aria-label="현재 위치 보기"
        >
          {locationState === 'loading' ? (
            <span className="map-chip-gps-spinner map-control-icon" aria-hidden="true" />
          ) : (
            <span className="map-chip-gps-icon map-control-icon" aria-hidden="true">
              <span className="map-chip-gps-crosshair" />
            </span>
          )}
        </button>
      ) : null}
    </>
  )
}
