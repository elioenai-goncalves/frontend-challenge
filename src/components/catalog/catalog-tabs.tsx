import type { CatalogTab } from '@/contracts/api'

interface CatalogTabsProps {
  value: CatalogTab
  onChange: (value: CatalogTab) => void
}

const tabs: Array<{ value: CatalogTab; label: string }> = [
  { value: 'all', label: 'Todos os NFTs' },
  { value: 'new', label: 'Novos lançamentos' },
  { value: 'trending', label: 'Em alta' },
]

export function CatalogTabs({ value, onChange }: CatalogTabsProps) {
  return (
    <div aria-label="Visualização do catálogo" className="flex min-w-0 gap-4 overflow-x-auto whitespace-nowrap sm:gap-6">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          aria-pressed={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={[
            'shrink-0 border-b-2 py-2 text-[11px] font-semibold transition-colors sm:text-sm',
            'focus-visible:outline-2 focus-visible:outline-primary',
            value === tab.value
              ? 'border-primary text-primary'
              : 'border-transparent text-foreground hover:text-primary',
          ].join(' ')}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
