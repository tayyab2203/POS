import { create } from 'zustand'
import type { Order, Settings } from '@/db'

export interface PrintJob {
  order: Order
  settings: Settings
  includeReceipt: boolean
  includeKot: boolean
  isDuplicate?: boolean
}

interface PrintState {
  job: PrintJob | null
  setJob: (job: PrintJob | null) => void
}

export const usePrintStore = create<PrintState>((set) => ({
  job: null,
  setJob: (job) => set({ job }),
}))
