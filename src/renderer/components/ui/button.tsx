import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

/** @shadcn-replaceable button */
export function Button({ className = '', type = 'button', ...props }: ButtonProps) {
  return <button className={`ui-button ${className}`.trim()} type={type} {...props} />
}
