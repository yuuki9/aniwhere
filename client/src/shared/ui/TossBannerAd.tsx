import { useEffect, useRef, useState } from 'react'
import { TossAds } from '@apps-in-toss/web-bridge'
import { getTossAdGroupId, isSupported } from '../lib/tossAds'

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
  const canAttempt = adGroupId != null && isSupported(TossAds.initialize.isSupported)

  useEffect(() => {
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
  }, [adGroupId, canAttempt, onVisibleChange, placement])

  if (!canAttempt || isCollapsed) {
    return null
  }

  return (
    <aside className={['toss-ad-banner', className].filter(Boolean).join(' ')} aria-label="광고">
      <div className="toss-ad-banner-slot" ref={containerRef} />
    </aside>
  )
}
