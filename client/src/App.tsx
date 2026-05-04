import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import './App.css'
import './styles/explore-search.css'
import './styles/admin-shop.css'

function App() {
  return <RouterProvider router={router} />
}

export default App
