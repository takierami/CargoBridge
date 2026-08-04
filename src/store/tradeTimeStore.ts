import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_TRADE_TIME_PREFS } from '../constants/tradeCities'
import type { BusinessHoursConfig, TimeFormat, TradeTimePreferences } from '../types'

interface TradeTimeStore extends TradeTimePreferences {
  toggleCity: (cityId: string) => void
  pinCity: (cityId: string) => void
  moveCity: (cityId: string, direction: 'up' | 'down') => void
  setTimeFormat: (format: TimeFormat) => void
  setBusinessHours: (cityId: string, hours: BusinessHoursConfig) => void
  resetToDefaults: () => void
}

export const useTradeTimeStore = create<TradeTimeStore>()(
  persist(
    (set) => ({
      ...DEFAULT_TRADE_TIME_PREFS,
      toggleCity: (cityId) => set((state) => ({
        enabledCityIds: state.enabledCityIds.includes(cityId)
          ? state.enabledCityIds.filter((id) => id !== cityId)
          : [...state.enabledCityIds, cityId],
      })),
      pinCity: (cityId) => set((state) => ({
        pinnedCityIds: state.pinnedCityIds.includes(cityId)
          ? state.pinnedCityIds.filter((id) => id !== cityId)
          : [...state.pinnedCityIds, cityId],
      })),
      moveCity: (cityId, direction) => set((state) => {
        const cityOrder = [...state.cityOrder]
        const index = cityOrder.indexOf(cityId)
        const nextIndex = direction === 'up' ? index - 1 : index + 1
        if (index < 0 || nextIndex < 0 || nextIndex >= cityOrder.length) return {}
        ;[cityOrder[index], cityOrder[nextIndex]] = [cityOrder[nextIndex], cityOrder[index]]
        return { cityOrder }
      }),
      setTimeFormat: (timeFormat) => set({ timeFormat }),
      setBusinessHours: (cityId, hours) => set((state) => ({
        businessHoursOverrides: {
          ...state.businessHoursOverrides,
          [cityId]: hours,
        },
      })),
      resetToDefaults: () => set({ ...DEFAULT_TRADE_TIME_PREFS }),
    }),
    {
      name: 'cargobridge_trade_time',
      partialize: (state) => ({
        enabledCityIds: state.enabledCityIds,
        cityOrder: state.cityOrder,
        pinnedCityIds: state.pinnedCityIds,
        timeFormat: state.timeFormat,
        businessHoursOverrides: state.businessHoursOverrides,
      }),
    },
  ),
)
