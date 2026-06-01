import { useEffect } from 'react'
import { partner, tdsEvent } from '@apps-in-toss/web-framework'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { isAppsInTossRuntime } from './shared/lib/auth'
import './App.css'
import './styles/explore-search.css'
import './styles/admin-shop.css'

const MY_PROFILE_ACCESSORY_BUTTON_ID = 'profile-magnifier'
const PROFILE_ACCESSORY_BLOCKED_PATHS = new Set(['/', '/intro'])
const MY_PROFILE_ACCESSORY_BUTTON = {
  id: MY_PROFILE_ACCESSORY_BUTTON_ID,
  title: '내 정보',
  icon: {
    name: 'icon-profile-magnifier-mono',
  },
}
let isProfileAccessoryAdded = false

function syncProfileAccessoryButton(pathname: string) {
  if (PROFILE_ACCESSORY_BLOCKED_PATHS.has(pathname)) {
    if (isProfileAccessoryAdded) {
      isProfileAccessoryAdded = false
      void partner.removeAccessoryButton().catch((error) => {
        console.error('[aniwhere:navigation-accessory] remove failed', error)
      })
    }
    return
  }

  if (!isProfileAccessoryAdded) {
    isProfileAccessoryAdded = true
    void partner.addAccessoryButton(MY_PROFILE_ACCESSORY_BUTTON).catch((error) => {
      isProfileAccessoryAdded = false
      console.error('[aniwhere:navigation-accessory] add failed', error)
    })
  }
}

function App() {
  useEffect(() => {
    if (!isAppsInTossRuntime()) {
      return undefined
    }

    syncProfileAccessoryButton(router.state.location.pathname)
    const unsubscribeRouter = router.subscribe((state) => {
      syncProfileAccessoryButton(state.location.pathname)
    })
    const unsubscribeAccessoryEvent = tdsEvent.addEventListener('navigationAccessoryEvent', {
      onEvent: ({ id }) => {
        if (id === MY_PROFILE_ACCESSORY_BUTTON_ID) {
          const pathname = router.state.location.pathname

          if (pathname === '/my' || PROFILE_ACCESSORY_BLOCKED_PATHS.has(pathname)) {
            return
          }

          void router.navigate('/my')
        }
      },
      onError: (error) => {
        console.error('[aniwhere:navigation-accessory] event failed', error)
      },
    })

    return () => {
      unsubscribeRouter()
      unsubscribeAccessoryEvent()
      if (isProfileAccessoryAdded) {
        isProfileAccessoryAdded = false
        void partner.removeAccessoryButton().catch((error) => {
          console.error('[aniwhere:navigation-accessory] cleanup failed', error)
        })
      }
    }
  }, [])

  return <RouterProvider router={router} />
}

export default App
