const APP_VERSION = '1.32'

export function VersionFooter() {
  const clearCache = async () => {
    try {
      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        for (const reg of registrations) {
          await reg.unregister()
        }
      }
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        for (const name of cacheNames) {
          await caches.delete(name)
        }
      }
      // Clear localStorage except offline data cache and settings
      const darkMode = localStorage.getItem('yacht-dark-mode')
      const cacheKeys = ['yacht-cache-shopping', 'yacht-cache-household', 'yacht-cache-packing', 'yacht-cache-mealplan']
      const savedCache: Record<string, string> = {}
      cacheKeys.forEach(k => { const v = localStorage.getItem(k); if (v) savedCache[k] = v })
      localStorage.clear()
      if (darkMode) localStorage.setItem('yacht-dark-mode', darkMode)
      Object.entries(savedCache).forEach(([k, v]) => localStorage.setItem(k, v))

      alert('Кеш очищен! Страница перезагрузится.')
      window.location.reload()
    } catch (e) {
      console.error('Cache clear error:', e)
      alert('Ошибка очистки кеша. Попробуйте очистить вручную через настройки браузера.')
    }
  }

  return (
    <div className="flex items-center justify-center gap-3 py-4 text-[10px] text-slate-300 dark:text-slate-700">
      <span>v{APP_VERSION}</span>
      <span>·</span>
      <button
        onClick={clearCache}
        className="underline active:text-slate-500"
      >
        Сбросить кеш
      </button>
    </div>
  )
}
