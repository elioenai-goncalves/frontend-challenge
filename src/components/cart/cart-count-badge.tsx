interface CartCountBadgeProps {
  count: number
}

export function CartCountBadge({
  count,
}: CartCountBadgeProps) {
  if (count < 1) return null

  return (
    <span
      aria-hidden="true"
      className={[
        'pointer-events-none absolute -right-1 -top-1',
        'flex h-5 min-w-5 items-center justify-center',
        'rounded-full bg-primary px-1',
        'text-[10px] font-bold leading-none',
        'text-primary-foreground',
      ].join(' ')}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}