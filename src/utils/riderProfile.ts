import type { RouteCity, RouteDifficulty } from '../data/routes'
import type { RouteFiltersState } from './routeFilters'

export type PreferredLength = 'any' | 'short' | 'medium' | 'long'

export interface RiderProfile {
  name: string
  difficulty: RouteDifficulty | 'all'
  preferredLength: PreferredLength
  cities: RouteCity[]
}

export interface StoredRiderProfile {
  version: 1
  completed: true
  profile: RiderProfile
}

export const RIDER_PROFILE_STORAGE_KEY = 'bishvil-rider-profile-v1'

export const EMPTY_RIDER_PROFILE: RiderProfile = {
  name: '',
  difficulty: 'all',
  preferredLength: 'any',
  cities: [],
}

const difficulties = new Set(['all', 'Easy', 'Moderate', 'Hard'])
const lengths = new Set(['any', 'short', 'medium', 'long'])
const cities = new Set<RouteCity>(['Tel Aviv', 'Ramat Gan', 'Givatayim'])

export function normalizeRiderProfile(profile: RiderProfile): RiderProfile {
  return {
    name: profile.name.trim().slice(0, 40),
    difficulty: profile.difficulty,
    preferredLength: profile.preferredLength,
    cities: [...new Set(profile.cities)].filter((city) => cities.has(city)),
  }
}

export function loadStoredRiderProfile(): StoredRiderProfile | null {
  try {
    const rawValue = localStorage.getItem(RIDER_PROFILE_STORAGE_KEY)
    if (!rawValue) return null

    const value: unknown = JSON.parse(rawValue)
    if (typeof value !== 'object' || value === null) return null
    const stored = value as Partial<StoredRiderProfile>
    const profile = stored.profile as Partial<RiderProfile> | undefined
    if (
      stored.version !== 1 ||
      stored.completed !== true ||
      !profile ||
      typeof profile.name !== 'string' ||
      !difficulties.has(profile.difficulty ?? '') ||
      !lengths.has(profile.preferredLength ?? '') ||
      !Array.isArray(profile.cities) ||
      !profile.cities.every((city) => cities.has(city as RouteCity))
    ) {
      return null
    }

    return {
      version: 1,
      completed: true,
      profile: normalizeRiderProfile(profile as RiderProfile),
    }
  } catch {
    return null
  }
}

export function saveRiderProfile(profile: RiderProfile) {
  const normalizedProfile = normalizeRiderProfile(profile)
  try {
    localStorage.setItem(
      RIDER_PROFILE_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        completed: true,
        profile: normalizedProfile,
      } satisfies StoredRiderProfile),
    )
  } catch {
    // The current session still works when storage is unavailable.
  }
  return normalizedProfile
}

export function applyProfileToFilters(
  profile: RiderProfile,
  filters: RouteFiltersState,
): RouteFiltersState {
  const distance =
    profile.preferredLength === 'short'
      ? { minDistanceKm: null, maxDistanceKm: 1 }
      : profile.preferredLength === 'medium'
        ? { minDistanceKm: 1, maxDistanceKm: 2 }
        : profile.preferredLength === 'long'
          ? { minDistanceKm: 2, maxDistanceKm: 3 }
          : { minDistanceKm: null, maxDistanceKm: null }

  return {
    ...filters,
    ...distance,
    difficulty: profile.difficulty,
    cities: profile.cities,
  }
}
