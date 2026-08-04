import { useEffect, useState } from 'react'

export function useTradeClock(): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const update = () => setNow(new Date())
    const interval = window.setInterval(update, 60_000)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') update()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return now
}
