import type { SupplierTask, TaskStatus } from '../types'

const TASK_KEY = 'cargobridge_supplier_tasks'
const TASK_COUNTER_KEY = 'cargobridge_task_counter'

function generateTaskId(): string {
  const stored = localStorage.getItem(TASK_COUNTER_KEY)
  const counterData = stored ? JSON.parse(stored) : { count: 0 }
  counterData.count += 1
  localStorage.setItem(TASK_COUNTER_KEY, JSON.stringify(counterData))
  return `task-${Date.now()}-${counterData.count}`
}

export function isOverdue(task: SupplierTask): boolean {
  const today = new Date().toISOString().split('T')[0]
  return task.status === 'pending' && task.dueDate < today
}

export const taskService = {
  getAll(): SupplierTask[] {
    const stored = localStorage.getItem(TASK_KEY)
    if (!stored) return []
    try {
      return JSON.parse(stored) as SupplierTask[]
    } catch {
      return []
    }
  },

  getById(id: string): SupplierTask | undefined {
    return this.getAll().find(t => t.id === id)
  },

  getBySupplierId(supplierId: string): SupplierTask[] {
    return this.getAll()
      .filter(t => t.supplierId === supplierId && !t.isDeleted)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  },

  getOverdue(): SupplierTask[] {
    const today = new Date().toISOString().split('T')[0]
    return this.getAll().filter(t => t.status === 'pending' && t.dueDate < today && !t.isDeleted)
  },

  getPending(): SupplierTask[] {
    return this.getAll().filter(t => t.status === 'pending' && !t.isDeleted)
  },

  create(data: Omit<SupplierTask, 'id' | 'isDeleted' | 'createdAt' | 'updatedAt'>): SupplierTask {
    const all = this.getAll()
    const now = new Date().toISOString()
    const newTask: SupplierTask = {
      ...data,
      id: generateTaskId(),
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    }
    all.push(newTask)
    localStorage.setItem(TASK_KEY, JSON.stringify(all))
    return newTask
  },

  update(id: string, data: Partial<SupplierTask>): SupplierTask | null {
    const all = this.getAll()
    const idx = all.findIndex(t => t.id === id)
    if (idx === -1) return null
    const now = new Date().toISOString()
    const updated = { ...all[idx], ...data, updatedAt: now }
    if (data.status === 'completed' && !updated.completedAt) {
      updated.completedAt = now
    }
    all[idx] = updated
    localStorage.setItem(TASK_KEY, JSON.stringify(all))
    return all[idx]
  },

  markComplete(id: string): SupplierTask | null {
    const now = new Date().toISOString()
    return this.update(id, { status: 'completed', completedAt: now })
  },

  delete(id: string): boolean {
    const all = this.getAll()
    const idx = all.findIndex(t => t.id === id)
    if (idx === -1) return false
    all[idx] = { ...all[idx], isDeleted: true, updatedAt: new Date().toISOString() }
    localStorage.setItem(TASK_KEY, JSON.stringify(all))
    return true
  },

  reset(): void {
    localStorage.setItem(TASK_KEY, JSON.stringify([]))
    localStorage.setItem(TASK_COUNTER_KEY, JSON.stringify({ count: 0 }))
  },
}