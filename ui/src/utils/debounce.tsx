import { useCallback, useRef } from 'react';

const useDebouncedCallback = (callback, delay: number, dependencies = []) => {
  const debounceTimeoutRef = useRef<number>(null);

  return useCallback(
    (...args) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay, ...dependencies]
  );
};

export default useDebouncedCallback;
