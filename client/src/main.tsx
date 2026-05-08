import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TdsRuntimeProvider } from '@aniwhere/tds-runtime'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TdsRuntimeProvider>
        <App />
      </TdsRuntimeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
