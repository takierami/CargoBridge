import { AgentForm } from '../agents/AgentForm'
import type { Agent } from '../../../types'

export type { AgentFormPayload } from '../agents/AgentForm'

type Props = {
  initial?: Partial<Agent>
  onSave: (data: Record<string, unknown>) => void | Promise<void>
  onCancel: () => void
  nested?: boolean
  /** When true (default for Goods nested create), only General + Contact tabs */
  compact?: boolean
}

/** Thin wrapper — shared tabbed AgentForm; compact by default for Goods quick-create. */
export function AgentQuickCreate({ initial, onSave, onCancel, nested, compact = true }: Props) {
  return (
    <AgentForm
      initial={initial}
      onSave={onSave}
      onCancel={onCancel}
      nested={nested}
      compact={compact}
    />
  )
}
