import type { ReactNode } from 'react'

interface AlertProps {
  children: ReactNode
  title: string
}

/** @shadcn-replaceable alert */
export function Alert({ children, title }: AlertProps) {
  return (
    <section className="ui-alert" role="alert">
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  )
}
