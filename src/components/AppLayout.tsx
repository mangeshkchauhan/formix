'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTemplatesStore } from '../store/templates'
import { useHasMounted } from '../lib/useHasMounted'
import { IconGrid, IconStar } from './icons'
import { Logo } from './Logo'

function navItemClass(active: boolean): string {
  return `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
    active ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-canvas hover:text-ink'
  }`
}

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const mounted = useHasMounted()
  const templates = useTemplatesStore((s) => s.templates)
  const favCount = templates.filter((t) => t.favorite).length

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-white md:flex">
        <div className="px-5 py-5">
          <Logo />
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-3">
          <Link href="/" className={navItemClass(pathname === '/')}>
            <IconGrid /> All Templates
            {mounted ? (
              <span className="ml-auto text-xs text-muted">{templates.length}</span>
            ) : null}
          </Link>
          <Link href="/favourites" className={navItemClass(pathname === '/favourites')}>
            <IconStar /> Favourites
            {mounted ? (
              <span className="ml-auto text-xs text-muted">{favCount}</span>
            ) : null}
          </Link>
        </nav>

        <div className="border-t border-line px-5 py-4 text-xs text-muted">
          Stored locally in your browser
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-canvas pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>

      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <Link
          href="/"
          className={`flex flex-1 flex-col items-center gap-0.5 px-2 py-2.5 text-xs font-medium transition ${
            pathname === '/'
              ? 'text-brand'
              : 'text-muted active:bg-canvas'
          }`}
        >
          <IconGrid />
          <span>Templates</span>
          {mounted ? (
            <span className="text-[10px] text-muted">{templates.length}</span>
          ) : null}
        </Link>
        <Link
          href="/favourites"
          className={`flex flex-1 flex-col items-center gap-0.5 px-2 py-2.5 text-xs font-medium transition ${
            pathname === '/favourites'
              ? 'text-brand'
              : 'text-muted active:bg-canvas'
          }`}
        >
          <IconStar />
          <span>Favourites</span>
          {mounted ? (
            <span className="text-[10px] text-muted">{favCount}</span>
          ) : null}
        </Link>
      </nav>
    </div>
  )
}
