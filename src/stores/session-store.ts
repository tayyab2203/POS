import { create } from 'zustand'

export type AppRole = 'cashier' | 'owner'
export type AppModule =
  | 'pos'
  | 'orders'
  | 'products'
  | 'expenses'
  | 'khata'
  | 'reports'
  | 'settings'
  | 'liveCloud'

const OWNER_MODULES: AppModule[] = ['settings', 'reports']

interface SessionState {
  role: AppRole
  activeModule: AppModule
  pinModalOpen: boolean
  pendingModule: AppModule | null
  ownerUnlockedAt: number | null
  setActiveModule: (module: AppModule) => void
  requestModule: (module: AppModule) => boolean
  openPinModal: (pendingModule?: AppModule | null) => void
  closePinModal: () => void
  unlockOwner: () => void
  lockOwner: () => void
  requiresOwner: (module: AppModule) => boolean
}

export const useSessionStore = create<SessionState>((set, get) => ({
  role: 'cashier',
  activeModule: 'pos',
  pinModalOpen: false,
  pendingModule: null,
  ownerUnlockedAt: null,

  requiresOwner: (module) => OWNER_MODULES.includes(module),

  setActiveModule: (module) => set({ activeModule: module }),

  requestModule: (module) => {
    const { role, requiresOwner } = get()
    if (requiresOwner(module) && role !== 'owner') {
      set({ pinModalOpen: true, pendingModule: module })
      return false
    }
    set({ activeModule: module })
    return true
  },

  openPinModal: (pendingModule = null) =>
    set({ pinModalOpen: true, pendingModule }),

  closePinModal: () => set({ pinModalOpen: false, pendingModule: null }),

  unlockOwner: () => {
    const { pendingModule } = get()
    set({
      role: 'owner',
      ownerUnlockedAt: Date.now(),
      pinModalOpen: false,
      activeModule: pendingModule ?? get().activeModule,
      pendingModule: null,
    })
  },

  lockOwner: () =>
    set({
      role: 'cashier',
      ownerUnlockedAt: null,
      activeModule:
        get().requiresOwner(get().activeModule) ? 'pos' : get().activeModule,
    }),
}))
