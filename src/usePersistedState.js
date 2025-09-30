// Create this as src/usePersistedState.js

import { useState, useEffect, useRef } from 'react';

// Custom hook that persists state to sessionStorage
function usePersistedState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key} from sessionStorage:`, error);
      return defaultValue;
    }
  });

  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip saving on first render (we just loaded from storage)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    try {
      window.sessionStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error saving ${key} to sessionStorage:`, error);
    }
  }, [key, state]);

  return [state, setState];
}

export default usePersistedState;
