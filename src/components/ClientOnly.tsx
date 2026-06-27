'use client'

import type { ReactNode } from 'react'
import { useHasMounted } from '../lib/useHasMounted'

interface ClientOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Renders children only after the client has mounted. Wraps pages that read
 * persisted (localStorage) Zustand state to avoid SSR hydration mismatches.
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const mounted = useHasMounted()
  return <>{mounted ? children : fallback}</>
}
