import { useState, useEffect } from 'react'
import { LanguageContext } from './language-context.js'

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      const stored = localStorage.getItem('caveShuttle_language')
      if (stored) return stored
    } catch { /* localStorage not available */ }
    return navigator.language && navigator.language.startsWith('de') ? 'de' : 'en'
  })

  useEffect(() => {
    try {
      localStorage.setItem('caveShuttle_language', language)
    } catch { /* localStorage not available */ }
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

