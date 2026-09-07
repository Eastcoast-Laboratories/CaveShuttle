import { useEffect, useState, useMemo } from 'react'
import { CaveNetworkManager } from './CaveNetworkManager.js'
import { useLanguage } from '../i18n/language-context.js'
import { NetworkContext } from './network-context.js'

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

