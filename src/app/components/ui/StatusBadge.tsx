import { cn } from '../../utils/cn'
import type { GoodsStatus, AgentStatus } from '../../../types'

const goodsStatusStyles: Record<GoodsStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  assigned: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  ready_for_departure: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  in_transit: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  arrived: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  delayed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 line-through',
}

const agentStatusStyles: Record<AgentStatus, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  traveling: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  delivered: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  delayed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  inactive: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
}

const priorityStyles = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  high: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

interface StatusBadgeProps {
  status: GoodsStatus | AgentStatus
  type?: 'goods' | 'agent'
  label: string
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, type = 'goods', label, size = 'md' }: StatusBadgeProps) {
  const styles =
    type === 'goods'
      ? goodsStatusStyles[status as GoodsStatus]
      : agentStatusStyles[status as AgentStatus]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        styles
      )}
    >
      {label}
    </span>
  )
}

interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high'
  label: string
}

export function PriorityBadge({ priority, label }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        priorityStyles[priority]
      )}
    >
      {label}
    </span>
  )
}
