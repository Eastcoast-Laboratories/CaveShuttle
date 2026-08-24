import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { NetworkProvider } from './network/NetworkContext.jsx'
import { LanguageProvider } from './i18n/LanguageContext.jsx'
import { SettingsProvider } from './i18n/SettingsContext.jsx'
import { initCrashReporter } from './core/crash-reporter.js'
import './index.css'

initCrashReporter();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <SettingsProvider>
        <NetworkProvider>
          <App />
        </NetworkProvider>
      </SettingsProvider>
    </LanguageProvider>
  </React.StrictMode>,
)
