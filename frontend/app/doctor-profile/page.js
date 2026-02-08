'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Navigation from '@/components/Navigation'

import { API_BASE_URL } from '@/lib/api'

export default function DoctorProfile() {
  const { currentUser, hasRole, getToken, logout } = useAuth()
  const [doctorData, setDoctorData] = useState(null)
  const [formData, setFormData] = useState({
    specialization: [''],
    degree: [''],
    phoneNumber: [''],
    chamberAddress: '',
    designation: '',
    institute: '',
    currentCity: '',
    availableTime: '',
    websiteUrl: ''
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (!currentUser) {
      router.push('/auth/login')
      return
    }
    
    console.log('Doctor profile page - Current user:', currentUser)
    console.log('Current user role:', currentUser.role)
    console.log('Has doctor role check:', hasRole('doctor'))
    
    if (!hasRole('doctor')) {
      console.log('User does not have doctor role, redirecting...')
      router.push('/')
      return
    }

    fetchDoctorData()
  }, [currentUser])

  const fetchDoctorData = async () => {
    try {
      setLoading(true)
      const token = getToken()
      
      const response = await fetch(`${API_BASE_URL}/doctor/${currentUser?.email}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDoctorData(data)
        
        // Populate form with existing data
        setFormData({
          specialization: data.specialization || [''],
          degree: data.degree || [''],
          phoneNumber: data.phoneNumber || [''],
          chamberAddress: data.chamberAddress || '',
          designation: data.designation || '',
          institute: data.institute || '',
          currentCity: data.currentCity || '',
          availableTime: data.availableTime || '',
          websiteUrl: data.websiteUrl || ''
        })
      } else if (response.status === 404) {
        // Doctor profile doesn't exist yet, use empty form
        setDoctorData(null)
      }
    } catch (error) {
      console.error('Error fetching doctor data:', error)
      setError('Failed to load doctor profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleArrayInputChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const addArrayField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeArrayField = (field, index) => {
    if (formData[field].length > 1) {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    // Prevent non-doctor users from submitting
    if (!hasRole('doctor')) {
      console.log('Frontend role check failed - User role:', currentUser?.role)
      setError('শুধুমাত্র ডাক্তাররা প্রোফাইল তৈরি বা আপডেট করতে পারবেন। আপনার রোল: ' + (currentUser?.role || 'অজানা'))
      setSubmitting(false)
      return
    }

    try {
      const token = getToken()
      console.log('Submitting with token:', token ? 'Present' : 'Missing')
      console.log('User role:', currentUser?.role)
      // Filter out empty strings from arrays
      const cleanedData = {
        ...formData,
        specialization: formData.specialization.filter(s => s.trim() !== ''),
        degree: formData.degree.filter(d => d.trim() !== ''),
        phoneNumber: formData.phoneNumber.filter(p => p.trim() !== '')
      }

      const isUpdate = doctorData !== null
      const url = `${API_BASE_URL}/doctor${isUpdate ? '' : '/add'}`
      const method = isUpdate ? 'PUT' : 'POST'
      
      console.log('Making request to:', url, 'Method:', method)

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      })

      console.log('Response status:', response.status)

      if (response.ok) {
        setSuccess(isUpdate ? 'প্রোফাইল সফলভাবে আপডেট হয়েছে! পরিবর্তনগুলি অ্যাডমিনের পর্যালোচনায় রয়েছে।' : 'প্রোফাইল সফলভাবে তৈরি হয়েছে! অ্যাডমিনের অনুমোদনের অপেক্ষায় রয়েছে।')
        // Refresh the data to get the updated status
        setTimeout(async () => {
          await fetchDoctorData()
        }, 1000)
      } else if (response.status === 403) {
        console.log('403 Forbidden - Token or role issue')
        setError('আপনার অনুমতি নেই। আপনি ডাক্তার হিসেবে নিবন্ধিত নন বা টোকেন সমস্যা আছে। দয়া করে আবার লগইন করুন।')
      } else {
        const errorText = await response.text()
        console.log('Error response:', errorText)
        setError(errorText || 'প্রোফাইল সেভ করতে ব্যর্থ')
      }
    } catch (error) {
      console.error('Error saving doctor profile:', error)
      setError('An error occurred while saving your profile')
  // ...existing code...
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <div className="badge badge-success">✅ Approved</div>
      case 'PENDING':
        return <div className="badge badge-warning">⏳ Pending Review</div>
      case 'DISABLED':
        return <div className="badge badge-error">❌ Disabled</div>
      default:
        return <div className="badge badge-neutral">❓ Unknown</div>
    }
  }

  if (!currentUser || !hasRole('doctor')) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-4">You need doctor privileges to access this page</p>
          <button onClick={() => router.push('/')} className="btn btn-primary">Go Home</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-100">
      <Navigation />
      
      <div className="container mx-auto p-4 max-w-4xl pt-20">
        {loading ? (
          <div className="text-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="mt-4">Loading your profile...</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Status Section */}
            {doctorData && (
              <div className="card bg-base-200 shadow-lg mb-6">
                <div className="card-body">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="card-title">Profile Status</h2>
                      <p className="text-base-content/70">Current approval status of your doctor profile</p>
                    </div>
                    {getStatusBadge(doctorData.status)}
                  </div>
                  
                  {doctorData.status === 'PENDING' && (
                    <div className="alert alert-warning mt-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.336 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                      <span>আপনার প্রোফাইল অ্যাডমিনের পর্যালোচনায় রয়েছে। অনুমোদনের পর রোগীরা আপনার প্রোফাইল দেখতে পাবেন।</span>
                    </div>
                  )}
                  
                  {doctorData.status === 'ACTIVE' && (
                    <div className="alert alert-success mt-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      <span>অভিনন্দন! আপনার প্রোফাইল অনুমোদিত এবং রোগীরা দেখতে পাচ্ছেন। কোনো পরিবর্তন করলে পুনরায় অ্যাডমিনের অনুমোদন প্রয়োজন।</span>
                    </div>
                  )}

                  {doctorData.status === 'DISABLED' && (
                    <div className="alert alert-error mt-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      <span>দুঃখিত! আপনার প্রোফাইল নিষ্ক্রিয় করা হয়েছে। আরো তথ্যের জন্য অ্যাডমিনের সাথে যোগাযোগ করুন।</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Profile Form */}
            <div className="card bg-gradient-to-br from-white to-blue-50 shadow-xl border border-blue-100">
              <div className="card-body">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-primary mb-2">
                    {doctorData ? '✏️ Edit Your Profile' : '📝 Complete Your Profile'}
                  </h2>
                  <p className="text-base-content/70">
                    Provide comprehensive information to help patients find and trust you
                  </p>
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

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Specializations */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold text-lg flex items-center gap-2">
                        🏥 <span>Specializations</span>
                      </span>
                      <span className="label-text-alt text-xs">e.g., Cardiology, Neurology</span>
                    </label>
                    <div className="space-y-3">
                      {formData.specialization.map((spec, index) => (
                        <div key={index} className="flex gap-3">
                          <input
                            type="text"
                            placeholder="Enter medical specialization"
                            className="input input-bordered flex-1 focus:input-primary"
                            value={spec}
                            onChange={(e) => handleArrayInputChange('specialization', index, e.target.value)}
                            required={index === 0}
                          />
                          <button
                            type="button"
                            className="btn btn-error btn-circle btn-sm"
                            onClick={() => removeArrayField('specialization', index)}
                            disabled={formData.specialization.length === 1}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn btn-outline btn-primary btn-sm"
                        onClick={() => addArrayField('specialization')}
                      >
                        ➕ Add Another Specialization
                      </button>
                    </div>
                  </div>

                  {/* Degrees */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold text-lg flex items-center gap-2">
                        🎓 <span>Medical Degrees</span>
                      </span>
                      <span className="label-text-alt text-xs">e.g., MBBS, MD, MS</span>
                    </label>
                    <div className="space-y-3">
                      {formData.degree.map((degree, index) => (
                        <div key={index} className="flex gap-3">
                          <input
                            type="text"
                            placeholder="Enter medical degree"
                            className="input input-bordered flex-1 focus:input-primary"
                            value={degree}
                            onChange={(e) => handleArrayInputChange('degree', index, e.target.value)}
                            required={index === 0}
                          />
                          <button
                            type="button"
                            className="btn btn-error btn-circle btn-sm"
                            onClick={() => removeArrayField('degree', index)}
                            disabled={formData.degree.length === 1}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn btn-outline btn-primary btn-sm"
                        onClick={() => addArrayField('degree')}
                      >
                        ➕ Add Another Degree
                      </button>
                    </div>
                  </div>

                  {/* Phone Numbers */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold text-lg flex items-center gap-2">
                        📞 <span>Phone Numbers</span>
                      </span>
                      <span className="label-text-alt text-xs">e.g., +880 1234567890</span>
                    </label>
                    <div className="space-y-3">
                      {formData.phoneNumber.map((phone, index) => (
                        <div key={index} className="flex gap-3">
                          <input
                            type="tel"
                            placeholder="Enter phone number with country code"
                            className="input input-bordered flex-1 focus:input-primary"
                            value={phone}
                            onChange={(e) => handleArrayInputChange('phoneNumber', index, e.target.value)}
                            required={index === 0}
                          />
                          <button
                            type="button"
                            className="btn btn-error btn-circle btn-sm"
                            onClick={() => removeArrayField('phoneNumber', index)}
                            disabled={formData.phoneNumber.length === 1}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn btn-outline btn-primary btn-sm"
                        onClick={() => addArrayField('phoneNumber')}
                      >
                        ➕ Add Another Phone Number
                      </button>
                    </div>
                  </div>

                  {/* Professional Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold text-lg flex items-center gap-2">
                          🏢 <span>Designation</span>
                        </span>
                        <span className="label-text-alt text-xs">e.g., Consultant, Assistant Professor</span>
                      </label>
                      <input
                        type="text"
                        name="designation"
                        placeholder="Enter your professional designation"
                        className="input input-bordered focus:input-primary"
                        value={formData.designation}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold text-lg flex items-center gap-2">
                          🏥 <span>Institute/Hospital</span>
                        </span>
                        <span className="label-text-alt text-xs">e.g., Dhaka Medical College</span>
                      </label>
                      <input
                        type="text"
                        name="institute"
                        placeholder="Enter your workplace"
                        className="input input-bordered focus:input-primary"
                        value={formData.institute}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold text-lg flex items-center gap-2">
                          📍 <span>Current City</span>
                        </span>
                        <span className="label-text-alt text-xs">e.g., Dhaka, Chittagong</span>
                      </label>
                      <input
                        type="text"
                        name="currentCity"
                        placeholder="Enter your city"
                        className="input input-bordered focus:input-primary"
                        value={formData.currentCity}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold text-lg flex items-center gap-2">
                          🕒 <span>Available Time</span>
                        </span>
                        <span className="label-text-alt text-xs">e.g., 9 AM - 5 PM, Sat-Thu</span>
                      </label>
                      <input
                        type="text"
                        name="availableTime"
                        placeholder="Enter your schedule"
                        className="input input-bordered focus:input-primary"
                        value={formData.availableTime}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold text-lg flex items-center gap-2">
                        🏥 <span>Chamber Address</span>
                      </span>
                      <span className="label-text-alt text-xs">Full chamber/clinic address with landmarks</span>
                    </label>
                    <textarea
                      name="chamberAddress"
                      placeholder="Enter complete address with landmarks for easy navigation"
                      className="textarea textarea-bordered focus:textarea-primary h-24"
                      value={formData.chamberAddress}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold text-lg flex items-center gap-2">
                        🌐 <span>Website URL (Optional)</span>
                      </span>
                      <span className="label-text-alt text-xs">Your professional website or clinic website</span>
                    </label>
                    <input
                      type="url"
                      name="websiteUrl"
                      placeholder="https://www.your-clinic-website.com"
                      className="input input-bordered focus:input-primary"
                      value={formData.websiteUrl}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="card-actions justify-center mt-12">
                    <button 
                      type="submit" 
                      className={`btn btn-primary btn-lg px-12 ${submitting ? 'loading' : ''}`}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="loading loading-spinner"></span>
                          Saving...
                        </>
                      ) : doctorData ? (
                        <>
                          💾 Update Profile
                        </>
                      ) : (
                        <>
                          🚀 Create Profile
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
