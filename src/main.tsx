import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { MantineProvider } from '@mantine/core'
import { router } from './app/router'
import { queryClient } from './app/query'
import '@mantine/core/styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider><RouterProvider router={router} /></MantineProvider>
    </QueryClientProvider>
  </StrictMode>,
)
