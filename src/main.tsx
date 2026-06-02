import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './core/auth/AuthContext'
import { OsProvider } from './core/os/OsContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <OsProvider>
          <App />
        </OsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

