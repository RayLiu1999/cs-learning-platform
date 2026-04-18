// React 應用入口
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './styles/reset.css'
import './styles/tokens.css'
import './styles/components.css'
import './styles/simulator.css'

import './i18n/index.js'

import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
