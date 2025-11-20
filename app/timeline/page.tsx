'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TimelinePage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/timeline/feed')
  }, [router])

  return null
}
