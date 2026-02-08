import { NextResponse } from 'next/server'
import { generateMedicalAnalysis, correctOCRText } from '@/lib/local-medical-analysis'
import fs from 'fs'
import path from 'path'

let cachedTrainingData = null

function loadTrainingData() {
  if (cachedTrainingData) return cachedTrainingData
  
  try {
    const trainingDataPath = path.join(process.cwd(), 'public', 'training_data.json')
    const trainingDataRaw = fs.readFileSync(trainingDataPath, 'utf8')
    cachedTrainingData = JSON.parse(trainingDataRaw)
    console.log('Training data loaded successfully')
    return cachedTrainingData
  } catch (error) {
    console.error('Error loading training data:', error)
    throw error
  }
}

export async function POST(request) {
  try {
    const { text, fileName } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    console.log('Analyzing prescription using local training data...')
    console.log('Original OCR text:', text.substring(0, 200) + '...')

    // Load training data (cached)
    const trainingData = loadTrainingData()

    // Use local training data analysis - NO API calls
    const analysis = generateMedicalAnalysis(text, trainingData)
    const correctedText = correctOCRText(text, trainingData)
    
    console.log('Corrected text:', correctedText.substring(0, 200) + '...')
    console.log('Analysis generated successfully using training data')

    return NextResponse.json({
      success: true,
      analysis: analysis,
      correctedText: correctedText,
      method: 'local_training_data',
      fileName: fileName
    })

  } catch (error) {
    console.error('Local medical analysis error:', error)
    return NextResponse.json({
      error: 'Analysis failed',
      details: error.message
    }, { status: 500 })
  }
}

// Helper functions using medical training data
function extractPatientName(text) {
  const namePatterns = [
    /Name\s*:\s*([A-Za-z\s]+)/i,
    /নাম\s*:\s*([^\n]+)/,
    /patient\s*:\s*([A-Za-z\s]+)/i
  ]
  
  for (let pattern of namePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  return null
}

function extractAge(text) {
  const agePatterns = [
    /Age\s*:\s*(\d+)/i,
    /বয়স\s*:\s*(\d+)/,
    /(\d+)\s*years?/i,
    /(\d+)\s*Y/i
  ]
  
  for (let pattern of agePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1] + (text.match(/years?|Y/i) ? ' বছর' : '')
    }
  }
  return null
}

function extractDate(text) {
  const datePatterns = [
    /Date\s*:\s*([0-9\/\-\.]+)/i,
    /তারিখ\s*:\s*([0-9\/\-\.]+)/,
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/
  ]
  
  for (let pattern of datePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  return null
}

function extractHospital(text) {
  const hospitalPatterns = [
    /(মেডিকেল কলেজ হাসপাতাল)/,
    /(হাসপাতাল)/,
    /(Medical College)/i,
    /(Hospital)/i,
    /(Clinic)/i
  ]
  
  for (let pattern of hospitalPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  return null
}

function extractMedications(text, medicalData) {
  const medications = []
  const lines = text.split('\n')
  
  lines.forEach(line => {
    // Look for medication patterns
    if (line.match(/Tab|Cap|Syrup|mg|ml/i)) {
      const medication = {
        "ওষুধের_নাম": "তথ্য পাওয়া যায়নি",
        "জেনেরিক_নাম": "তথ্য পাওয়া যায়নি",
        "শক্তি": extractDosage(line) || "তথ্য পাওয়া যায়নি",
        "সেবনবিধি": extractFrequency(line) || "তথ্য পাওয়া যায়নি",
        "সময়": "তথ্য পাওয়া যায়নি",
        "কতদিন": extractDuration(line) || "তথ্য পাওয়া যায়নি",
        "কাজ": "তথ্য পাওয়া যায়নি। চিকিৎসকের সাথে যোগাযোগ করুন।",
        "পার্শ্বপ্রতিক্রিয়া": "তথ্য পাওয়া যায়নি। চিকিৎসকের সাথে যোগাযোগ করুন।",
        "সতর্কতা": "তথ্য পাওয়া যায়নি। চিকিৎসকের পরামর্শ ছাড়া ওষুধ সেবন করা উচিত নয়।"
      }
      medications.push(medication)
    }
  })
  
  return medications.length > 0 ? medications : [{
    "ওষুধের_নাম": "তথ্য পাওয়া যায়নি",
    "জেনেরিক_নাম": "তথ্য পাওয়া যায়নি",
    "শক্তি": "তথ্য পাওয়া যায়নি",
    "কাজ": "তথ্য পাওয়া যায়নি। চিকিৎসকের সাথে যোগাযোগ করুন।",
    "সেবনবিধি": "তথ্য পাওয়া যায়নি",
    "সময়": "তথ্য পাওয়া যায়নি",
    "কতদিন": "তথ্য পাওয়া যায়নি",
    "পার্শ্বপ্রতিক্রিয়া": "তথ্য পাওয়া যায়নি। চিকিৎসকের সাথে যোগাযোগ করুন।",
    "সতর্কতা": "তথ্য পাওয়া যায়নি। চিকিৎসকের পরামর্শ ছাড়া ওষুধ সেবন করা উচিত নয়।"
  }]
}

function extractDosage(text) {
  const dosageMatch = text.match(/(\d+)\s*(mg|ml|g)/i)
  return dosageMatch ? `${dosageMatch[1]} ${dosageMatch[2].toLowerCase()}` : null
}

function extractFrequency(text) {
  const freqMatch = text.match(/(1\+1\+1|BD|TDS|OD|QID|প্রতি)/i)
  return freqMatch ? freqMatch[1] : null
}

function extractDuration(text) {
  const durationMatch = text.match(/(\d+)\s*(দিন|days?|weeks?)/i)
  return durationMatch ? `${durationMatch[1]} ${durationMatch[2]}` : null
}

function extractTests(text) {
  const tests = []
  const testPatterns = [
    /CXR/i,
    /X-ray/i,
    /Blood test/i,
    /ECG/i,
    /USG/i
  ]
  
  testPatterns.forEach(pattern => {
    if (text.match(pattern)) {
      const testName = text.match(pattern)[0]
      tests.push({
        "পরীক্ষার_নাম": testName,
        "বাংলা_নাম": testName === 'CXR' ? 'ছাতি এক্স-রে (পি.এ)' : testName,
        "কেন_করতে_হবে": "তথ্য পাওয়া যায়নি। চিকিৎসকের সাথে যোগাযোগ করুন।",
        "প্রস্তুতি": "তথ্য পাওয়া যায়নি। চিকিৎসকের সাথে যোগাযোগ করুন।",
        "খরচ": "তথ্য পাওয়া যায়নি"
      })
    }
  })
  
  return tests
}

function extractMedicalTerms(text) {
  const terms = []
  
  if (text.match(/CXR/i)) {
    terms.push({
      "ইংরেজি_শব্দ": "CXR PA",
      "বাংলা_অর্থ": "ছাতি এক্স-রে (পোস্টেরোঅ্যান্টেরিয়র)",
      "ব্যাখ্যা": "একটি ধরণের এক্স-রে যা ছাতির পিছন থেকে সামনের দিকে তোলা হয়।"
    })
  }
  
  return terms
}
