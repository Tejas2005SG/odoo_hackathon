import React from 'react'
import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../Store/auth.store.js' // Update with correct path

function Dashboard() {
  const { user } = useAuthStore()
  
  // Get user ID (note: it's 'id' not '_id' in your user object)
  const userId = user?.id
  
  // Optional: You can also log it to see the value
  console.log('User ID:', userId)
  
  return (
    <div>
      {/* You can use the userId here if needed */}
      {/* {userId && <p>{</p>} */}
      <Outlet />
    </div>
  )
}

export default Dashboard