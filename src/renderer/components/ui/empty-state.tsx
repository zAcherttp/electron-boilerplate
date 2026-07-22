import type { ReactNode } from 'react'
import { FileQuestionMarkIcon } from 'lucide-react'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './empty'

interface EmptyStateProps {
  action?: ReactNode
  description: string
  title: string
}

export function EmptyState({ action, description, title }: EmptyStateProps) {
  return (
    <Empty className="max-w-xl border bg-card/60">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileQuestionMarkIcon aria-hidden="true" />
        </EmptyMedia>
        <p className="eyebrow">Nothing here</p>
        <EmptyTitle>
          <h1 className="empty-page-title">{title}</h1>
        </EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  )
}
