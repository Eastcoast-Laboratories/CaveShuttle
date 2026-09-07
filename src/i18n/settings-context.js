import { createContext, useContext } from 'react';

// Context object and hook live here (non-JSX file) so the provider file
// only exports a component, satisfying react-refresh/only-export-components.
const SettingsContext = createContext(null);

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
}

export { SettingsContext };
