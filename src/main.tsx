import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './lib/i18n'
import './styles/tokens.css'
import './index.css'
import App from './App'
import { recargarUnaVez } from './app/recarga'

// Un archivo de la app que ya no existe (despliegue nuevo con la pestaña abierta): recargar una vez y no quedar en blanco.
window.addEventListener('vite:preloadError', (e) => {
  e.preventDefault()
  recargarUnaVez()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
