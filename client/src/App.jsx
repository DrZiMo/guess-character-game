import { Outlet } from 'react-router'
import menuImage from '/menu-img.jpg'
import backgroundImage from '/background_patter.avif'

const App = () => {
  return (
    <div>
      <div className='w-screen h-screen absolute'>
        <img
          src={backgroundImage}
          className='w-full h-full object-cover grayscale-100 opacity-30'
        />
      </div>
      <div className='w-screen sm:w-[600px] left-0 top-0 sm:left-1/2 sm:-translate-x-1/2 h-screen absolute'>
        <div className='relative w-full h-full'>
          <div className='absolute w-full h-full'>
            <Outlet />
          </div>
          <img src={menuImage} className='w-full h-full object-cover z-[-1]' />
        </div>
      </div>
    </div>
  )
}

export default App
