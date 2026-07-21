import type { ReactNode } from 'react'

interface EmptyStateProps {
  action?: ReactNode
  description: string
  title: string
}

/** @shadcn-replaceable empty */
export function EmptyState({ action, description, title }: EmptyStateProps) {
  return (
    <section className="ui-empty-state">
      <p className="eyebrow">Nothing here</p>
      <h1>{title}</h1>
      <p>{description}</p>
      {action}
    </section>
  )
}
