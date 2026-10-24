interface EmptyStateProps {
  title: string
  description?: string
}

export function EmptyState({
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 text-center text-card-foreground">
      <h2 className="text-lg font-bold">{title}</h2>

      {description && (
        <p className="mt-3 text-sm text-text-secondary">
          {description}
        </p>
      )}
    </div>
  )
}