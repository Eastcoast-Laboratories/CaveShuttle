import { createContext, useContext } from 'react';

// Context object and hook live here (non-JSX file) so the provider file
// only exports a component, satisfying react-refresh/only-export-components.
const LanguageContext = createContext({ language: 'en', setLanguage: () => {} });

export function useLanguage() {
  return useContext(LanguageContext);
}

export { LanguageContext };
