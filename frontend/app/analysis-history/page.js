'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Navigation from '@/components/Navigation'
import AnalysisHistory from '@/components/AnalysisHistory'
import { AdvancedPagination } from '@/components/ProfessionalPagination'

import { API_BASE_URL } from '@/lib/api'

export default function AnalysisHistoryPage() {
  const { currentUser, getToken } = useAuth()
  const [analyses, setAnalyses] = useState([])
  const [localAnalyses, setLocalAnalyses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(4) // Changed from 10 to 4 for better window layout
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const router = useRouter()

  useEffect(() => {
    // Load local analyses first (for non-logged users)
    loadLocalAnalyses()
    
    // If user is logged in, also fetch from server
    if (currentUser) {
      fetchAnalyses()
    } else {
      setLoading(false)
    }
  }, [currentUser])

  const loadLocalAnalyses = () => {
    try {
      const stored = localStorage.getItem('PrescribeCorrect_analyses')
      if (stored) {
        const parsedAnalyses = JSON.parse(stored)
        setLocalAnalyses(parsedAnalyses)
      }
    } catch (error) {
      console.error('Error loading local analyses:', error)
    }
  }

  const fetchAnalyses = async () => {
    try {
      setLoading(true)
      const token = getToken()
      const response = await fetch(`${API_BASE_URL}/analysis/my-analyses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setAnalyses(data)
      } else {
        setError('Failed to load analysis history from server')
      }
    } catch (error) {
      console.error('Error fetching analyses:', error)
      setError('Failed to load analysis history from server')
    } finally {
      setLoading(false)
    }
  }

  // Filter and search logic
  const getAllAnalyses = () => {
    return [...analyses, ...localAnalyses]
  }

  const filteredAnalyses = getAllAnalyses().filter(analysis => {
    const matchesSearch = analysis.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         analysis.title?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'prescription' && analysis.type === 'prescription') ||
                         (filterType === 'medical' && analysis.type === 'medical')
    
    return matchesSearch && matchesFilter
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredAnalyses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedAnalyses = filteredAnalyses.slice(startIndex, startIndex + itemsPerPage)

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page
  }

  const sendToChat = async (analysisId) => {
    try {
      const token = getToken()
      const response = await fetch(`${API_BASE_URL}/analysis/${analysisId}/send-to-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        // Refresh the analyses list
        fetchAnalyses()
        alert('✅ বিশ্লেষণ চ্যাটে পাঠানো হয়েছে!')
      } else {
        alert('❌ চ্যাটে পাঠাতে সমস্যা হয়েছে')
      }
    } catch (error) {
      console.error('Error sending to chat:', error)
      alert('❌ চ্যাটে পাঠাতে সমস্যা হয়েছে')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-primary-200/20 to-secondary-200/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-48 h-48 bg-gradient-to-tr from-accent-200/20 to-success-200/20 rounded-full blur-2xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <Navigation />
      
      <div className="pt-24 pb-12 relative z-10">
        <div className="container-professional">
          {/* Enhanced Header */}
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gradient-primary mb-4">
              📊 Analysis History
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              View and manage all your prescription analyses in one place
            </p>
            <motion.div
              className="h-1 w-32 bg-gradient-to-r from-primary-500 to-secondary-500 mx-auto rounded-full mt-6"
              initial={{ width: 0 }}
              animate={{ width: 128 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            />
          </motion.div>

          {/* Search and Filter Section */}
          <motion.div 
            className="card-professional p-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="grid md:grid-cols-3 gap-4">
              <div className="search-professional">
                <input
                  type="text"
                  placeholder="Search analyses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input-professional"
                />
                <div className="search-icon-professional">🔍</div>
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="form-input-professional"
              >
                <option value="all">All Types</option>
                <option value="prescription">Prescription Analysis</option>
                <option value="medical">Medical Analysis</option>
              </select>
              
              <motion.button
                onClick={() => {
                  setSearchTerm('')
                  setFilterType('all')
                  setCurrentPage(1)
                }}
                className="btn-professional-accent"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                🔄 Reset Filters
              </motion.button>
            </div>
          </motion.div>

          {/* Results Summary */}
          {filteredAnalyses.length > 0 && (
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-gray-600 text-center">
                Showing {filteredAnalyses.length} analysis{filteredAnalyses.length !== 1 ? 'es' : ''} 
                {searchTerm && ` matching "${searchTerm}"`}
              </p>
            </motion.div>
          )}

          {/* Show localStorage analyses for all users */}
          {localAnalyses.length > 0 && (
            <motion.div 
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gradient-secondary mb-4">
                  💾 Local Saved Analyses
                </h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  Prescription analyses saved on your device
                </p>
              </div>
              <AnalysisHistory />
            </motion.div>
          )}

          {/* Show server analyses only for logged users */}
          {currentUser && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gradient-accent mb-4">
                  ☁️ Server Saved Analyses
                </h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  Prescription analyses saved in your account
                </p>
              </div>

              {/* Loading State */}
              {loading && (
                <motion.div 
                  className="text-center py-16"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="loading-professional mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your analyses...</p>
                </motion.div>
              )}

              {/* Error State */}
              {error && (
                <motion.div 
                  className="toast-error text-center p-6 rounded-xl mb-8"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <p className="font-medium">{error}</p>
                </motion.div>
              )}

              {/* Empty State for Server Analyses */}
              {!loading && paginatedAnalyses.length === 0 && (
                <motion.div 
                  className="text-center py-16"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-8xl mb-6">📝</div>
                  <h3 className="text-3xl font-bold mb-4 text-gray-700">
                    No server analyses found
                  </h3>
                  <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
                    You haven't analyzed any prescriptions yet that are saved on the server.
                  </p>
                  <motion.a 
                    href="/google-lens-test" 
                    className="btn-professional-accent inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    📸 Analyze First Prescription
                  </motion.a>
                </motion.div>
              )}

              {/* Server Analyses Grid - Better organized with card windows */}
              {!loading && paginatedAnalyses.length > 0 && (
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8 mb-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  {paginatedAnalyses.map((analysis, index) => (
                    <motion.div
                      key={analysis.id}
                      className="card-professional p-8 relative overflow-hidden group hover:shadow-2xl transition-all duration-300 border-2 border-primary-100 bg-gradient-to-br from-white to-primary-25"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -8 }}
                      style={{ minHeight: '320px' }}
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary-100/50 to-transparent rounded-bl-full"></div>
                      
                      {/* Window-style header */}
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-primary-200">
                        <h3 className="text-xl font-bold text-primary-700 flex items-center gap-2">
                          📊 Analysis #{analysis.id}
                        </h3>
                        <div className="flex gap-2">
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        </div>
                      </div>
                      
                        <div className="space-y-4 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="badge-primary">📅</span>
                            <span className="text-sm text-gray-600 font-medium">
                              {new Date(analysis.analysisDate).toLocaleDateString('en-US')}
                            </span>
                          </div>
                          
                          {analysis.doctorName && (
                            <div className="flex items-center gap-2">
                              <span className="badge-secondary">👨‍⚕️</span>
                              <span className="text-sm text-gray-600 font-medium">{analysis.doctorName}</span>
                            </div>
                          )}
                          
                          {analysis.keyDiseases && analysis.keyDiseases.length > 0 && (
                            <div>
                              <span className="badge-accent mb-2 inline-block">🔍 Key Conditions</span>
                              <div className="flex flex-wrap gap-1">
                                {analysis.keyDiseases.slice(0, 2).map((disease, idx) => (
                                  <span key={idx} className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium">
                                    {disease}
                                  </span>
                                ))}
                                {analysis.keyDiseases.length > 2 && (
                                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                    +{analysis.keyDiseases.length - 2} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {analysis.medicines && analysis.medicines.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="badge-success">💊</span>
                              <span className="text-sm text-gray-600 font-medium">
                                {analysis.medicines.length} medicines found
                              </span>
                            </div>
                          )}

                          {analysis.bengaliSummary && (
                            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-4 rounded-xl border border-primary-200 shadow-sm">
                              <span className="text-sm font-semibold text-primary-800 block mb-2">📋 Summary:</span>
                              <p className="text-sm text-primary-700 line-clamp-3 leading-relaxed">{analysis.bengaliSummary}</p>
                            </div>
                          )}
                        </div>

                      <div className="mt-auto flex gap-3">
                        <motion.button
                          onClick={() => router.push(`/analysis/${analysis.id}`)}
                          className="btn btn-primary btn-sm flex-1 text-white font-semibold"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          👁️ View Details
                        </motion.button>
                        
                        {!analysis.sentToChat ? (
                          <motion.button
                            onClick={() => sendToChat(analysis.id)}
                            className="btn btn-success btn-sm font-semibold"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            💬 Send to Chat
                          </motion.button>
                        ) : (
                          <span className="btn btn-outline btn-success btn-sm pointer-events-none font-semibold">
                            ✅ Sent to Chat
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Pagination for Server Analyses */}
              {!loading && filteredAnalyses.length > 0 && totalPages > 1 && (
                <AdvancedPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredAnalyses.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  className="mt-12"
                />
              )}
            </motion.div>
          )}

          {/* Login prompt for non-logged users */}
          {!currentUser && localAnalyses.length === 0 && (
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="card-professional p-12 max-w-2xl mx-auto">
                <div className="text-8xl mb-6">🔐</div>
                <h2 className="text-4xl font-bold text-gradient-primary mb-6">
                  Analysis History
                </h2>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Login to view and save your prescription analysis history with secure cloud storage.
                </p>
                <div className="space-y-4">
                  <motion.a 
                    href="/auth/login" 
                    className="btn-professional-primary inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    🔐 Login Now
                  </motion.a>
                  <p className="text-gray-500">
                    Or <a href="/google-lens-test" className="text-primary-600 hover:text-primary-700 font-medium underline-professional">
                      analyze your first prescription
                    </a> to get started
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
