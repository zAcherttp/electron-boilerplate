// @vitest-environment jsdom

import type { AppApi } from '../../../contracts/app-api'
import type { SystemInfo } from '../../../contracts/system-info'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { SystemInfoPage } from './system-info-page'

const systemInfo: SystemInfo = {
  appVersion: '0.1.0',
  architecture: 'x64',
  platform: 'win32',
  runtimeVersions: {
    chrome: '150.0.0',
    electron: '43.1.1',
    node: '24.18.0',
  },
}

afterEach(cleanup)

function renderSystemInfoPage(getInfo: AppApi['system']['getInfo']): void {
  window.app = { system: { getInfo } }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 0,
        retry: false,
      },
    },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <SystemInfoPage />
    </QueryClientProvider>,
  )
}

describe('system information page', () => {
  it('renders validated system information from the desktop API', async () => {
    renderSystemInfoPage(async () => systemInfo)

    expect(await screen.findByText('43.1.1')).toBeInTheDocument()
    expect(screen.getByText('win32 / x64')).toBeInTheDocument()
  })

  it('renders a failure state and lets the user retry', async () => {
    let attempt = 0

    const getInfo = async (): Promise<SystemInfo> => {
      attempt += 1

      if (attempt === 1) throw new Error('desktop API unavailable')

      return systemInfo
    }

    renderSystemInfoPage(getInfo)

    expect(await screen.findByRole('alert')).toHaveTextContent('System information is unavailable')

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('43.1.1')).toBeInTheDocument()
    expect(attempt).toBe(2)
  })
})
