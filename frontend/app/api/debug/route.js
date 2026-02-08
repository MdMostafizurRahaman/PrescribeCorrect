import { NextResponse } from 'next/server'
import { API_BASE_URL } from '@/lib/api'

export async function GET() {
  return NextResponse.json({
    apiBaseUrl: API_BASE_URL,
    nodeEnv: process.env.NODE_ENV,
    nextPublicApiUrl: process.env.NEXT_PUBLIC_API_URL,
    nextPublicApiUrlLive: process.env.NEXT_PUBLIC_API_URL_LIVE,
    nextPublicFrontendUrlLive: process.env.NEXT_PUBLIC_FRONTEND_URL_LIVE
  })
}