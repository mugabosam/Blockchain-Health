import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#222a3d',
            color: '#dae2fd',
            border: '1px solid rgba(60, 74, 66, 0.15)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.875rem',
          },
          success: {
            iconTheme: { primary: '#4edea3', secondary: '#003824' },
          },
          error: {
            iconTheme: { primary: '#ffb3ad', secondary: '#68000a' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
