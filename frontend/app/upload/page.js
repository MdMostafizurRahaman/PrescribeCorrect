'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import Tesseract from 'tesseract.js'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import MedicalReportDisplay from '@/components/MedicalReportDisplay'
import { Upload, File, Loader2, Eye, Trash2, Download, Share2, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react'
import pdfToText from 'react-pdftotext'

import { API_BASE_URL } from '@/lib/api'

export default function EnhancedUploadPage() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [ocrText, setOcrText] = useState('')
  const [medicalAnalysis, setMedicalAnalysis] = useState(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [currentResponse, setCurrentResponse] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [savedAnalysisId, setSavedAnalysisId] = useState(null)
  const fileInputRef = useRef(null)
  const { currentUser, getToken } = useAuth()
  const router = useRouter()

  // Check authentication on component mount
  useEffect(() => {
    if (!currentUser) {
      router.push('/auth/login')
    }
  }, [currentUser, router])

  // Auto-scroll to bottom when analysis updates
  const analysisEndRef = useRef(null)
  useEffect(() => {
    analysisEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentResponse, medicalAnalysis])

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      await processFile(file)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (file) {
      await processFile(file)
    }
  }

  const preprocessImage = async (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      img.onload = () => {
        // Scale image for better OCR (larger images work better)
        const maxDim = 3000
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 3)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        
        // Disable smoothing for sharper text
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        // Advanced image preprocessing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // Convert to high contrast black and white
        for (let i = 0; i < data.length; i += 4) {
          const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
          const threshold = 128
          const value = gray > threshold ? 255 : 0
          
          data[i] = value     // Red
          data[i + 1] = value // Green
          data[i + 2] = value // Blue
        }

        ctx.putImageData(imageData, 0, 0)
        canvas.toBlob(resolve, 'image/png', 1.0)
      }

      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  const performOcr = async (file) => {
    return new Promise(async (resolve, reject) => {
      try {
        setAnalysisStep('📷 ছবি প্রক্রিয়াকরণ করা হচ্ছে...')
        
        // Preprocess image for better OCR
        const processedFile = await preprocessImage(file)
        
        setAnalysisStep('🔍 টেক্সট শনাক্তকরণ শুরু...')
        
        const { data: { text } } = await Tesseract.recognize(
          processedFile || file,
          'eng+ben', // Support both English and Bengali
          { 
            logger: (m) => {
              if (m.status === 'recognizing text') {
                const progressPercent = Math.round(m.progress * 100)
                setProgress(progressPercent)
                setAnalysisStep(`🔍 টেক্সট শনাক্তকরণ: ${progressPercent}%`)
              }
            },
            tessedit_pageseg_mode: Tesseract.PSM.AUTO,
            tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY
          }
        )
        
        setProgress(100)
        setAnalysisStep('✅ টেক্সট প্রক্রিয়াকরণ সম্পূর্ণ!')
        
        // Apply basic corrections using training data
        const basicCorrections = {
          'rng': 'mg',
          'rnl': 'ml',
          'tahlet': 'tablet',
          'capsul': 'capsule',
          'syrap': 'syrup',
          'moming': 'morning',
          'evemng': 'evening',
          'nigth': 'night',
          'daly': 'daily'
        }
        
        let correctedText = text
        Object.entries(basicCorrections).forEach(([mistake, correction]) => {
          const regex = new RegExp(`\\b${mistake}\\b`, 'gi')
          correctedText = correctedText.replace(regex, correction)
        })
        
        resolve(correctedText)
        
      } catch (error) {
        reject(error)
      }
    })
  }

  const extractTextFromPDF = async (file) => {
    return new Promise((resolve, reject) => {
      pdfToText(file)
        .then((extractedText) => resolve(extractedText))
        .catch((err) => {
          console.error('PDF Text Extraction Error:', err)
          reject(err)
        })
    })
  }

  const processFile = async (file) => {
    setSelectedFile(file)
    setOcrText('')
    setMedicalAnalysis(null)
    setError(null)
    setProgress(0)

    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      setError('দয়া করে একটি বৈধ ইমেজ (JPG, PNG) বা PDF ফাইল আপলোড করুন')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('ফাইলের আকার 10MB এর কম হতে হবে')
      return
    }

    // Create preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setPreviewUrl(e.target.result)
      reader.readAsDataURL(file)
    }

    try {
      setIsProcessing(true)
      let extractedText = ''

      if (file.type === 'application/pdf') {
        setAnalysisStep('📄 PDF প্রক্রিয়াকরণ করা হচ্ছে...')
        extractedText = await extractTextFromPDF(file)
      } else if (file.type.startsWith('image/')) {
        extractedText = await performOcr(file)
      }

      setOcrText(extractedText)
      
      if (extractedText.trim()) {
        await analyzeWithAI(extractedText, file.name)
      } else {
        setError('কোন টেক্সট পাওয়া যায়নি। দয়া করে আরো স্পষ্ট ছবি আপলোড করুন।')
      }
    } catch (error) {
      console.error('File Processing Error:', error)
      setError('ফাইল প্রক্রিয়াকরণে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
    } finally {
      setIsProcessing(false)
    }
  }

  const saveAnalysisToBackend = async (analysis, fullText) => {
    try {
      setIsSaving(true)
      const token = getToken()
      
      // Extract key information from analysis
      const analysisData = {
        analysisSummary: analysis.summary || '',
        fullPrescriptionText: fullText || '',
        medicines: analysis.medicines || [],
        keyDiseases: analysis.conditions || analysis.diseases || [],
        dosageInstructions: analysis.dosages || analysis.instructions || [],
        doctorName: analysis.doctorName || '',
        patientName: analysis.patientName || ''
      }

      const response = await fetch(`${API_BASE_URL}/analysis/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData)
      })

      if (response.ok) {
        const savedAnalysis = await response.json()
        setSavedAnalysisId(savedAnalysis.id)
        console.log('Analysis saved successfully:', savedAnalysis.id)
      } else {
        console.error('Failed to save analysis')
      }
    } catch (error) {
      console.error('Error saving analysis:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  const analyzeWithAI = async (text, fileName) => {
    try {
      setIsAnalyzing(true)
      setAnalysisStep('🤖 AI দিয়ে বিশ্লেষণ শুরু...')
      setCurrentResponse('ডেটা বিশ্লেষণ করা হচ্ছে...')

      const response = await fetch('/api/medical-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          fileName: fileName
        })
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const result = await response.json()

      if (result.success && result.analysis) {
        // Simulate typing effect like niloy's system
        setCurrentResponse('')
        const fullResponse = 'বিশ্লেষণ সম্পূর্ণ হয়েছে! রিপোর্ট তৈরি করা হচ্ছে...'
        
        for (let i = 0; i <= fullResponse.length; i++) {
          setCurrentResponse(fullResponse.slice(0, i) + '▋')
          await sleep(50)
        }

        setCurrentResponse('')
        setMedicalAnalysis(result.analysis)
        setAnalysisStep('✅ বিশ্লেষণ সম্পূর্ণ!')
        
        // Auto-save analysis for registered users
        if (currentUser) {
          await saveAnalysisToBackend(result.analysis, text)
        }
      } else {
        throw new Error('Invalid analysis response')
      }
    } catch (error) {
      console.error('AI Analysis Error:', error)
      setError('AI বিশ্লেষণে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const clearAll = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setOcrText('')
    setMedicalAnalysis(null)
    setError(null)
    setProgress(0)
    setCurrentResponse('')
    setAnalysisStep('')
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">অনুগ্রহ করে লগইন করুন</h1>
          <button 
            onClick={() => router.push('/auth/login')}
            className="btn btn-primary"
          >
            Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()} 
                className="btn btn-ghost btn-circle"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">📋 প্রেসক্রিপশন বিশ্লেষণ</h1>
                <p className="text-gray-600">AI ভিত্তিক মেডিকেল ডকুমেন্ট বিশ্লেষণ</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*,application/pdf"
                className="hidden" 
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-primary"
                disabled={isProcessing || isAnalyzing}
              >
                <Upload className="h-4 w-4 mr-2" />
                ফাইল আপলোড
              </button>
              
              {selectedFile && (
                <button
                  onClick={clearAll}
                  className="btn btn-outline btn-error"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* File Upload Area */}
        {!selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="h-12 w-12 text-blue-500" />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  প্রেসক্রিপশন বা মেডিকেল ডকুমেন্ট আপলোড করুন
                </h3>
                <p className="text-gray-600 mb-4">
                  ছবি বা PDF ফাইল এখানে ড্র্যাগ করুন অথবা ক্লিক করে নির্বাচন করুন
                </p>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-primary btn-lg"
                >
                  <File className="h-5 w-5 mr-2" />
                  ফাইল নির্বাচন করুন
                </button>
              </div>
              
              <div className="text-xs text-gray-500">
                সাপোর্টেড ফরম্যাট: JPG, PNG, PDF | সর্বোচ্চ সাইজ: 10MB
              </div>
            </div>
          </motion.div>
        )}

        {/* File Preview & Processing */}
        {selectedFile && (
          <div className="space-y-6">
            {/* File Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {selectedFile.type.startsWith('image/') ? (
                    <ImageIcon className="h-8 w-8 text-blue-500" />
                  ) : (
                    <FileText className="h-8 w-8 text-red-500" />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-800">{selectedFile.name}</h3>
                    <p className="text-sm text-gray-600">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Image Preview */}
              {previewUrl && (
                <div className="mb-4">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-w-full h-64 object-contain mx-auto rounded-lg border"
                  />
                </div>
              )}

              {/* Processing Status */}
              {(isProcessing || isAnalyzing) && (
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    <span className="font-medium text-gray-700">{analysisStep}</span>
                  </div>
                  
                  {progress > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                        style={{width: `${progress}%`}}
                      ></div>
                    </div>
                  )}

                  {currentResponse && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-blue-800 text-sm">{currentResponse}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800">ত্রুটি!</h4>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* OCR Text Preview */}
              {ocrText && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">🔍 শনাক্তকৃত টেক্সট:</h4>
                  <div className="p-3 bg-gray-50 rounded-lg border max-h-32 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {ocrText}
                    </pre>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Medical Analysis Results */}
            {medicalAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-6"
              >
                <MedicalReportDisplay 
                  reportData={medicalAnalysis} 
                  fileName={selectedFile.name}
                />
                
                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-xl shadow-sm border p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    ⚡ পরবর্তী পদক্ষেপ
                  </h3>
                  
                  <div className="flex flex-wrap gap-4">
                    {savedAnalysisId ? (
                      <>
                        <button
                          onClick={() => router.push(`/analysis/${savedAnalysisId}`)}
                          className="btn btn-primary"
                        >
                          📊 বিস্তারিত দেখুন
                        </button>
                        
                        <button
                          onClick={async () => {
                            try {
                              const token = getToken()
                              const response = await fetch(`${API_BASE_URL}/analysis/${savedAnalysisId}/send-to-chat`, {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${token}`,
                                  'Content-Type': 'application/json',
                                },
                              })
                              
                              if (response.ok) {
                                router.push('/chat')
                              } else {
                                alert('চ্যাটে পাঠাতে সমস্যা হয়েছে')
                              }
                            } catch (error) {
                              console.error('Error sending to chat:', error)
                              alert('চ্যাটে পাঠাতে সমস্যা হয়েছে')
                            }
                          }}
                          className="btn btn-success"
                        >
                          💬 চ্যাটে পাঠান
                        </button>
                      </>
                    ) : (
                      isSaving && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <span className="loading loading-spinner loading-sm"></span>
                          <span>সেভ করা হচ্ছে...</span>
                        </div>
                      )
                    )}
                    
                    <button
                      onClick={() => router.push('/analysis-history')}
                      className="btn btn-outline"
                    >
                      📋 সকল বিশ্লেষণ দেখুন
                    </button>
                    
                    <button
                      onClick={clearAll}
                      className="btn btn-ghost"
                    >
                      🔄 নতুন বিশ্লেষণ
                    </button>
                  </div>
                  
                  {savedAnalysisId && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        ✅ আপনার বিশ্লেষণ সফলভাবে সেভ হয়েছে! আপনি এটি আপনার প্রোফাইলে দেখতে পাবেন।
                      </p>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}

            <div ref={analysisEndRef} />
          </div>
        )}
      </div>
    </div>
  )
}
