import { Button as ButtonPrimitive } from '@base-ui/react/button'

import { cn } from '@/lib/utils'

type TitleBarButtonTone = 'default' | 'close'

interface TitleBarButtonProps extends ButtonPrimitive.Props {
  tone?: TitleBarButtonTone
}

function TitleBarButton({
  className,
  tone = 'default',
  type = 'button',
  ...props
}: TitleBarButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="title-bar-button"
      data-tone={tone}
      className={cn(
        'application-title-bar__control',
        tone === 'close' && 'application-title-bar__control--close',
        className,
      )}
      type={type}
      {...props}
    />
  )
}

export { TitleBarButton }
export type { TitleBarButtonProps }
