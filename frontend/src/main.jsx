import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { register as registerServiceWorker } from './registerServiceWorker'

// Initialize Service Worker for PWA (Add to Home Screen capability)
registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
