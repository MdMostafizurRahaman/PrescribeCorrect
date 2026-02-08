'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Navigation from '@/components/Navigation'

import { API_BASE_URL } from '@/lib/api'

export default function ProfilePage() {
  const { currentUser, hasRole, getToken, logout, updateUser } = useAuth()
  const [profileData, setProfileData] = useState(null)
  const [analysisHistory, setAnalysisHistory] = useState([])
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    emergencyContact: '',
    medicalHistory: [], // Array of objects
    allergies: '',
    currentMedications: [] // Array of strings
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!currentUser) {
      router.push('/auth/login')
      return
    }
    
    fetchAnalysisHistory()
  }, [currentUser])

  useEffect(() => {
    if (currentUser) {
      fetchProfileData()
    }
  }, [currentUser, analysisHistory])

  const fetchAnalysisHistory = async () => {
    try {
      // First load from localStorage (works for all users)
      const localAnalyses = localStorage.getItem('PrescribeCorrect_analyses')
      if (localAnalyses) {
        const parsedLocal = JSON.parse(localAnalyses)
        setAnalysisHistory(prev => [...parsedLocal.slice(0, 3), ...prev])
      }

      // Then load from server if logged in
      if (currentUser) {
        const token = getToken()
        const response = await fetch(`${API_BASE_URL}/analysis/my-analyses`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        if (response.ok) {
          const data = await response.json()
          console.log('Analysis history data:', data) // Debug log
          setAnalysisHistory(prev => {
            // Merge and deduplicate
            const combined = [...prev, ...data.slice(0, 5)]
            const unique = combined.filter((item, index, self) => 
              index === self.findIndex((t) => t.id === item.id)
            )
            return unique.slice(0, 5) // Show only last 5 analyses
          })
        }
      }
    } catch (error) {
      console.error('Error fetching analysis history:', error)
    }
  }

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      const token = getToken()
      const email = currentUser?.email
      
      // Use role-based endpoints for fetching data
      let url
      if (hasRole('admin')) {
        url = `${API_BASE_URL}/admin/${email}`
      } else if (hasRole('doctor')) {
        url = `${API_BASE_URL}/doctor/${email}`
      } else {
        url = `${API_BASE_URL}/user/${email}`
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setProfileData(data)
        
        // Auto-fill medical info from latest analysis if profile fields are empty
        if (analysisHistory.length > 0) {
          const latestAnalysis = analysisHistory[0]
          
          // Extract medical history from both server and localStorage analysis
          let medicalHistory = []
          if (latestAnalysis.keyDiseases) {
            // Server analysis
            medicalHistory = latestAnalysis.keyDiseases.map(disease => ({ description: disease }))
          } else if (latestAnalysis.medicalHistory) {
            // localStorage analysis
            medicalHistory = latestAnalysis.medicalHistory.map(item => ({ description: item }))
          } else if (latestAnalysis.primaryDiagnosis?.condition) {
            // Extract from primaryDiagnosis
            medicalHistory = [{ description: latestAnalysis.primaryDiagnosis.condition }]
          } else if (latestAnalysis.primaryDiagnosis?.conditions) {
            // Extract from primaryDiagnosis conditions array
            medicalHistory = latestAnalysis.primaryDiagnosis.conditions.map(condition => ({ description: condition }))
          }
          
          // Extract current medications with detailed information
          let currentMedications = []
          if (latestAnalysis.medicines) {
            // Server analysis - simple medicine names
            currentMedications = latestAnalysis.medicines
          } else if (latestAnalysis.medications) {
            // localStorage analysis - detailed medication objects
            currentMedications = latestAnalysis.medications.map(med => {
              let medString = med.prescribedName || med.genericName || med.name || 'Unknown Medicine'
              if (med.bangla) medString += ` (${med.bangla})`
              if (med.strength) medString += ` - ${med.strength}`
              if (med.frequency) medString += ` - ${med.frequency}`
              if (med.duration) medString += ` - ${med.duration}`
              if (med.purpose) medString += ` [${med.purpose}]`
              return medString
            })
          } else if (latestAnalysis.currentMedications) {
            // localStorage analysis - already processed medications
            currentMedications = latestAnalysis.currentMedications.map(med => 
              typeof med === 'string' ? med : `${med.name} - ${med.frequency} - ${med.duration || ''}`
            )
          }
          
          // Extract allergies from various sources
          let allergies = ''
          if (latestAnalysis.allergies && Array.isArray(latestAnalysis.allergies)) {
            allergies = latestAnalysis.allergies.join(', ')
          } else if (latestAnalysis.safetyWarnings) {
            // Check safety warnings for allergy information
            const allergyWarnings = latestAnalysis.safetyWarnings.filter(warning => 
              warning.toLowerCase().includes('allerg') || warning.toLowerCase().includes('অ্যালার্জি')
            )
            allergies = allergyWarnings.join(', ')
          }
          
          setFormData({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            phoneNumber: data.phoneNumber || '',
            address: data.address || '',
            dateOfBirth: data.dateOfBirth || '',
            gender: data.gender || '',
            bloodGroup: data.bloodGroup || '',
            emergencyContact: data.emergencyContact || '',
            medicalHistory: Array.isArray(data.medicalHistory) && data.medicalHistory.length > 0 
              ? data.medicalHistory 
              : medicalHistory,
            allergies: data.allergies || allergies,
            currentMedications: Array.isArray(data.currentMedications) && data.currentMedications.length > 0
              ? data.currentMedications
              : currentMedications
          })
        } else {
          setFormData({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            phoneNumber: data.phoneNumber || '',
            address: data.address || '',
            dateOfBirth: data.dateOfBirth || '',
            gender: data.gender || '',
            bloodGroup: data.bloodGroup || '',
            emergencyContact: data.emergencyContact || '',
            medicalHistory: Array.isArray(data.medicalHistory) ? data.medicalHistory : [],
            allergies: data.allergies || '',
            currentMedications: Array.isArray(data.currentMedications) ? data.currentMedications : []
          })
        }
      } else if (response.status === 404) {
        // Auto-fill from latest analysis for new users
        if (analysisHistory.length > 0) {
          const latestAnalysis = analysisHistory[0]
          
          // Extract medical history from both server and localStorage analysis
          let medicalHistory = []
          if (latestAnalysis.keyDiseases) {
            // Server analysis
            medicalHistory = latestAnalysis.keyDiseases.map(disease => ({ description: disease }))
          } else if (latestAnalysis.medicalHistory) {
            // localStorage analysis
            medicalHistory = latestAnalysis.medicalHistory.map(item => ({ description: item }))
          }
          
          // Extract current medications
          let currentMedications = []
          if (latestAnalysis.medicines) {
            // Server analysis
            currentMedications = latestAnalysis.medicines
          } else if (latestAnalysis.currentMedications) {
            // localStorage analysis
            currentMedications = latestAnalysis.currentMedications.map(med => 
              typeof med === 'string' ? med : `${med.name} - ${med.frequency} - ${med.duration || ''}`
            )
          }
          
          setFormData({
            firstName: currentUser?.firstName || '',
            lastName: currentUser?.lastName || '',
            email: currentUser?.email || '',
            phoneNumber: '',
            address: '',
            dateOfBirth: '',
            gender: '',
            bloodGroup: '',
            emergencyContact: '',
            medicalHistory: medicalHistory,
            allergies: latestAnalysis.allergies ? latestAnalysis.allergies.join(', ') : '',
            currentMedications: currentMedications
          })
        } else {
          setFormData({
            firstName: currentUser?.firstName || '',
            lastName: currentUser?.lastName || '',
            email: currentUser?.email || '',
            phoneNumber: '',
            address: '',
            dateOfBirth: '',
            gender: '',
            bloodGroup: '',
            emergencyContact: '',
            medicalHistory: [],
            allergies: '',
            currentMedications: []
          })
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error)
      setError('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    // For medicalHistory and currentMedications, parse textarea value to array
    if (name === 'medicalHistory') {
      // Expecting JSON array of objects or comma-separated values
      let arr = []
      try {
        // First try to parse as JSON
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) {
          arr = parsed
        } else {
          // If not array, treat as single item
          arr = [{ description: String(parsed) }]
        }
      } catch {
        // If JSON parse fails, split by newlines and wrap as objects
        arr = value.split('\n').filter(Boolean).map((item) => ({ description: item.trim() }))
      }
      setFormData(prev => ({ ...prev, medicalHistory: arr }))
    } else if (name === 'currentMedications') {
      let arr = []
      try {
        // First try to parse as JSON
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) {
          arr = parsed.map(item => String(item))
        } else {
          arr = [String(parsed)]
        }
      } catch {
        // If JSON parse fails, split by comma or newlines
        arr = value.split(/,|\n/).map(s => s.trim()).filter(Boolean)
      }
      setFormData(prev => ({ ...prev, currentMedications: arr }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const token = getToken()
      
      // Use role-based endpoints
      let url, method = 'PUT'
      if (hasRole('admin')) {
        url = `${API_BASE_URL}/admin` // Admin update doesn't need email in URL
      } else if (hasRole('doctor')) {
        url = `${API_BASE_URL}/doctor`
      } else {
        url = `${API_BASE_URL}/user`
      }
      
      // Prepare payload: medicalHistory and currentMedications as arrays
      const payload = {
        ...formData,
        medicalHistory: formData.medicalHistory,
        currentMedications: formData.currentMedications
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      if (response.ok) {
        setSuccess('Profile updated successfully!')
        setIsEditing(false)
        
        // Update currentUser in auth context to reflect name changes in navbar
        updateUser({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email
        })
        
        await fetchProfileData() // Refresh data
      } else {
        const errorText = await response.text()
        setError(errorText || 'Failed to save profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      setError('An error occurred while saving your profile')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to access your profile</h1>
          <a href="/auth/login" className="btn btn-primary">Login</a>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-100">
      <Navigation />
      
      <div className="container mx-auto p-4 max-w-4xl pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">
              Your Profile
            </h1>
            <div className="text-xl font-semibold text-base-content mb-2">
              {currentUser?.firstName || currentUser?.lastName
                ? `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim()
                : currentUser?.email
                  ? (() => {
                      const emailPrefix = currentUser.email.split('@')[0]
                      const cleanedPrefix = emailPrefix.replace(/[0-9]/g, '').replace(/[^a-zA-Z]/g, '')
                      if (cleanedPrefix.length > 2) {
                        return cleanedPrefix.charAt(0).toUpperCase() + cleanedPrefix.slice(1)
                      } else {
                        return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)
                      }
                    })()
                  : 'User'}
            </div>
            <p className="text-base-content/70">
              Manage your personal and health information
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="stat bg-primary text-primary-content rounded-lg">
              <div className="stat-figure">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-black stroke-2"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div className="stat-title text-black font-bold">Account Status</div>
              <div className="stat-value text-sm text-black font-semibold">
                {hasRole('admin') ? '👨‍💼 Admin' : hasRole('doctor') ? '👨‍⚕️ Doctor' : '👤 Patient'}
              </div>
              <div className="stat-desc text-black font-medium">
                {hasRole('admin') ? 'Admin Account' : hasRole('doctor') ? 'Doctor Account' : 'Patient Account'}
              </div>
            </div>

            <div className="stat bg-secondary text-secondary-content rounded-lg">
              <div className="stat-figure">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-black stroke-2"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path></svg>
              </div>
              <div className="stat-title text-black font-bold">Last Updated</div>
              <div className="stat-value text-sm text-black font-semibold">
                {profileData?.updatedAt ? new Date(profileData.updatedAt).toLocaleDateString('en-US') : 
                 profileData?.lastModified ? new Date(profileData.lastModified).toLocaleDateString('en-US') :
                 new Date().toLocaleDateString('en-US')}
              </div>
              <div className="stat-desc text-black font-medium">Profile Updated</div>
            </div>

            <div className="stat bg-accent text-accent-content rounded-lg">
              <div className="stat-figure">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-black stroke-2"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
              </div>
              <div className="stat-title text-black font-bold">PrescribeCorrect Member</div>
              <div className="stat-value text-sm text-black font-semibold">2025</div>
              <div className="stat-desc text-black font-medium">Year Joined</div>
            </div>
          </div>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success mb-4">
              <span>{success}</span>
            </div>
          )}

          {/* Profile Form */}
          <div className="card bg-gradient-to-br from-white to-blue-50 shadow-xl border border-blue-100">
            <div className="card-body">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-primary">
                  {isEditing ? '✏️ Edit Profile' : '📋 Profile Information'}
                </h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-primary btn-sm"
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold text-lg flex items-center gap-2">
                        👤 <span>First Name</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      placeholder="Your first name"
                      className="input input-bordered focus:input-primary"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold text-lg flex items-center gap-2">
                        👤 <span>Last Name</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Your last name"
                      className="input input-bordered focus:input-primary"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold text-lg flex items-center gap-2">
                        📧 <span>Email</span>
                      </span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Your email address"
                      className="input input-bordered focus:input-primary"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold text-lg flex items-center gap-2">
                        📞 <span>Phone Number</span>
                      </span>
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      placeholder="+880 1234567890"
                      className="input input-bordered focus:input-primary"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold text-lg flex items-center gap-2">
                        🎂 <span>Date of Birth</span>
                      </span>
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      className="input input-bordered focus:input-primary"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold text-lg flex items-center gap-2">
                        ⚧️ <span>Gender</span>
                      </span>
                    </label>
                    <select
                      name="gender"
                      className="select select-bordered focus:select-primary"
                      value={formData.gender}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold text-lg flex items-center gap-2">
                        🩸 <span>Blood Group</span>
                      </span>
                    </label>
                    <select
                      name="bloodGroup"
                      className="select select-bordered focus:select-primary"
                      value={formData.bloodGroup}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold text-lg flex items-center gap-2">
                        🚨 <span>Emergency Contact</span>
                      </span>
                    </label>
                    <input
                      type="tel"
                      name="emergencyContact"
                      placeholder="Emergency contact number"
                      className="input input-bordered focus:input-primary"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold text-lg flex items-center gap-2">
                      🏠 <span>Address</span>
                    </span>
                  </label>
                  <textarea
                    name="address"
                    placeholder="Your complete address"
                    className="textarea textarea-bordered focus:textarea-primary h-24"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  ></textarea>
                </div>

                {/* Medical Information */}
                <div className="divider">
                  <span className="text-lg font-bold text-primary">🏥 Medical Information</span>
                </div>

                {/* Auto-fill notice */}
                {analysisHistory.length > 0 && (
                  <div className="alert alert-info mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>
                      📋 <strong>স্বয়ংক্রিয় তথ্য:</strong> আপনার সর্বশেষ AI বিশ্লেষণ থেকে চিকিৎসা ইতিহাস ও বর্তমান ওষুধের তথ্য স্বয়ংক্রিয়ভাবে যোগ করা হয়েছে। প্রয়োজনে সম্পাদনা করুন।
                    </span>
                  </div>
                )}

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold text-lg flex items-center gap-2">
                      📋 <span>Medical History</span>
                    </span>
                  </label>
                  <textarea
                    name="medicalHistory"
                    placeholder="Enter each history item on a new line, or paste JSON array."
                    className="textarea textarea-bordered focus:textarea-primary h-32"
                    value={Array.isArray(formData.medicalHistory) ? formData.medicalHistory.map(h => h.description || '').join('\n') : ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  ></textarea>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold text-lg flex items-center gap-2">
                      ⚠️ <span>Allergies</span>
                    </span>
                  </label>
                  <textarea
                    name="allergies"
                    placeholder="List any food, drug, or other allergies"
                    className="textarea textarea-bordered focus:textarea-primary h-24"
                    value={formData.allergies}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  ></textarea>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold text-lg flex items-center gap-2">
                      💊 <span>Current Medications</span>
                    </span>
                  </label>
                  <textarea
                    name="currentMedications"
                    placeholder="Enter each medication on a new line, or comma separated."
                    className="textarea textarea-bordered focus:textarea-primary h-24"
                    value={Array.isArray(formData.currentMedications) ? formData.currentMedications.join('\n') : ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  ></textarea>
                </div>

                {isEditing && (
                  <div className="card-actions justify-center mt-8 space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false)
                        fetchProfileData() // Reset form
                      }}
                      className="btn btn-outline"
                    >
                      ❌ Cancel
                    </button>
                    <button 
                      type="submit" 
                      className={`btn btn-primary ${submitting ? 'loading' : ''}`}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="loading loading-spinner"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          💾 Save Profile
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>

              {!isEditing && (
                <div className="card-actions justify-center mt-8 space-x-4">
                  {hasRole('doctor') && (
                    <button
                      onClick={() => router.push('/doctor-profile')}
                      className="btn btn-secondary"
                    >
                      👨‍⚕️ Doctor Profile
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="btn btn-error"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
