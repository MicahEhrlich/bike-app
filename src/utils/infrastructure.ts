import type { Feature, Geometry } from 'geojson'
import type { BikePathProperties } from './loadBikeData'

export type InfrastructureType =
  | 'dedicated'
  | 'on-road'
  | 'other'
  | 'fountain'
  | 'restroom'

export const ALL_INFRASTRUCTURE_TYPES: InfrastructureType[] = [
  'dedicated',
  'on-road',
  'other',
  'fountain',
  'restroom',
]

export const INFRASTRUCTURE_META: Record<
  InfrastructureType,
  { label: string; color: string; dashed?: boolean; dot?: boolean }
> = {
  dedicated: { label: 'Dedicated paths', color: '#059669' },
  'on-road': { label: 'On-road lanes', color: '#0284c7', dashed: true },
  other: { label: 'Other paths', color: '#d97706' },
  fountain: { label: 'Water fountains', color: '#0284c7', dot: true },
  restroom: { label: 'Restrooms', color: '#7c3aed', dot: true },
}

export function hasBikeLane(value: unknown): boolean {
  if (typeof value !== 'string') return Boolean(value)
  return !['', 'no', 'none', 'false'].includes(value.toLowerCase())
}

export function classifyInfrastructureFeature(
  feature: Feature<Geometry, BikePathProperties>,
): InfrastructureType | null {
  const properties = feature.properties ?? {}

  if (
    feature.geometry.type === 'Point' &&
    properties.amenity === 'toilets'
  ) {
    return 'restroom'
  }

  if (
    feature.geometry.type === 'Point' &&
    (properties.amenity === 'drinking_water' ||
      properties.man_made === 'water_tap' ||
      properties.drinking_water === 'yes')
  ) {
    return 'fountain'
  }

  if (!['LineString', 'MultiLineString'].includes(feature.geometry.type)) {
    return null
  }

  if (properties.highway === 'cycleway' || properties.cycleway === 'track') {
    return 'dedicated'
  }

  if (
    hasBikeLane(properties.cycleway) ||
    hasBikeLane(properties['cycleway:left']) ||
    hasBikeLane(properties['cycleway:right'])
  ) {
    return 'on-road'
  }

  return 'other'
}

export function countInfrastructureTypes(
  features: Array<Feature<Geometry, BikePathProperties>>,
): Record<InfrastructureType, number> {
  const counts: Record<InfrastructureType, number> = {
    dedicated: 0,
    'on-road': 0,
    other: 0,
    fountain: 0,
    restroom: 0,
  }

  for (const feature of features) {
    const type = classifyInfrastructureFeature(feature)
    if (type) counts[type] += 1
  }

  return counts
}
