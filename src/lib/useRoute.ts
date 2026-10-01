import { useEffect, useState } from 'react'

export type Route = 'form' | 'admin'

const read = (): Route => (location.hash.startsWith('#/admin') ? 'admin' : 'form')

/** Tiny hash router: `#/admin` → dashboard, anything else → feedback form. */
export function useRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(read)
  useEffect(() => {
    const on = () => setRoute(read())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const go = (r: Route) => {
    location.hash = r === 'admin' ? '#/admin' : '#/'
    window.scrollTo({ top: 0 })
  }
  return [route, go]
}
