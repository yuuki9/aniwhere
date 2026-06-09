import { useEffect, useRef, useState } from 'react'
import { TossAds } from '@apps-in-toss/web-bridge'
import { getTossAdGroupId, isSupported, isTossMockBannerEnabled } from '../lib/tossAds'

function isTossAdLayoutDebugEnabled() {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    const params = new URLSearchParams(window.location.search)
    const debugValue = params.get('debugAdLayout')

    if (debugValue === '1') {
      window.sessionStorage.setItem('aniwhere-debug-ad-layout', '1')
      return true
    }

    if (debugValue === '0') {
      window.sessionStorage.removeItem('aniwhere-debug-ad-layout')
      return false
    }

    return window.sessionStorage.getItem('aniwhere-debug-ad-layout') === '1'
  } catch {
    return false
  }
}

export function TossBannerAd({
  className = '',
  onVisibleChange,
  placement,
}: {
  className?: string
  onVisibleChange?: (visible: boolean) => void
  placement: string
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const adGroupId = getTossAdGroupId('banner')
  const isMockBanner = isTossMockBannerEnabled()
  const canAttempt = isMockBanner || (adGroupId != null && isSupported(TossAds.initialize.isSupported))

  useEffect(() => {
    if (isMockBanner) {
      onVisibleChange?.(true)
      return () => onVisibleChange?.(false)
    }

    if (!canAttempt || adGroupId == null || !containerRef.current) {
      onVisibleChange?.(false)
      return
    }

    let attached: { destroy: () => void } | null = null
    let didCancel = false

    TossAds.initialize({
      callbacks: {
        onInitialized: () => {
          if (didCancel || containerRef.current == null) {
            return
          }

          attached = TossAds.attachBanner(adGroupId, containerRef.current, {
            theme: 'light',
            variant: 'card',
            callbacks: {
              onAdRendered: () => {
                setIsCollapsed(false)
                onVisibleChange?.(true)
              },
              onNoFill: () => {
                setIsCollapsed(true)
                onVisibleChange?.(false)
              },
              onAdFailedToRender: () => {
                setIsCollapsed(true)
                onVisibleChange?.(false)
              },
            },
          })
        },
        onInitializationFailed: () => {
          setIsCollapsed(true)
          onVisibleChange?.(false)
        },
      },
    })

    return () => {
      didCancel = true
      onVisibleChange?.(false)
      attached?.destroy()
    }
  }, [adGroupId, canAttempt, isMockBanner, onVisibleChange, placement])

  if (!canAttempt || (!isMockBanner && isCollapsed)) {
    return null
  }

  const debugClassName = isTossAdLayoutDebugEnabled() ? 'toss-ad-banner-debug' : ''

  return (
    <aside className={['toss-ad-banner', className, debugClassName].filter(Boolean).join(' ')} aria-label="광고">
      <div className="toss-ad-banner-slot" ref={containerRef}>
        {isMockBanner ? (
          <div className="toss-ad-banner-mock" data-placement={placement}>
            <span className="toss-ad-banner-mock-icon" aria-hidden="true" />
            <span className="toss-ad-banner-mock-copy">
              <strong>테스트 광고</strong>
              <small>레이아웃 검증용 mock · AD</small>
              <em>slot 100% x 96</em>
            </span>
          </div>
        ) : null}
      </div>
    </aside>
  )
}
