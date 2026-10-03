import type {
  BikeRoute,
  RouteCity,
  RouteDifficulty,
} from '../data/routes'
import type { RouteAmenity } from './routePois'

export type RouteSort =
  | 'length-asc'
  | 'length-desc'
  | 'difficulty-asc'
  | 'difficulty-desc'

export interface RouteFiltersState {
  minDistanceKm: number | null
  maxDistanceKm: number | null
  difficulty: RouteDifficulty | 'all'
  cities: RouteCity[]
  hasWater: boolean
  hasRestroom: boolean
  roundTrip: boolean
  allowRetracing: boolean
  sort: RouteSort
}

export const DEFAULT_ROUTE_FILTERS: RouteFiltersState = {
  minDistanceKm: null,
  maxDistanceKm: null,
  difficulty: 'all',
  cities: [],
  hasWater: false,
  hasRestroom: false,
  roundTrip: false,
  allowRetracing: false,
  sort: 'length-desc',
}

export function countActiveRouteFilters(filters: RouteFiltersState): number {
  return (
    Number(filters.minDistanceKm !== null || filters.maxDistanceKm !== null) +
    Number(filters.difficulty !== 'all') +
    Number(filters.cities.length > 0) +
    Number(filters.roundTrip) +
    Number(filters.roundTrip && filters.allowRetracing) +
    Number(filters.hasWater) +
    Number(filters.hasRestroom)
  )
}

function matchesDistance(route: BikeRoute, filters: RouteFiltersState) {
  return (
    (filters.minDistanceKm === null ||
      route.distanceKm >= filters.minDistanceKm) &&
    (filters.maxDistanceKm === null ||
      route.distanceKm <= filters.maxDistanceKm)
  )
}

export function filterRoutes(
  routes: BikeRoute[],
  amenitiesByRoute: Record<string, RouteAmenity[]>,
  filters: RouteFiltersState,
): BikeRoute[] {
  const difficultyRank: Record<RouteDifficulty, number> = {
    Easy: 1,
    Moderate: 2,
    Hard: 3,
  }
  const filteredRoutes = routes.filter((route) => {
      const amenities = amenitiesByRoute[route.id] ?? []

      return (
        matchesDistance(route, filters) &&
        (filters.difficulty === 'all' ||
          route.difficulty === filters.difficulty) &&
        (filters.cities.length === 0 ||
          filters.cities.some((city) => route.cities.includes(city))) &&
        (!filters.roundTrip || route.isRoundTrip) &&
        (!filters.hasWater ||
          amenities.some((amenity) => amenity.type === 'fountain')) &&
        (!filters.hasRestroom ||
          amenities.some((amenity) => amenity.type === 'restroom'))
      )
    })

  return filteredRoutes.sort((first, second) => {
    if (filters.sort === 'length-asc') {
      return first.distanceKm - second.distanceKm
    }
    if (filters.sort === 'length-desc') {
      return second.distanceKm - first.distanceKm
    }
    if (filters.sort === 'difficulty-asc') {
      return difficultyRank[first.difficulty] - difficultyRank[second.difficulty]
    }

    return difficultyRank[second.difficulty] - difficultyRank[first.difficulty]
  })
}
