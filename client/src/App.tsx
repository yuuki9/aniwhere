import { useEffect } from 'react'
import { partner, tdsEvent } from '@apps-in-toss/web-framework'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { isAppsInTossRuntime } from './shared/lib/auth'
import './App.css'
import './styles/explore-search.css'
import './styles/admin-shop.css'

const MY_PROFILE_ACCESSORY_BUTTON_ID = 'my-profile'

function App() {
  useEffect(() => {
    if (!isAppsInTossRuntime()) {
      return undefined
    }

    void partner.addAccessoryButton({
      id: MY_PROFILE_ACCESSORY_BUTTON_ID,
      title: '내 정보',
      icon: {
        name: 'icon-person-mono',
      },
    })

    return tdsEvent.addEventListener('navigationAccessoryEvent', {
      onEvent: ({ id }) => {
        if (id === MY_PROFILE_ACCESSORY_BUTTON_ID) {
          if (router.state.location.pathname === '/my') {
            return
          }

          void router.navigate('/my')
        }
      },
      onError: (error) => {
        console.error('[aniwhere:navigation-accessory] event failed', error)
      },
    })
  }, [])

  return <RouterProvider router={router} />
}

export default App
