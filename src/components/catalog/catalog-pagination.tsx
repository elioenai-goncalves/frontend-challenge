import { ChevronRight } from 'lucide-react'

interface CatalogPaginationProps {
  page: number
  totalPages: number
  onPageChange: (next: number) => void
}

export function CatalogPagination({ page, totalPages, onPageChange }: CatalogPaginationProps) {
  if (totalPages <= 1) return null

  const visiblePages = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((current) => current === 1 || current === totalPages || Math.abs(current - page) <= 1)

  return (
    <nav aria-label="Paginação" className="mt-8 flex flex-wrap items-center justify-center gap-2 lg:justify-end">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
        className="min-h-9 rounded border border-primary/40 px-3 text-xs text-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        Anterior
      </button>
      {visiblePages.map((number, index) => (
        <span key={number} className="inline-flex items-center gap-2">
          {index > 0 && number - visiblePages[index - 1] > 1 && (
            <span className="text-text-secondary" aria-hidden="true">…</span>
          )}
          <button
            type="button"
            onClick={() => onPageChange(number)}
            aria-label={`Página ${number}`}
            aria-current={number === page ? 'page' : undefined}
            className={[
              'min-h-9 min-w-9 rounded border px-3 text-sm',
              number === page
                ? 'border-primary bg-primary font-bold text-primary-foreground'
                : 'border-primary/30 text-foreground hover:border-primary',
            ].join(' ')}
          >
            {number}
          </button>
        </span>
      ))}
      <button
        type="button"
        aria-label="Próxima página"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex min-h-9 min-w-9 items-center justify-center rounded border border-primary/40 text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  )
}
