import type { BusinessHoursConfig, TradeCity, TradeTimePreferences } from '../types'

export const REFERENCE_TIMEZONE = 'Africa/Algiers'

const DEFAULT_BUSINESS_HOURS: BusinessHoursConfig = {
  open: '09:00',
  close: '17:00',
  closingSoonEnd: '18:00',
}

function city(
  id: string,
  name: string,
  nameAr: string,
  nameFr: string,
  country: string,
  countryAr: string,
  countryFr: string,
  flag: string,
  ianaTimeZone: string,
  region: TradeCity['region'],
): TradeCity {
  return {
    id,
    name,
    nameAr,
    nameFr,
    country,
    countryAr,
    countryFr,
    flag,
    ianaTimeZone,
    region,
    defaultBusinessHours: { ...DEFAULT_BUSINESS_HOURS },
  }
}

export const TRADE_CITIES: TradeCity[] = [
  city('algiers', 'Algiers', 'الجزائر العاصمة', 'Alger', 'Algeria', 'الجزائر', 'Algérie', '🇩🇿', 'Africa/Algiers', 'algeria'),
  city('guangzhou', 'Guangzhou', 'غوانزو', 'Canton', 'China', 'الصين', 'Chine', '🇨🇳', 'Asia/Shanghai', 'china'),
  city('shenzhen', 'Shenzhen', 'شنتشن', 'Shenzhen', 'China', 'الصين', 'Chine', '🇨🇳', 'Asia/Shanghai', 'china'),
  city('yiwu', 'Yiwu', 'ييوو', 'Yiwu', 'China', 'الصين', 'Chine', '🇨🇳', 'Asia/Shanghai', 'china'),
  city('shanghai', 'Shanghai', 'شنغهاي', 'Shanghai', 'China', 'الصين', 'Chine', '🇨🇳', 'Asia/Shanghai', 'china'),
  city('ningbo', 'Ningbo', 'نينغبو', 'Ningbo', 'China', 'الصين', 'Chine', '🇨🇳', 'Asia/Shanghai', 'china'),
  city('qingdao', 'Qingdao', 'تشينغداو', 'Qingdao', 'China', 'الصين', 'Chine', '🇨🇳', 'Asia/Shanghai', 'china'),
  city('xiamen', 'Xiamen', 'شيامن', 'Xiamen', 'China', 'الصين', 'Chine', '🇨🇳', 'Asia/Shanghai', 'china'),
  city('tianjin', 'Tianjin', 'تيانجين', 'Tianjin', 'China', 'الصين', 'Chine', '🇨🇳', 'Asia/Shanghai', 'china'),
  city('dubai', 'Dubai', 'دبي', 'Dubaï', 'UAE', 'الإمارات', 'Émirats arabes unis', '🇦🇪', 'Asia/Dubai', 'uae'),
  city('istanbul', 'Istanbul', 'إسطنبول', 'Istanbul', 'Turkey', 'تركيا', 'Turquie', '🇹🇷', 'Europe/Istanbul', 'turkey'),
  city('frankfurt', 'Frankfurt', 'فرانكفورت', 'Francfort', 'Germany', 'ألمانيا', 'Allemagne', '🇩🇪', 'Europe/Berlin', 'europe'),
  city('rotterdam', 'Rotterdam', 'روتردام', 'Rotterdam', 'Netherlands', 'هولندا', 'Pays-Bas', '🇳🇱', 'Europe/Amsterdam', 'europe'),
  city('milan', 'Milan', 'ميلانو', 'Milan', 'Italy', 'إيطاليا', 'Italie', '🇮🇹', 'Europe/Rome', 'europe'),
]

const aliases: Record<string, string[]> = {
  algiers: ['algiers', 'alger', 'الجزائر', 'الجزائر العاصمة'],
  guangzhou: ['guangzhou', 'canton', 'غوانزو', 'كوانزو'],
  shenzhen: ['shenzhen', 'شنتشن'],
  yiwu: ['yiwu', 'ييوو', 'ايوو'],
  shanghai: ['shanghai', 'شنغهاي'],
  ningbo: ['ningbo', 'نينغبو'],
  qingdao: ['qingdao', 'tsingtao', 'تشينغداو'],
  xiamen: ['xiamen', 'amoy', 'شيامن'],
  tianjin: ['tianjin', 'تيانجين'],
  dubai: ['dubai', 'dubaï', 'دبي'],
  istanbul: ['istanbul', 'اسطنبول', 'إسطنبول'],
  frankfurt: ['frankfurt', 'francfort', 'فرانكفورت'],
  rotterdam: ['rotterdam', 'روتردام'],
  milan: ['milan', 'milano', 'ميلانو'],
}

export const CITY_LOCATION_ALIASES = Object.fromEntries(
  Object.entries(aliases).flatMap(([id, values]) =>
    values.map((value) => [value.toLocaleLowerCase().trim(), id]),
  ),
)

const countries: Record<string, string[]> = {
  algiers: ['algeria', 'algérie', 'الجزائر'],
  guangzhou: ['china', 'chine', 'الصين'],
  dubai: ['uae', 'united arab emirates', 'émirats arabes unis', 'الإمارات', 'الامارات'],
  istanbul: ['turkey', 'türkiye', 'turquie', 'تركيا'],
  frankfurt: ['germany', 'allemagne', 'ألمانيا'],
  rotterdam: ['netherlands', 'pays-bas', 'holland', 'هولندا'],
  milan: ['italy', 'italie', 'إيطاليا', 'ايطاليا'],
}

export const COUNTRY_CITY_FALLBACKS = Object.fromEntries(
  Object.entries(countries).flatMap(([id, values]) =>
    values.map((value) => [value.toLocaleLowerCase().trim(), id]),
  ),
)

export const DEFAULT_TRADE_TIME_PREFS: TradeTimePreferences = {
  enabledCityIds: TRADE_CITIES.map(({ id }) => id),
  cityOrder: TRADE_CITIES.map(({ id }) => id),
  pinnedCityIds: ['algiers'],
  timeFormat: '24h',
  businessHoursOverrides: {},
}
