import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { installRendererTheme } from './features/appearance/renderer-theme'

const removeRendererTheme = installRendererTheme()
window.addEventListener('pagehide', removeRendererTheme, { once: true })

const rootElement = document.getElementById('root')

if (!rootElement) throw new Error('Missing renderer root element')

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
