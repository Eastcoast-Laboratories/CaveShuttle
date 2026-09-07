import { createContext, useContext } from 'react';
import { CaveNetworkManager } from './CaveNetworkManager.js';

// Context object, default value, and hook live here (non-JSX file) so the
// provider file only exports a component, satisfying react-refresh/only-export-components.
const defaultManager = new CaveNetworkManager();
const defaultValue = { manager: defaultManager, state: defaultManager.getState() };
const NetworkContext = createContext(defaultValue);

export function useNetwork() {
  return useContext(NetworkContext) || defaultValue;
}

export { NetworkContext, defaultValue };
