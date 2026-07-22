import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { TitleBarButton } from '../../components/ui/title-bar-button'
import { useAppearanceQuery, useSetAppearanceSource } from './appearance-query'

const appearanceLabels = {
  dark: 'Dark',
  light: 'Light',
  system: 'System',
}

export function AppearanceMenu() {
  const appearanceQuery = useAppearanceQuery()
  const setAppearanceSource = useSetAppearanceSource()
  const state = appearanceQuery.data
  const source = state?.source ?? 'system'
  const label = appearanceLabels[source]
  const ThemeIcon = source === 'dark' ? MoonIcon : source === 'light' ? SunIcon : MonitorIcon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <TitleBarButton
            aria-label={`Appearance: ${label}`}
            className="application-title-bar__appearance-control"
          />
        }
      >
        <ThemeIcon aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" aria-label="Appearance" sideOffset={6}>
        <DropdownMenuRadioGroup value={source}>
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
          <DropdownMenuRadioItem
            disabled={setAppearanceSource.isPending}
            onClick={() => setAppearanceSource.mutate('system')}
            value="system"
          >
            <MonitorIcon aria-hidden="true" />
            System
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            disabled={setAppearanceSource.isPending}
            onClick={() => setAppearanceSource.mutate('light')}
            value="light"
          >
            <SunIcon aria-hidden="true" />
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            disabled={setAppearanceSource.isPending}
            onClick={() => setAppearanceSource.mutate('dark')}
            value="dark"
          >
            <MoonIcon aria-hidden="true" />
            Dark
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
