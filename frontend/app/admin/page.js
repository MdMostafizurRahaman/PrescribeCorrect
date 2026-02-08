'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Navigation from '@/components/Navigation'

import { API_BASE_URL } from '@/lib/api'

export default function AdminDashboard() {
  const { currentUser, hasRole, getToken, logout } = useAuth()
  const [pendingDoctors, setPendingDoctors] = useState([])
  const [activeDoctors, setActiveDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState({})
  const [activeTab, setActiveTab] = useState('pending')
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    pendingApprovals: 0,
    totalChats: 0
  })
  const router = useRouter()

  useEffect(() => {
    if (!currentUser) {
      router.push('/auth/login')
      return
    }
    
    if (!hasRole('admin')) {
      router.push('/')
      return
    }

    fetchDashboardData()
  }, [currentUser])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const token = getToken()
      
      // Fetch all doctors
      const doctorsResponse = await fetch(`${API_BASE_URL}/doctor/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (doctorsResponse.ok) {
        const doctors = await doctorsResponse.json()
        console.log('Doctors data:', doctors)
        console.log('First doctor sample:', doctors[0])
        setPendingDoctors(doctors.filter(doc => doc.status === 'PENDING'))
        setActiveDoctors(doctors.filter(doc => doc.status === 'ACTIVE'))
        
        setStats(prev => ({
          ...prev,
          totalDoctors: doctors.filter(doc => doc.status === 'ACTIVE').length,
          pendingApprovals: doctors.filter(doc => doc.status === 'PENDING').length
        }))
      }

      // Fetch user statistics
      const usersResponse = await fetch(`${API_BASE_URL}/user/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (usersResponse.ok) {
        const users = await usersResponse.json()
        setStats(prev => ({
          ...prev,
          totalUsers: users.length
        }))
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDoctorAction = async (doctorEmail, action) => {
    try {
      console.log('handleDoctorAction called with:', { doctorEmail, action })
      
      if (!doctorEmail) {
        alert('ডক্টরের ইমেইল পাওয়া যায়নি। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।')
        return
      }
      
      setActionLoading(prev => ({ ...prev, [doctorEmail]: true }))
      const token = getToken()
      
      const status = action === 'approve' ? 'ACTIVE' : 'DISABLED'
      const apiUrl = `${API_BASE_URL}/doctor/status/${doctorEmail}`
      
      console.log('API URL:', apiUrl)
      console.log('Status:', status)
      console.log('Token:', token ? 'Present' : 'Missing')
      
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(status),
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (response.ok) {
        // Refresh the data
        await fetchDashboardData()
        
        // Show success message with better UX
        const successAlert = document.createElement('div')
        successAlert.className = 'alert alert-success fixed top-4 right-4 z-50 w-auto'
        successAlert.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>ডক্টর ${action === 'approve' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'} হয়েছে সফলভাবে!</span>
        `
        document.body.appendChild(successAlert)
        setTimeout(() => {
          document.body.removeChild(successAlert)
        }, 3000)
      } else {
        const errorText = await response.text()
        console.error('API Error:', errorText)
        alert('ডক্টরের স্ট্যাটাস আপডেট করতে ব্যর্থ: ' + errorText)
      }
    } catch (error) {
      console.error('Error updating doctor status:', error)
      alert('ডক্টরের স্ট্যাটাস আপডেটে সমস্যা হয়েছে: ' + error.message)
    } finally {
      setActionLoading(prev => ({ ...prev, [doctorEmail]: false }))
    }
  }

  const formatSpecializations = (specializations) => {
    if (!specializations || specializations.length === 0) return 'Not specified'
    return specializations.join(', ')
  }

  const formatDegrees = (degrees) => {
    if (!degrees || degrees.length === 0) return 'Not specified'
    return degrees.join(', ')
  }

  const getDoctorDisplayName = (doctor) => {
    // Try firstName and lastName first
    if (doctor.firstName && doctor.lastName) {
      return `Dr. ${doctor.firstName} ${doctor.lastName}`
    }
    
    // Try firstName only
    if (doctor.firstName) {
      return `Dr. ${doctor.firstName}`
    }
    
    // Try lastName only
    if (doctor.lastName) {
      return `Dr. ${doctor.lastName}`
    }
    
    // Try email prefix
    if (doctor.email) {
      const emailPrefix = doctor.email.split('@')[0]
      return `Dr. ${emailPrefix}`
    }
    
    // Try user object fields
    if (doctor.user) {
      if (doctor.user.firstName && doctor.user.lastName) {
        return `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`
      }
      if (doctor.user.firstName) {
        return `Dr. ${doctor.user.firstName}`
      }
      if (doctor.user.lastName) {
        return `Dr. ${doctor.user.lastName}`
      }
    }
    
    // Fallback
    return 'Dr. [Name not available]'
  }

  if (!currentUser || !hasRole('admin')) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-4">You need admin privileges to access this page</p>
          <button onClick={() => router.push('/')} className="btn btn-primary">Go Home</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-100">
      <Navigation />
      <div className="pt-16">
        <div className="container mx-auto p-4">
          {/* Admin Dashboard Header */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-primary mb-4">🛡️ Admin Dashboard</h1>
            <p className="text-lg text-base-content/70">
              Manage users, doctors, and system settings
            </p>
          </motion.div>

          {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="stat bg-primary text-primary-content rounded-lg">
            <div className="stat-figure">
              <div className="text-3xl">👥</div>
            </div>
            <div className="stat-title">Total Users</div>
            <div className="stat-value">{stats.totalUsers}</div>
          </div>
          
          <div className="stat bg-success text-success-content rounded-lg">
            <div className="stat-figure">
              <div className="text-3xl">👨‍⚕️</div>
            </div>
            <div className="stat-title">Active Doctors</div>
            <div className="stat-value">{stats.totalDoctors}</div>
          </div>
          
          <div className="stat bg-warning text-warning-content rounded-lg">
            <div className="stat-figure">
              <div className="text-3xl">⏳</div>
            </div>
            <div className="stat-title">Pending Approvals</div>
            <div className="stat-value">{stats.pendingApprovals}</div>
          </div>
          
          <div className="stat bg-info text-info-content rounded-lg">
            <div className="stat-figure">
              <div className="text-3xl">💬</div>
            </div>
            <div className="stat-title">Total Chats</div>
            <div className="stat-value">{stats.totalChats}</div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="tabs tabs-boxed mb-6">
          <button 
            className={`tab ${activeTab === 'pending' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            ⏳ Pending Approvals ({pendingDoctors.length})
          </button>
          <button 
            className={`tab ${activeTab === 'active' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            ✅ Active Doctors ({activeDoctors.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="mt-4">Loading dashboard data...</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Pending Doctors */}
            {activeTab === 'pending' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">🔍 Doctor Applications Pending Review</h2>
                {pendingDoctors.length === 0 ? (
                  <div className="text-center py-12 bg-base-200 rounded-lg">
                    <div className="text-4xl mb-4">🎉</div>
                    <p className="text-lg">No pending doctor applications!</p>
                    <p className="text-sm text-base-content/70">All applications have been reviewed.</p>
                  </div>
                ) : (
                  pendingDoctors.map((doctor) => (
                    <motion.div 
                      key={`${doctor.id}-${doctor.user?.email}`}
                      className="card bg-base-200 shadow-lg"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="card-body">
                        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                          <h3 className="card-title text-primary">
                            {getDoctorDisplayName(doctor)}
                          </h3>
                          <p className="text-sm text-base-content/70 mb-2">📧 {doctor.email}</p>                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div>
                                <p className="font-semibold">🎓 Degrees:</p>
                                <p className="text-sm">{formatDegrees(doctor.degree)}</p>
                              </div>
                              <div>
                                <p className="font-semibold">🏥 Specialization:</p>
                                <p className="text-sm">{formatSpecializations(doctor.specialization)}</p>
                              </div>
                              <div>
                                <p className="font-semibold">🏢 Institute:</p>
                                <p className="text-sm">{doctor.institute || 'Not specified'}</p>
                              </div>
                              <div>
                                <p className="font-semibold">📍 Location:</p>
                                <p className="text-sm">{doctor.currentCity || 'Not specified'}</p>
                              </div>
                              <div>
                                <p className="font-semibold">🕒 Available Time:</p>
                                <p className="text-sm">{doctor.availableTime || 'Not specified'}</p>
                              </div>
                              <div>
                                <p className="font-semibold">📞 Phone:</p>
                                <p className="text-sm">{doctor.phoneNumber?.join(', ') || 'Not specified'}</p>
                              </div>
                              {doctor.websiteUrl && (
                                <div>
                                  <p className="font-semibold">🌐 Website:</p>
                                  <p className="text-sm">
                                    <a 
                                      href={doctor.websiteUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="link link-primary"
                                    >
                                      {doctor.websiteUrl}
                                    </a>
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            {doctor.chamberAddress && (
                              <div className="mt-2">
                                <p className="font-semibold">🏥 Chamber Address:</p>
                                <p className="text-sm">{doctor.chamberAddress}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <button 
                              className={`btn btn-success btn-sm ${actionLoading[doctor.email] ? 'loading' : ''}`}
                              onClick={() => handleDoctorAction(doctor.email, 'approve')}
                              disabled={actionLoading[doctor.email]}
                            >
                              ✅ Approve
                            </button>
                            <button 
                              className={`btn btn-error btn-sm ${actionLoading[doctor.email] ? 'loading' : ''}`}
                              onClick={() => handleDoctorAction(doctor.email, 'reject')}
                              disabled={actionLoading[doctor.email]}
                            >
                              ❌ Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* Active Doctors */}
            {activeTab === 'active' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">👨‍⚕️ Active Doctors</h2>
                {activeDoctors.length === 0 ? (
                  <div className="text-center py-12 bg-base-200 rounded-lg">
                    <div className="text-4xl mb-4">🏥</div>
                    <p className="text-lg">No active doctors yet!</p>
                    <p className="text-sm text-base-content/70">Approved doctors will appear here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {activeDoctors.map((doctor) => (
                      <motion.div 
                        key={`active-${doctor.id}-${doctor.user?.email}`}
                        className="card bg-base-200 shadow-lg"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="card-body">
                          <h3 className="card-title text-success">
                            {getDoctorDisplayName(doctor)}
                          </h3>
                          <p className="text-sm text-base-content/70">📧 {doctor.email}</p>
                          
                          <div className="mt-2 space-y-1">
                            <p className="text-sm"><strong>🎓:</strong> {formatDegrees(doctor.degree)}</p>
                            <p className="text-sm"><strong>🏥:</strong> {formatSpecializations(doctor.specialization)}</p>
                            <p className="text-sm"><strong>📍:</strong> {doctor.currentCity || 'Not specified'}</p>
                            <p className="text-sm"><strong>🕒:</strong> {doctor.availableTime || 'Not specified'}</p>
                            {doctor.websiteUrl && (
                              <p className="text-sm">
                                <strong>🌐:</strong> 
                                <a 
                                  href={doctor.websiteUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="link link-primary ml-1"
                                >
                                  Website
                                </a>
                              </p>
                            )}
                          </div>

                          <div className="card-actions justify-end mt-4">
                            <button 
                              className="btn btn-warning btn-sm"
                              onClick={() => handleDoctorAction(doctor.email, 'reject')}
                            >
                              🚫 Disable
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
        </div>
      </div>
    </div>
  )
}
