import { BoxIcon, CopyIcon, MinusIcon, SquareIcon, XIcon } from 'lucide-react'
import { TitleBarButton } from '../../components/ui/title-bar-button'
import { AppearanceMenu } from '../appearance/appearance-menu'
import { useApplicationWindowQuery } from './application-window-query'

export function ApplicationTitleBar() {
  const applicationWindowQuery = useApplicationWindowQuery()
  const state = applicationWindowQuery.data
  const appName = state?.appName ?? ''

  return (
    <header
      aria-label={appName ? `${appName} window` : 'Application window'}
      className={`application-title-bar${state?.usesNativeControls ? ' application-title-bar--native-controls' : ''}`}
      data-window-focused={state?.isFocused}
    >
      <div className="application-title-bar__identity">
        <span className="application-title-bar__mark" aria-hidden="true">
          <BoxIcon />
        </span>
        <span className="application-title-bar__name">{appName}</span>
      </div>

      <div className="application-title-bar__status" aria-hidden="true">
        <span />
        Ready
      </div>

      <div className="application-title-bar__actions">
        <AppearanceMenu />
        {state && !state.usesNativeControls && (
          <div className="application-title-bar__window-actions" aria-label="Window controls">
            <TitleBarButton
              aria-label="Minimize"
              onClick={() => void window.app.applicationWindow.minimize()}
            >
              <MinusIcon aria-hidden="true" />
            </TitleBarButton>
            <TitleBarButton
              aria-label={state.isMaximized ? 'Restore' : 'Maximize'}
              onClick={() => void window.app.applicationWindow.toggleMaximize()}
            >
              {state.isMaximized ? (
                <CopyIcon aria-hidden="true" />
              ) : (
                <SquareIcon aria-hidden="true" />
              )}
            </TitleBarButton>
            <TitleBarButton
              aria-label="Close"
              onClick={() => void window.app.applicationWindow.close()}
              tone="close"
            >
              <XIcon aria-hidden="true" />
            </TitleBarButton>
          </div>
        )}
      </div>
    </header>
  )
}
