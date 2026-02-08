'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext({})

export const useAuth = () => {
  return useContext(AuthContext)
}

import { API_BASE_URL } from './api'

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if user is logged in on page load
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userInfo = localStorage.getItem('userInfo')
    
    if (token && userInfo) {
      try {
        const user = JSON.parse(userInfo)
        setCurrentUser(user)
        
        // If user doesn't have firstName but has role, try to refresh user data
        if (!user.firstName && user.role && user.email) {
          refreshUserData(user.email, token, user.role)
        }
      } catch (error) {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
      }
    }
    setLoading(false)
  }, [])

  const refreshUserData = async (email, token, role) => {
    try {
      const userInfo = await getUserDetails(email, token, role)
      if (userInfo.firstName) {
        const updatedUser = { email, role, ...userInfo }
        setCurrentUser(updatedUser)
        localStorage.setItem('userInfo', JSON.stringify(updatedUser))
      }
    } catch (error) {
      console.error('Error refreshing user data:', error)
    }
  }

  const signup = async (email, password, firstName, lastName, userType = 'user') => {
    const endpoint = userType === 'doctor' ? '/doctor/sign-up' : 
                    userType === 'admin' ? '/admin/sign-up' : '/user/sign-up'

    const userData = {
      email,
      password,
      firstName,
      lastName
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || 'Registration failed')
      }

      const userData_response = await response.json()
      return userData_response
    } catch (error) {
      throw new Error(error.message || 'Registration failed')
    }
  }

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || 'Login failed')
      }

      const data = await response.json()
      const { token, role } = data

      // Store token and user info
      localStorage.setItem('token', token)
      
      // Get user details
      const userInfo = await getUserDetails(email, token, role)
      const userData = {
        email,
        role,
        ...userInfo
      }
      
      localStorage.setItem('userInfo', JSON.stringify(userData))
      setCurrentUser(userData)
      console.log('Login successful - User data:', userData)
      console.log('User role:', userData.role)
      console.log('Has doctor role:', userData.role?.toLowerCase() === 'doctor')
      
      return userData
    } catch (error) {
      throw new Error(error.message || 'Login failed')
    }
  }

  const getUserDetails = async (email, token, role) => {
    try {
      // Use role-based endpoints
      let endpoint = `/user/${email}`
      if (role?.toLowerCase() === 'admin') {
        endpoint = `/admin/${email}`
      } else if (role?.toLowerCase() === 'doctor') {
        endpoint = `/doctor/${email}`
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        return await response.json()
      } else {
        console.error(`Error fetching ${role} details:`, response.status, response.statusText)
        if (response.status === 404 && role?.toLowerCase() === 'admin') {
          console.error('Admin user not found. Make sure user is registered as admin.')
        }
      }
      return {}
    } catch (error) {
      console.error('Error fetching user details:', error)
      return {}
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    setCurrentUser(null)
  }

  // Get token for API calls
  const getToken = () => {
    return localStorage.getItem('token')
  }

  // Check if user has specific role
  const hasRole = (role) => {
    if (!currentUser?.role) return false
    const userRole = currentUser.role.toLowerCase()
    const checkRole = role.toLowerCase()
    console.log('Checking role:', { userRole, checkRole, match: userRole === checkRole })
    return userRole === checkRole || userRole === `role_${checkRole}`
  }

  // Update current user data
  const updateUser = (updatedUserData) => {
    const updatedUser = { ...currentUser, ...updatedUserData }
    setCurrentUser(updatedUser)
    localStorage.setItem('userInfo', JSON.stringify(updatedUser))
  }

  const value = {
    currentUser,
    signup,
    login,
    logout,
    loading,
    getToken,
    hasRole,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}