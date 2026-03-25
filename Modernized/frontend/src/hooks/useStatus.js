import { useState } from 'react';

// Replaces legacy Status factory + StatusController (status.js)
// success(msg), error(msg), clear() — used across all components
export function useStatus() {
  const [status, setStatus] = useState(null);

  const success = (message) => setStatus({ isError: false, message });
  const error = (message) => setStatus({ isError: true, message });
  const clear = () => setStatus(null);

  return { status, success, error, clear };
}
