interface LogoProps {
  compact?: boolean
}

export function Logo({ compact }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="4" y="3" width="16" height="18" rx="3" fill="white" opacity="0.25" />
          <path
            d="M8 8h8M8 12h8M8 16h4"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {!compact ? (
        <span className="text-lg font-bold tracking-tight text-ink">
          Form<span className="text-brand">ix</span>
        </span>
      ) : null}
    </div>
  )
}
