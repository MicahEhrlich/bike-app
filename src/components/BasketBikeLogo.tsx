interface BasketBikeLogoProps {
  size?: number
  className?: string
}

export function BasketBikeLogo({ size = 28, className }: BasketBikeLogoProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="7" cy="23" r="5" />
      <circle cx="25" cy="23" r="5" />
      <path d="m7 23 6-11 5 11H7l13-11 5 11M11 9h5m-3 0v3m7 0-2-5h4" />
      <path d="M23 9h7l-1 6h-5l-1-6Zm1.5 3h4" />
    </svg>
  )
}
