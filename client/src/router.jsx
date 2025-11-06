import { createBrowserRouter } from 'react-router'
import App from './App'
import Start from './pages/Start'
import NotFound from './pages/NotFound'
import Character from './pages/Character'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Start />,
      },
      {
        path: '/character',
        element: <Character />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
])

export default router
