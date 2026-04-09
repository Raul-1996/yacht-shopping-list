import { useState, useEffect } from 'react'

function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent
  const isIOS = /iPhone|iPad/.test(ua)
  const isStandalone =
    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone) ||
    window.matchMedia('(display-mode: standalone)').matches
  return isIOS && !isStandalone
}

export function InstallPrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isIOSSafari() && !localStorage.getItem('pwa-install-dismissed')) {
      setShow(true)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem('pwa-install-dismissed', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2 animate-[slideUp_0.3s_ease-out]">
      <div className="max-w-2xl mx-auto bg-ocean-50 dark:bg-ocean-950 border border-ocean-200 dark:border-ocean-800 rounded-2xl shadow-lg p-4 flex items-start gap-3">
        <div className="flex-1 text-sm text-ocean-800 dark:text-ocean-200">
          Для работы без интернета: нажмите <strong>«Поделиться»</strong> ⎋ → <strong>«На экран Домой»</strong>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-ocean-500 text-white hover:bg-ocean-600 dark:bg-ocean-600 dark:hover:bg-ocean-500 transition-colors"
        >
          Понятно
        </button>
      </div>
    </div>
  )
}
