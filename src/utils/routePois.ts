import type { Point } from 'geojson'
import type { BikeRoute, RouteCoordinate } from '../data/routes'
import type { BikePathCollection } from './loadBikeData'

export type RouteAmenityType = 'fountain' | 'restroom'

export interface RouteAmenity {
  id: string
  name?: string
  nameHe?: string
  nameEn?: string
  type: RouteAmenityType
  coordinates: RouteCoordinate
  distanceMeters: number
}

const DEFAULT_CORRIDOR_METERS = 200

function getAmenityType(
  properties: Record<string, unknown>,
): RouteAmenityType | null {
  if (properties.amenity === 'toilets') return 'restroom'

  return (
    properties.amenity === 'drinking_water' ||
    properties.man_made === 'water_tap' ||
    properties.drinking_water === 'yes'
  )
    ? 'fountain'
    : null
}

function pointToSegmentDistance(
  point: RouteCoordinate,
  start: RouteCoordinate,
  end: RouteCoordinate,
): number {
  const latitudeRadians = (point[0] * Math.PI) / 180
  const metersPerLongitudeDegree = 111_320 * Math.cos(latitudeRadians)
  const metersPerLatitudeDegree = 110_540

  const pointX = point[1] * metersPerLongitudeDegree
  const pointY = point[0] * metersPerLatitudeDegree
  const startX = start[1] * metersPerLongitudeDegree
  const startY = start[0] * metersPerLatitudeDegree
  const endX = end[1] * metersPerLongitudeDegree
  const endY = end[0] * metersPerLatitudeDegree
  const segmentX = endX - startX
  const segmentY = endY - startY
  const segmentLengthSquared = segmentX ** 2 + segmentY ** 2
  const projection =
    segmentLengthSquared === 0
      ? 0
      : ((pointX - startX) * segmentX + (pointY - startY) * segmentY) /
        segmentLengthSquared
  const clampedProjection = Math.max(0, Math.min(1, projection))
  const closestX = startX + clampedProjection * segmentX
  const closestY = startY + clampedProjection * segmentY

  return Math.hypot(pointX - closestX, pointY - closestY)
}

function distanceToRoute(
  point: RouteCoordinate,
  route: BikeRoute,
): number {
  let shortestDistance = Number.POSITIVE_INFINITY

  for (let index = 0; index < route.coordinates.length - 1; index += 1) {
    const distance = pointToSegmentDistance(
      point,
      route.coordinates[index],
      route.coordinates[index + 1],
    )
    shortestDistance = Math.min(shortestDistance, distance)
  }

  return shortestDistance
}

export function findNearbyAmenities(
  route: BikeRoute,
  data: BikePathCollection,
  corridorMeters = DEFAULT_CORRIDOR_METERS,
): RouteAmenity[] {
  return data.features
    .flatMap((feature, index): RouteAmenity[] => {
      if (feature.geometry.type !== 'Point') return []

      const properties = feature.properties ?? {}
      const type = getAmenityType(properties)
      if (!type) return []

      const [longitude, latitude] = (feature.geometry as Point).coordinates
      const coordinates: RouteCoordinate = [latitude, longitude]
      const distanceMeters = distanceToRoute(coordinates, route)
      if (distanceMeters > corridorMeters) return []

      return [
        {
          id: String(feature.id ?? `${type}-${index}`),
          name: typeof properties.name === 'string' ? properties.name : undefined,
          nameHe:
            typeof properties['name:he'] === 'string'
              ? properties['name:he']
              : undefined,
          nameEn:
            typeof properties['name:en'] === 'string'
              ? properties['name:en']
              : undefined,
          type,
          coordinates,
          distanceMeters: Math.round(distanceMeters),
        },
      ]
    })
    .sort((first, second) => first.distanceMeters - second.distanceMeters)
}
