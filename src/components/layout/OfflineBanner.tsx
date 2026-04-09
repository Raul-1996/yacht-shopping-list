import { useState, useEffect } from 'react'
import { useAppStore } from '../../store/appStore'

export function OfflineBanner() {
  const { wsConnected } = useAppStore()
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

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

  // Show red banner: WS disconnected (server unreachable) while browser is "online"
  const serverDown = !wsConnected && !isOffline

  // Show yellow banner: fully offline
  if (isOffline) {
    return (
      <div className="text-center text-sm py-2 px-4 bg-sand-100 text-sand-500 dark:bg-sand-500/10 dark:text-sand-300">
        📡 Офлайн-режим — изменения сохранятся локально
      </div>
    )
  }

  if (serverDown) {
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

  return null
}
