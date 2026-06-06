import { ar } from './ar'
import { fr } from './fr'
import type { Language } from '../types'

const translations = { ar, fr }

type DeepValue<T> = T extends object
  ? { [K in keyof T]: DeepValue<T[K]> }
  : string

type Translations = typeof ar

function getNestedValue(obj: any, keys: string[]): string {
  let value = obj
  for (const key of keys) {
    value = value?.[key]
  }
  return typeof value === 'string' ? value : keys.join('.')
}

export function createT(language: Language) {
  return (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.')
    let value = getNestedValue(translations[language], keys)
    if (params) {
      value = Object.entries(params).reduce(
        (str, [k, v]) => str.replace(`{{${k}}}`, String(v)),
        value
      )
    }
    return value
  }
}

export type TFunction = ReturnType<typeof createT>
