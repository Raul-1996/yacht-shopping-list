import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '../../store/appStore'

export function OfflineBanner() {
  const { wsConnected } = useAppStore()
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [serverReachable, setServerReachable] = useState(true)

  useEffect(() => {
    const goOffline = () => setIsOffline(true)
    const goOnline = () => setIsOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  // Actively check server reachability every 5 seconds
  const checkServer = useCallback(async () => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)
      const res = await fetch('/api/categories', { signal: controller.signal })
      clearTimeout(timeout)
      setServerReachable(res.ok)
    } catch {
      setServerReachable(false)
    }
  }, [])

  useEffect(() => {
    checkServer()
    const interval = setInterval(checkServer, 5000)
    return () => clearInterval(interval)
  }, [checkServer])

  // Determine what to show
  const noConnection = isOffline || !serverReachable || !wsConnected

  if (!noConnection) return null

  if (isOffline) {
    return (
      <div className="text-center text-sm py-2 px-4 bg-sand-100 text-sand-500 dark:bg-sand-500/10 dark:text-sand-300">
        📡 Офлайн-режим — изменения сохранятся локально
      </div>
    )
  }

  return (
    <div className="text-center text-sm py-2 px-4 bg-coral-500/10 text-coral-500 dark:bg-coral-500/10 dark:text-coral-400">
      ⚠️ Нет связи с сервером — изменения не синхронизируются.{' '}
      <button
        onClick={() => window.location.reload()}
        className="underline font-medium"
      >
        Перезагрузить
      </button>
    </div>
  )
}
