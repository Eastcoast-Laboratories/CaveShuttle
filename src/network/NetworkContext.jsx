import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { CaveNetworkManager } from './CaveNetworkManager.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'

const defaultManager = new CaveNetworkManager()
const defaultValue = { manager: defaultManager, state: defaultManager.getState() }
const NetworkContext = createContext(defaultValue)

export function NetworkProvider({ children }) {
  const { language } = useLanguage()
  const manager = useMemo(() => new CaveNetworkManager(), [])
  const [state, setState] = useState(() => manager.getState())

  useEffect(() => {
    manager.setLanguage(language)
  }, [manager, language])

  useEffect(() => {
    const handleChange = () => setState(manager.getState())
    manager.on('change', handleChange)
    return () => manager.off('change', handleChange)
  }, [manager])

  return (
    <NetworkContext.Provider value={{ manager, state }}>
      {children}
    </NetworkContext.Provider>
  )
}

export function useNetwork() {
  return useContext(NetworkContext) || defaultValue
}
