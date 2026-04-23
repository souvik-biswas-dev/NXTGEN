import { useEffect, useState } from 'react';

/**
 * Returns `value` after `delayMs` of no change. Ideal for text-search
 * inputs — debounces the keystroke into a single network call.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
