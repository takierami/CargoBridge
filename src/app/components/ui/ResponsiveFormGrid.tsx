import { cn } from './utils'

type Cols = 2 | 3

export function ResponsiveFormGrid({
  cols = 2,
  className,
  children,
}: {
  cols?: Cols
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        cols === 3
          ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3'
          : 'grid grid-cols-1 gap-3 sm:grid-cols-2',
        className,
      )}
    >
      {children}
    </div>
  )
}
