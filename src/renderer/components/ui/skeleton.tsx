interface SkeletonProps {
  label?: string
}

/** @shadcn-replaceable skeleton */
export function Skeleton({ label = 'Loading content' }: SkeletonProps) {
  return <output aria-label={label} className="ui-skeleton" />
}
