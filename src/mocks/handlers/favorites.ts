import { http, HttpResponse } from 'msw/http'
import type { AddFavoriteRequest, FavoritesResponse } from '@/contracts/api'
import { commit, db } from '../db'
import { authenticate, errorResponse, readJson } from '../utils'

function favoritesOf(userId: string): string[] {
  if (!db().favorites[userId]) db().favorites[userId] = []
  return db().favorites[userId]
}

export const favoriteHandlers = [
  http.get('/api/favorites', ({ request }) => {
    const auth = authenticate(request)
    if ('response' in auth) return auth.response
    const body: FavoritesResponse = { nftIds: favoritesOf(auth.user.id) }
    return HttpResponse.json(body)
  }),

  http.post('/api/favorites', async ({ request }) => {
    const auth = authenticate(request)
    if ('response' in auth) return auth.response

    const { nftId } = await readJson<AddFavoriteRequest>(request)
    if (!nftId || !db().nfts.some((nft) => nft.id === nftId)) {
      return errorResponse(404, 'NOT_FOUND', 'NFT não encontrado.')
    }

    const list = favoritesOf(auth.user.id)
    const isNew = !list.includes(nftId)
    if (isNew) {
      list.push(nftId)
      commit()
    }
    const body: FavoritesResponse = { nftIds: list }
    return HttpResponse.json(body, { status: isNew ? 201 : 200 })
  }),

  http.delete('/api/favorites/:nftId', ({ request, params }) => {
    const auth = authenticate(request)
    if ('response' in auth) return auth.response

    const next = favoritesOf(auth.user.id).filter((id) => id !== params.nftId)
    db().favorites[auth.user.id] = next
    commit()
    const body: FavoritesResponse = { nftIds: next }
    return HttpResponse.json(body)
  }),
]