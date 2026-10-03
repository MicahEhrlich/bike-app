import type { FeatureCollection, Geometry } from 'geojson'

export interface BikePathProperties {
  name?: string
  'name:he'?: string
  highway?: string
  cycleway?: string
  'cycleway:left'?: string
  'cycleway:right'?: string
  amenity?: string
  bicycle?: string
  drinking_water?: string
  man_made?: string
  [key: string]: unknown
}

export type BikePathCollection = FeatureCollection<
  Geometry,
  BikePathProperties
>

function isBikePathCollection(value: unknown): value is BikePathCollection {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>
  return candidate.type === 'FeatureCollection' && Array.isArray(candidate.features)
}

export async function loadBikeData(
  signal?: AbortSignal,
): Promise<BikePathCollection> {
  const response = await fetch('/dan_bike_lanes.geojson', {
    headers: { Accept: 'application/geo+json, application/json' },
    signal,
  })

  if (!response.ok) {
    throw new Error(
      `Could not load bike infrastructure (${response.status} ${response.statusText})`,
    )
  }

  const data: unknown = await response.json()

  if (!isBikePathCollection(data)) {
    throw new Error('The bike infrastructure file is not a valid GeoJSON FeatureCollection')
  }

  return data
}
