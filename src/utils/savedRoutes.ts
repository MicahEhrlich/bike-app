import type { RouteCoordinate, RouteDifficulty } from '../data/routes'
import type { PointToPointRoute } from './pointToPointRouting'

export const SAVED_ROUTES_STORAGE_KEY = 'metrobike-saved-routes-v1'

export interface SavedBikeRoute {
  id: string
  name: string
  savedAt: string
  route: PointToPointRoute
  viaCoordinate: RouteCoordinate | null
}

export function estimateRouteDifficulty(distanceKm: number): RouteDifficulty {
  if (distanceKm <= 2) return 'Easy'
  if (distanceKm <= 6) return 'Moderate'
  return 'Hard'
}

function isCoordinate(value: unknown): value is RouteCoordinate {
  return Array.isArray(value) && value.length === 2 &&
    typeof value[0] === 'number' && Number.isFinite(value[0]) && Math.abs(value[0]) <= 90 &&
    typeof value[1] === 'number' && Number.isFinite(value[1]) && Math.abs(value[1]) <= 180
}

function isSavedRoute(value: unknown): value is SavedBikeRoute {
  if (!value || typeof value !== 'object') return false
  const entry = value as Partial<SavedBikeRoute>
  return typeof entry.id === 'string' && typeof entry.name === 'string' &&
    typeof entry.savedAt === 'string' && Number.isFinite(Date.parse(entry.savedAt)) &&
    !!entry.route && typeof entry.route.distanceKm === 'number' &&
    Number.isFinite(entry.route.distanceKm) && entry.route.distanceKm > 0 &&
    Array.isArray(entry.route.coordinates) && entry.route.coordinates.length >= 2 &&
    entry.route.coordinates.every(isCoordinate) &&
    (entry.viaCoordinate === null || isCoordinate(entry.viaCoordinate))
}

export function loadSavedRoutes(): SavedBikeRoute[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SAVED_ROUTES_STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(isSavedRoute) : []
  } catch {
    return []
  }
}

export function persistSavedRoutes(routes: SavedBikeRoute[]): void {
  localStorage.setItem(SAVED_ROUTES_STORAGE_KEY, JSON.stringify(routes))
}
