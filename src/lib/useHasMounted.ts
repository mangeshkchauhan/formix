'use client'

import { useEffect, useState } from 'react'

/**
 * Returns true only after the component has mounted on the client. Used to defer
 * rendering of anything that depends on localStorage-backed Zustand state, so the
 * server-rendered HTML and the first client render match (no hydration mismatch).
 */
export function useHasMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}
