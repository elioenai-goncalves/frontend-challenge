import { LoadingSkeleton } from '@/components/ui/loading-skeleton'

export function NftCardSkeleton() {
  return (
    <li className="rounded-lg bg-card p-2">
      <LoadingSkeleton className="aspect-square w-full" />
      <LoadingSkeleton className="mt-3 h-5 w-3/4" />
      <LoadingSkeleton className="mt-1 h-5 w-1/3" />
    </li>
  )
}