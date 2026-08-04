import { cn } from './utils'

/**
 * Desktop: render `table` inside horizontal scroll.
 * Mobile (&lt; md): stacked cards via `renderCard`.
 */
export function ResponsiveDataList<T>({
  rows,
  keyField,
  table,
  renderCard,
  empty,
  className,
}: {
  rows: T[]
  keyField: (row: T, index: number) => string
  /** Full table element (thead+tbody); wrapped in overflow-x-auto for md+. */
  table: React.ReactNode
  renderCard: (row: T, index: number) => React.ReactNode
  empty?: React.ReactNode
  className?: string
}) {
  if (!rows.length && empty) return <>{empty}</>

  return (
    <div className={className}>
      <div className="hidden overflow-x-auto md:block">{table}</div>
      <div className="space-y-3 md:hidden">
        {rows.map((row, index) => (
          <div
            key={keyField(row, index)}
            className={cn(
              'rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800',
            )}
          >
            {renderCard(row, index)}
          </div>
        ))}
      </div>
    </div>
  )
}
