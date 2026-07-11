import headerText from '/Game is under construction.png'

const UnderConstraction = () => {
  return (
    <div className='w-full h-full flex flex-col justify-center items-center'>
      <div className='text-center'>
        <img src={headerText} alt='Header Text' />
      </div>
      <p className='text-white text-sm mt-4'>Please come back later!</p>
      <div>
        <img
          src='/under_constraction-removebg-preview.png'
          alt='Under Construction'
        />
      </div>
    </div>
  )
}

export default UnderConstraction
