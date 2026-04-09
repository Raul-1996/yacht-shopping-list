import { useState, useEffect } from 'react'

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [visible, setVisible] = useState(!navigator.onLine)

  useEffect(() => {
    const goOffline = () => {
      setIsOffline(true)
      setVisible(true)
    }
    const goOnline = () => {
      setIsOffline(false)
      // Delay hiding to allow fade-out animation
      setTimeout(() => setVisible(false), 300)
    }

    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className={`text-center text-sm py-1.5 px-4 bg-sand-100 text-sand-500 dark:bg-sand-500/10 dark:text-sand-300 transition-opacity duration-300 ${
        isOffline ? 'opacity-100' : 'opacity-0'
      }`}
    >
      📡 Офлайн-режим — изменения сохранятся локально
    </div>
  )
}
