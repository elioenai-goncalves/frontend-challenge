import { useRef, type ReactNode } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'

export function MobileFilters({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex min-h-11 items-center gap-2 rounded-button border border-border px-4 text-sm font-bold focus-visible:outline-2 focus-visible:outline-primary"
      >
        <SlidersHorizontal aria-hidden="true" size={18} strokeWidth={1.5} />
        Filtros
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Filtros"
        className="fixed inset-0 m-auto h-dvh max-h-none w-screen max-w-none overflow-y-auto bg-background p-6 text-foreground backdrop:bg-black/70"
      >
        <div className="mx-auto flex max-w-md flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Filtros</h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Fechar filtros"
              className="inline-flex size-11 items-center justify-center focus-visible:outline-2 focus-visible:outline-primary"
            >
              <X aria-hidden="true" size={24} strokeWidth={1.5} />
            </button>
          </div>

          {children}

          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="h-11 rounded-button bg-primary font-bold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Ver resultados
          </button>
        </div>
      </dialog>
    </div>
  )
}