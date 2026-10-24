export interface LoginSearch {
  redirect?: string
}

export function validateLoginSearch(search: Record<string, unknown>): LoginSearch {
  const destination = search.redirect

  if (typeof destination !== 'string' || !destination.startsWith('/')) {
    return {}
  }

  try {
    const url = new URL(destination, window.location.origin)

    if (url.origin !== window.location.origin) {
      return {}
    }

    return { redirect: `${url.pathname}${url.search}${url.hash}` }
  } catch {
    return {}
  }
}