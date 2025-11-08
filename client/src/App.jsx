import { Outlet } from 'react-router'
import menuImage from '/menu-img.jpg'
import backgroundImage from '/background_patter.avif'
import { Toaster } from 'react-hot-toast'

const App = () => {
  return (
    <div className='w-screen h-screen'>
      <div className='w-full h-screen absolute'>
        <img
          src={backgroundImage}
          className='w-full h-full object-cover grayscale-100 opacity-30'
        />
      </div>
      <div className='w-screen sm:w-[600px] mx-0 sm:mx-auto h-screen'>
        <div className='relative w-full h-full'>
          <div className='absolute w-full h-full'>
            <Outlet />
            <Toaster />
          </div>
          <img src={menuImage} className='w-full h-full object-cover z-[-1]' />
        </div>
      </div>
    </div>
  )
}

export default App
