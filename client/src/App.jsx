import { Outlet, useNavigate } from 'react-router'
import menuImage from '/menu-img.jpg'
import { Toaster } from 'react-hot-toast'
import { Analytics } from '@vercel/analytics/react'
import { useEffect } from 'react'

const App = () => {
  const navigate = useNavigate()
  const isUnderConstruction = false

  useEffect(() => {
    if (isUnderConstruction) {
      navigate('/under-construction')
    }
  }, [isUnderConstruction, navigate])

  return (
    <div className='relative min-h-screen w-full overflow-hidden'>
      <img
        src={menuImage}
        alt=''
        className='absolute inset-0 h-full w-full object-cover'
      />

      <div className='relative z-10 mx-auto flex min-h-screen w-full max-w-[600px] flex-col py-5'>
        <div className='flex-1 flex flex-col justify-center items-center'>
          <Outlet />
        </div>
        <Toaster />
        <Analytics />
        <div className='mt-4 text-center text-white'>
          By{' '}
          <a
            target='_blank'
            href='https://linktr.ee/zuhaibpro'
            className='text-blue-200 hover:text-blue-600'
          >
            zuhaib.pro
          </a>
        </div>
      </div>
    </div>
  )
}

export default App
