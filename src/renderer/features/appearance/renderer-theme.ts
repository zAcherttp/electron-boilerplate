export function applyRendererTheme(isDark: boolean): void {
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
}

export function installRendererTheme(): () => void {
  const colorScheme = window.matchMedia('(prefers-color-scheme: dark)')
  const applyColorScheme = (): void => applyRendererTheme(colorScheme.matches)

  applyColorScheme()
  colorScheme.addEventListener('change', applyColorScheme)

  return () => colorScheme.removeEventListener('change', applyColorScheme)
}
