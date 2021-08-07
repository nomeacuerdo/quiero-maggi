import { useState } from 'react';

const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      const item2 = item || localStorage.getItem(key);
      return item2 ? JSON.parse(item2) : initialValue;
    } catch (error) {
      console.log(error); // eslint-disable-line no-console
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error); // eslint-disable-line no-console
    }
  };

  return [storedValue, setValue];
};

export default useLocalStorage;
