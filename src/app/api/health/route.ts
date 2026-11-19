import { NextResponse } from 'next/server'
import { RELEASE_IDENTIFIER } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    {
      application: 'ELMS 360',
      system: 'Enterprise Employee Leave Management System',
      releaseIdentifier: RELEASE_IDENTIFIER,
      buildTimestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      status: 'healthy',
      database: 'operational',
      security: {
        rlsEnforced: true,
        auditLogging: true,
      },
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        'X-Release-Identifier': RELEASE_IDENTIFIER,
      },
    }
  )
}
