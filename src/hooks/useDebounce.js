import { useState, useEffect } from 'react';

/**
 * useDebounce — Debounces a value by a given delay.
 * Useful for search inputs to avoid filtering on every keystroke.
 *
 * Usage:
 *   const [search, setSearch] = useState('');
 *   const debouncedSearch = useDebounce(search, 300);
 *   // Use debouncedSearch for filtering
 */
export default function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
