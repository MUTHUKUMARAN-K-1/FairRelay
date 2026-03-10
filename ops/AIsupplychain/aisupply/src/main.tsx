import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import './index.css'
import App from './App.tsx'
import { store } from './store'

import { BrowserRouter } from 'react-router-dom'

// Guard: ensure root exists and is an Element to avoid IntersectionObserver "parameter 1 is not of type 'Element'" errors
const rootEl = document.getElementById('root')
if (!rootEl || !(rootEl instanceof HTMLElement)) {
  console.error('Root element #root not found or not an HTMLElement')
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    </StrictMode>,
  )
}
