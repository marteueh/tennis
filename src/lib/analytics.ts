declare global {
  interface Window { dataLayer: Record<string, unknown>[] }
}

function pushEvent(event: string, params: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...params })
}

export const trackNewsletterSignup = (source: string) =>
  pushEvent('newsletter_signup', { newsletterSource: source })

export const trackVideoPlay = (
  videoId: string,
  matchTitle: string,
  tournament: string,
  year: number
) =>
  pushEvent('video_play', {
    videoId,
    matchTitle,
    tournamentName: tournament,
    matchYear: year,
  })

export const trackClericiClick = (matchSlug: string, matchTitle: string) =>
  pushEvent('clerici_link_click', { matchSlug, matchTitle })

export const trackSearch = (query: string, resultsCount: number) =>
  pushEvent('search_performed', { searchQuery: query, resultsCount })

export const trackMatchView = (
  matchSlug: string,
  matchTitle: string,
  tournament: string,
  year: number
) =>
  pushEvent('match_view', {
    matchSlug,
    matchTitle,
    tournamentName: tournament,
    matchYear: year,
  })

export const trackPlayerView = (playerName: string) =>
  pushEvent('player_view', { playerName })
