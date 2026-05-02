import { type RefObject, useCallback, useEffect, useRef } from 'react'

type SearchFilterSheetProps = {
  open: boolean
  triggerRef: RefObject<HTMLElement>
  onClose: () => void
}

export function SearchFilterSheet({ open, triggerRef, onClose }: SearchFilterSheetProps) {
  const filterSheetRef = useRef<HTMLElement | null>(null)
  const filterCloseButtonRef = useRef<HTMLButtonElement | null>(null)

  const closeFilterSheet = useCallback(() => {
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!open) {
      return
    }

    const previousBodyOverflow = document.body.style.overflow
    const filterTriggerElement = triggerRef.current
    const focusableSelector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ')

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeFilterSheet()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const focusableControls = Array.from(
        filterSheetRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
      )

      if (focusableControls.length === 0) {
        event.preventDefault()
        return
      }

      const firstControl = focusableControls[0]
      const lastControl = focusableControls[focusableControls.length - 1]

      if (event.shiftKey && document.activeElement === firstControl) {
        event.preventDefault()
        lastControl.focus()
        return
      }

      if (!event.shiftKey && document.activeElement === lastControl) {
        event.preventDefault()
        firstControl.focus()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    window.requestAnimationFrame(() => filterCloseButtonRef.current?.focus())

    return () => {
      document.body.style.overflow = previousBodyOverflow
      window.removeEventListener('keydown', handleKeyDown)
      window.setTimeout(() => filterTriggerElement?.focus(), 0)
    }
  }, [closeFilterSheet, open, triggerRef])

  if (!open) {
    return null
  }

  return (
    <div className="search-filter-layer" role="presentation" onClick={closeFilterSheet}>
      <section
        id="search-filter-sheet"
        className="search-filter-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-filter-title"
        ref={filterSheetRef}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="search-filter-sheet-head">
          <strong id="search-filter-title">매장 필터</strong>
          <button type="button" ref={filterCloseButtonRef} onClick={closeFilterSheet} aria-label="필터 닫기">
            ×
          </button>
        </div>

        <div className="search-filter-pending">
          <strong>필터 항목 준비 중</strong>
          <small>facet API가 연결되면 지역, 카테고리, 영업 상태 기준으로 검색 결과를 좁힐 수 있어요.</small>
        </div>

        <div className="search-filter-sheet-actions">
          <button type="button" disabled>
            선택 초기화
          </button>
          <button type="button" disabled>
            필터 적용
          </button>
        </div>
      </section>
    </div>
  )
}
