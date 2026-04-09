import { useMemo } from 'react'
import { useAppStore } from '../../store/appStore'
import { household } from '../../data/household'

export function PackingPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 space-y-6">
      <PackingChecklist />
      <div className="h-px bg-slate-200 dark:bg-slate-700" />
      <EsimInfo />
    </div>
  )
}

function PackingChecklist() {
  const { packingItems, togglePackingItem } = useAppStore()

  const categories = useMemo(() => {
    const map = new Map<string, typeof packingItems>()
    for (const item of packingItems) {
      if (!map.has(item.category)) map.set(item.category, [])
      map.get(item.category)!.push(item)
    }
    return Array.from(map.entries())
  }, [packingItems])

  const checkedCount = packingItems.filter((i) => i.checked).length

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-base">👤</span>
        <h2 className="font-semibold text-sm text-slate-700 dark:text-slate-200">Личные вещи</h2>
      </div>
      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Собрано: {checkedCount} из {packingItems.length}</span>
        <span>{packingItems.length > 0 ? Math.round((checkedCount / packingItems.length) * 100) : 0}%</span>
      </div>
      {categories.map(([category, items]) => (
        <div key={category} className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 overflow-hidden">
          <div className="px-4 py-2.5">
            <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{category}</span>
          </div>
          <div className="px-2 pb-2 space-y-0.5">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white dark:bg-slate-800/60"
              >
                <button
                  onClick={() => togglePackingItem(item.id)}
                  className={`w-11 h-11 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                    item.checked
                      ? 'bg-sea-green-500 border-sea-green-500 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {item.checked && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span className={`flex-1 text-sm ${item.checked ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                  {item.name}
                </span>
                {item.essential && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-coral-400/10 text-coral-500 dark:text-coral-400 font-medium">
                    важно
                  </span>
                )}
                {item.quantity > 1 && (
                  <span className="text-xs text-slate-400">x{item.quantity}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function EsimInfo() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-base">📱</span>
        <h2 className="font-semibold text-sm text-slate-700 dark:text-slate-200">eSIM</h2>
      </div>
      <div className="rounded-xl bg-ocean-50 dark:bg-ocean-900/20 p-3 text-xs text-ocean-700 dark:text-ocean-300">
        <strong>Рекомендация:</strong> Holafly (безлимит, $39.90/7 дней) или Maya Mobile (10 ГБ, $41.99/10 дней).
        Airalo, Nomad и aloSIM для Сейшел предлагают слишком маленькие планы.
      </div>
      {household.esim_recommendations.map((esim, i) => (
        <div key={i} className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100">{esim.provider}</h3>
            <span className="text-sm font-bold text-ocean-600 dark:text-ocean-400">${esim.price_usd}</span>
          </div>
          <div className="flex gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span>📶 {esim.data_amount}</span>
            <span>📅 {esim.validity_days} дней</span>
            <span>🌍 {esim.coverage}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-sea-green-500 font-medium">Плюсы:</span>
              <ul className="mt-1 space-y-0.5 text-slate-600 dark:text-slate-400">
                {esim.pros.map((p, j) => <li key={j}>+ {p}</li>)}
              </ul>
            </div>
            <div>
              <span className="text-coral-400 font-medium">Минусы:</span>
              <ul className="mt-1 space-y-0.5 text-slate-600 dark:text-slate-400">
                {esim.cons.map((c, j) => <li key={j}>− {c}</li>)}
              </ul>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            <span className="font-medium">Настройка:</span> {esim.setup_instructions}
          </p>
          <a
            href={esim.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1 px-3 py-1.5 rounded-lg bg-ocean-500 text-white text-xs font-medium hover:bg-ocean-600 transition-colors"
          >
            Перейти на сайт →
          </a>
        </div>
      ))}
    </div>
  )
}
