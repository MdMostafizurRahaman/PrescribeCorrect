// API configuration utility
export const getApiBaseUrl = () => {
  const isProduction = process.env.NODE_ENV === 'production'
  return isProduction
    ? (process.env.NEXT_PUBLIC_API_URL_LIVE || 'https://medilens-backend.onrender.com/api')
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api')
}

export const API_BASE_URL = getApiBaseUrl()