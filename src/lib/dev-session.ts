const DEV_SESSION_KEY = 'frontend-challenge:dev-session'

export function hasDevSession(): boolean {
  return (
    import.meta.env.DEV &&
    sessionStorage.getItem(DEV_SESSION_KEY) === 'active'
  )
}

export function startDevSession(): void {
  if (import.meta.env.DEV) {
    sessionStorage.setItem(DEV_SESSION_KEY, 'active')
  }
}

export function endDevSession(): void {
  sessionStorage.removeItem(DEV_SESSION_KEY)
}

export interface LoginSearch {
  redirect?: string
}

export function validateLoginSearch(
  search: Record<string, unknown>,
): LoginSearch {
  const destination = search.redirect

  if (
    typeof destination !== 'string' ||
    !destination.startsWith('/')
  ) {
    return {}
  }

  try {
    const url = new URL(destination, window.location.origin)

    if (url.origin !== window.location.origin) {
      return {}
    }

    return {
      redirect: `${url.pathname}${url.search}${url.hash}`,
    }
  } catch {
    return {}
  }
}