import { RouterProvider } from '@tanstack/react-router'

import { RealtimeSync } from '@/components/realtime-sync'
import { router } from '@/router'

function App() {
  return (
    <>
      <RealtimeSync />
      <RouterProvider router={router} />
    </>
  )
}

export default App