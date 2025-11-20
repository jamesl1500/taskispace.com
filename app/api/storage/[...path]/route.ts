import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{
    path: string[]
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params
    const path = resolvedParams.path.join('/')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (!supabaseUrl) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 500 })
    }

    // Forward the request to Supabase Storage
    const storageUrl = `${supabaseUrl}/storage/v1/object/public/${path}`
    const response = await fetch(storageUrl)

    if (!response.ok) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Get the content type from the original response
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const blob = await response.blob()

    // Return the file with proper headers
    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error proxying storage request:', error)
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 })
  }
}
