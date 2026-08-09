import React, { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext({ language: 'en', setLanguage: () => {} })

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      const stored = localStorage.getItem('caveShuttle_language')
      if (stored) return stored
    } catch {}
    return navigator.language && navigator.language.startsWith('de') ? 'de' : 'en'
  })

  useEffect(() => {
    try {
      localStorage.setItem('caveShuttle_language', language)
    } catch {}
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
