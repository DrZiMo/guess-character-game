import { createBrowserRouter } from 'react-router'
import App from './App'
import Start from './pages/Start'
import NotFound from './pages/NotFound'
import Character from './pages/Character'
import Room from './pages/Room'

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
      {
        path: '/room',
        element: <Room />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
])

export default router
