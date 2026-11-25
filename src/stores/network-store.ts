import { create } from 'zustand'

interface NetworkState {
  isOnline: boolean
  setOnline: (isOnline: boolean) => void
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  setOnline: (isOnline) => set({ isOnline }),
}))

let listenersAttached = false

export function attachNetworkListeners() {
  if (listenersAttached || typeof window === 'undefined') return
  listenersAttached = true

  const sync = () => useNetworkStore.getState().setOnline(navigator.onLine)
  window.addEventListener('online', sync)
  window.addEventListener('offline', sync)
  sync()
}
