import { MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { cn } from './utils'
import { TOUCH_ICON_BTN } from './responsive'

export interface RowAction {
  key: string
  label: string
  icon?: React.ReactNode
  onClick: () => void
  destructive?: boolean
  className?: string
}

/** Primary actions visible; overflow into menu when more than `visibleCount` on mobile. */
export function RowActions({
  actions,
  visibleCount = 2,
  className,
}: {
  actions: RowAction[]
  visibleCount?: number
  className?: string
}) {
  const primary = actions.slice(0, visibleCount)
  const overflow = actions.slice(visibleCount)

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {primary.map((action) => (
        <button
          key={action.key}
          type="button"
          onClick={action.onClick}
          title={action.label}
          aria-label={action.label}
          className={cn(
            TOUCH_ICON_BTN,
            action.destructive && 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20',
            action.className,
          )}
        >
          {action.icon ?? <span className="text-xs font-medium">{action.label}</span>}
        </button>
      ))}
      {overflow.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={TOUCH_ICON_BTN} aria-label="More actions">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {overflow.map((action) => (
              <DropdownMenuItem
                key={action.key}
                variant={action.destructive ? 'destructive' : 'default'}
                onClick={action.onClick}
              >
                {action.icon}
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
