import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/bricolage-grotesque'
import './index.css'
import App from './App.tsx'
import { applyTheme, getTheme } from './lib/theme'

// Set the theme before the first render so the page never flashes the wrong colors.
applyTheme(getTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
