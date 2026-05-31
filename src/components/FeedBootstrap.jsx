import { useEffect, useRef } from 'react'
import { useFeedStore } from '../stores/feedStore'

export function FeedBootstrap() {
  const bootstrap = useFeedStore((s) => s.bootstrap)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    bootstrap()
  }, [bootstrap])

  return null
}
