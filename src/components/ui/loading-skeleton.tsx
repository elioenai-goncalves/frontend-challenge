interface LoadingSkeletonProps {
  className?: string
}

export function LoadingSkeleton({
  className = '',
}: LoadingSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`loading-skeleton rounded-md ${className}`}
    />
  )
}