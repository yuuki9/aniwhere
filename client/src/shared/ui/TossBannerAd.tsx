import { useEffect, useRef, useState } from 'react'
import { TossAds } from '@apps-in-toss/web-bridge'
import { getTossAdGroupId, getTossAdSupportStatus } from '../lib/tossAds'
import { toSafeErrorSummary } from '../lib/safeError'

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
  const initializeSupport = getTossAdSupportStatus(TossAds.initialize.isSupported)
  const attachSupport = getTossAdSupportStatus(TossAds.attachBanner.isSupported)
  const initializeSupported = initializeSupport.supported
  const attachSupported = attachSupport.supported
  const initializeSupportReason = initializeSupport.supported ? 'supported' : initializeSupport.reason
  const attachSupportReason = attachSupport.supported ? 'supported' : attachSupport.reason
  const canAttempt = adGroupId != null && initializeSupport.supported && attachSupport.supported

  useEffect(() => {
    if (!canAttempt || adGroupId == null || !containerRef.current) {
      const isBrowserOnly = initializeSupportReason === 'not-apps-in-toss-runtime' && attachSupportReason === 'not-apps-in-toss-runtime'

      if (adGroupId != null && !isBrowserOnly) {
        console.warn('[aniwhere:ads] banner skipped', {
          adGroupId,
          attachSupport: { reason: attachSupportReason, supported: attachSupported },
          initializeSupport: { reason: initializeSupportReason, supported: initializeSupported },
          placement,
        })
      }
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
                if (didCancel) {
                  return
                }

                console.info('[aniwhere:ads] banner rendered', { adGroupId, placement })
                setIsCollapsed(false)
                onVisibleChange?.(true)
              },
              onAdImpression: (payload) => {
                console.info('[aniwhere:ads] banner impression', { adGroupId, payload, placement })
              },
              onAdViewable: (payload) => {
                console.info('[aniwhere:ads] banner viewable', { adGroupId, payload, placement })
              },
              onAdClicked: (payload) => {
                console.info('[aniwhere:ads] banner clicked', { adGroupId, payload, placement })
              },
              onNoFill: (payload) => {
                if (didCancel) {
                  return
                }

                console.warn('[aniwhere:ads] banner no-fill', { adGroupId, payload, placement })
                setIsCollapsed(true)
                onVisibleChange?.(false)
              },
              onAdFailedToRender: (payload) => {
                if (didCancel) {
                  return
                }

                console.error('[aniwhere:ads] banner render failed', { adGroupId, payload, placement })
                setIsCollapsed(true)
                onVisibleChange?.(false)
              },
            },
          })
        },
        onInitializationFailed: (error) => {
          if (didCancel) {
            return
          }

          console.error('[aniwhere:ads] banner initialize failed', {
            adGroupId,
            error: toSafeErrorSummary(error),
            placement,
          })
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
  }, [adGroupId, attachSupportReason, attachSupported, canAttempt, initializeSupportReason, initializeSupported, onVisibleChange, placement])

  if (!canAttempt || isCollapsed) {
    return null
  }

  return (
    <aside className={['toss-ad-banner', className].filter(Boolean).join(' ')} aria-label="광고">
      <div className="toss-ad-banner-slot" ref={containerRef} />
    </aside>
  )
}
