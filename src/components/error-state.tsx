import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  title?: string
  description: string
  onRetry: () => void
  isRetrying?: boolean
}

export function ErrorState({
  title = 'Não foi possível carregar',
  description,
  onRetry,
  isRetrying = false,
}: ErrorStateProps) {
  return (
    <div
      aria-busy={isRetrying}
      className="rounded-lg border border-border bg-card p-6 text-center text-card-foreground"
    >
      <div role="alert">
        <h2 className="text-lg font-bold">{title}</h2>

        <p className="mt-3 text-sm text-text-secondary">
          {description}
        </p>
      </div>

      <Button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="mt-5"
      >
        {isRetrying ? 'Tentando novamente…' : 'Tentar novamente'}
      </Button>
    </div>
  )
}