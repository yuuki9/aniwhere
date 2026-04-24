import { RouterProvider } from 'react-router-dom'
import { TDSMobileAITProvider } from '@toss/tds-mobile-ait'
import { router } from './app/router'
import './App.css'

function App() {
  return (
    <TDSMobileAITProvider>
      <RouterProvider router={router} />
    </TDSMobileAITProvider>
  )
}

export default App
