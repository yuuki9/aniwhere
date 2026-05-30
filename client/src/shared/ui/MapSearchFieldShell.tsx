import { type FormEvent, type KeyboardEvent } from 'react'
import { SHOP_SEARCH_PLACEHOLDER } from '../lib/searchCopy'

function SearchFieldIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
  )
}

type MapSearchFieldButtonProps = {
  value?: string | null
  onClick: () => void
}

export function MapSearchFieldButton({ value, onClick }: MapSearchFieldButtonProps) {
  const label = value?.trim() || SHOP_SEARCH_PLACEHOLDER

  return (
    <button className="search-screen-bar map-search-field" type="button" onClick={onClick}>
      <span className="map-search-field-copy">{label}</span>
      <SearchFieldIcon />
    </button>
  )
}

type MapSearchFieldFormProps = {
  value: string
  autoFocus?: boolean
  onChange: (value: string) => void
  onClear: () => void
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function MapSearchFieldForm({
  value,
  autoFocus,
  onChange,
  onClear,
  onKeyDown,
  onSubmit,
}: MapSearchFieldFormProps) {
  return (
    <form className="search-screen-form search-screen-bar map-search-field" onSubmit={onSubmit}>
      <input
        autoFocus={autoFocus}
        aria-label="검색어 입력"
        className="search-screen-input"
        placeholder={SHOP_SEARCH_PLACEHOLDER}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
      />
      {value ? (
        <button className="search-screen-clear-button" type="button" aria-label="검색어 지우기" onClick={onClear}>
          ×
        </button>
      ) : (
        <SearchFieldIcon />
      )}
    </form>
  )
}
