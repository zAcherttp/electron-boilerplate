// @vitest-environment jsdom

import type { AppearanceState, ThemeSource } from '../../../contracts/appearance'
import type { AppApi } from '../../../contracts/app-api'
import type { ApplicationWindowState } from '../../../contracts/application-window'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { ApplicationTitleBar } from './application-title-bar'

type WindowStateListener = Parameters<AppApi['applicationWindow']['onStateChanged']>[0]

interface TitleBarCalls {
  appearanceSources: ThemeSource[]
  close: number
  minimize: number
  toggleMaximize: number
}

const defaultState: ApplicationWindowState = {
  appName: 'Electron Boilerplate',
  isFocused: true,
  isMaximized: false,
  usesNativeControls: false,
}

afterEach(cleanup)

function renderTitleBar(initialState: ApplicationWindowState) {
  let appearanceListener: Parameters<AppApi['appearance']['onStateChanged']>[0] | null = null
  let stateListener: WindowStateListener | null = null
  const calls: TitleBarCalls = {
    appearanceSources: [],
    close: 0,
    minimize: 0,
    toggleMaximize: 0,
  }

  window.app = {
    appearance: {
      getState: async () => ({ resolved: 'light', source: 'system' }),
      onStateChanged: (listener) => {
        appearanceListener = listener
        return () => {
          appearanceListener = null
        }
      },
      setSource: async (source) => {
        calls.appearanceSources.push(source)
        const state: AppearanceState = {
          resolved: source === 'dark' ? 'dark' : 'light',
          source,
        }
        appearanceListener?.(state)
        return state
      },
    },
    applicationWindow: {
      close: async () => {
        calls.close += 1
      },
      getState: async () => initialState,
      minimize: async () => {
        calls.minimize += 1
      },
      onStateChanged: (listener) => {
        stateListener = listener
        return () => {
          stateListener = null
        }
      },
      toggleMaximize: async () => {
        calls.toggleMaximize += 1
        if (stateListener === null) throw new Error('Window state listener is not registered')
        stateListener({ ...initialState, isMaximized: true })
      },
    },
    system: {
      getInfo: async () => {
        throw new Error('System information is not used by the title bar')
      },
    },
  }

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <ApplicationTitleBar />
    </QueryClientProvider>,
  )

  return calls
}

describe('application title bar', () => {
  it('renders the registered app identity and drives custom window controls', async () => {
    const calls = renderTitleBar(defaultState)

    expect(await screen.findByRole('banner', { name: 'Electron Boilerplate window' })).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Minimize' }))
    fireEvent.click(screen.getByRole('button', { name: 'Maximize' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(await screen.findByRole('button', { name: 'Restore' })).toBeVisible()
    expect(calls).toEqual({
      appearanceSources: [],
      close: 1,
      minimize: 1,
      toggleMaximize: 1,
    })
  })

  it('offers system, light, and dark appearance sources', async () => {
    const calls = renderTitleBar(defaultState)

    fireEvent.click(await screen.findByRole('button', { name: 'Appearance: System' }))
    fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Dark' }))

    expect(await screen.findByRole('button', { name: 'Appearance: Dark' })).toBeVisible()
    expect(calls.appearanceSources).toEqual(['dark'])
  })

  it('preserves native platform controls', async () => {
    renderTitleBar({ ...defaultState, usesNativeControls: true })

    expect(await screen.findByText('Electron Boilerplate')).toBeVisible()
    expect(screen.queryByLabelText('Window controls')).not.toBeInTheDocument()
  })
})
