import React, { useEffect } from 'react'
import { useNavigate } from 'react-router'

const NotFound = () => {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/')
  }, [navigate])
  return null
}

export default NotFound
