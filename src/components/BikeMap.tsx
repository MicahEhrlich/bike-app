import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Feature, Geometry, Point } from 'geojson'
import {
  circleMarker,
  latLngBounds,
  type LatLng,
  type Layer,
  type PathOptions,
} from 'leaflet'
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import { deriveBikeRoutes, type BikeRoute } from '../data/routes'
import type {
  BikePathCollection,
  BikePathProperties,
} from '../utils/loadBikeData'
import { findNearbyAmenities } from '../utils/routePois'
import {
  DEFAULT_ROUTE_FILTERS,
  filterRoutes,
  type RouteFiltersState,
} from '../utils/routeFilters'
import {
  ALL_INFRASTRUCTURE_TYPES,
  INFRASTRUCTURE_META,
  classifyInfrastructureFeature,
  countInfrastructureTypes,
  type InfrastructureType,
} from '../utils/infrastructure'
import { InfrastructureFilters } from './InfrastructureFilters'
import { RoutesPanel } from './RoutesPanel'

interface BikeMapProps {
  data: BikePathCollection
  selectedRoute: BikeRoute | null
  isRoutesPanelCollapsed: boolean
  onSelectRoute: (route: BikeRoute) => void
  onClearRoute: () => void
  onToggleRoutesPanel: () => void
}

const MAP_CENTER: [number, number] = [32.078, 34.781]

function getPathStyle(
  feature?: Feature<Geometry, BikePathProperties>,
): PathOptions {
  if (!feature) return {}
  const type = classifyInfrastructureFeature(feature)

  if (type === 'dedicated') {
    return { color: '#059669', opacity: 0.92, weight: 4 }
  }

  if (type === 'on-road') {
    return {
      color: '#0284c7',
      dashArray: '7 6',
      opacity: 0.9,
      weight: 3,
    }
  }

  return { color: '#d97706', opacity: 0.85, weight: 2 }
}

function bindFeatureTooltip(
  feature: Feature<Geometry, BikePathProperties>,
  layer: Layer,
) {
  const properties = feature.properties ?? {}
  const infrastructureType = classifyInfrastructureFeature(feature)
  const isWater = infrastructureType === 'fountain'
  const isRestroom = infrastructureType === 'restroom'
  const name =
    properties.name ??
    properties['name:he'] ??
    (isWater ? 'Drinking water' : isRestroom ? 'Public restroom' : 'Unnamed path')
  const tooltip = document.createElement('div')
  const title = document.createElement('strong')
  const typeLabel = document.createElement('span')

  title.textContent = name
  typeLabel.textContent = infrastructureType
      ? INFRASTRUCTURE_META[infrastructureType].label
      : 'Bike infrastructure'
  typeLabel.className = 'bike-path-tooltip__type'
  tooltip.className = 'bike-path-tooltip'
  tooltip.append(title, typeLabel)

  layer.bindTooltip(tooltip, {
    direction: 'top',
    opacity: 0.97,
    sticky: true,
  })
}

function createAmenityMarker(
  feature: Feature<Point, BikePathProperties>,
  latLng: LatLng,
) {
  const type = classifyInfrastructureFeature(feature)

  return circleMarker(latLng, {
    color: '#ffffff',
    fillColor: type === 'restroom' ? '#7c3aed' : '#0284c7',
    fillOpacity: 1,
    opacity: 1,
    radius: 6,
    weight: 2,
  })
}

export function BikeMap({
  data,
  selectedRoute,
  isRoutesPanelCollapsed,
  onSelectRoute,
  onClearRoute,
  onToggleRoutesPanel,
}: BikeMapProps) {
  const [activeTypes, setActiveTypes] = useState<InfrastructureType[]>(
    ALL_INFRASTRUCTURE_TYPES,
  )
  const [routeFilters, setRouteFilters] = useState<RouteFiltersState>(
    DEFAULT_ROUTE_FILTERS,
  )
  const routableInfrastructureTypes = useMemo(
    () =>
      activeTypes.filter(
        (type): type is 'dedicated' | 'on-road' | 'other' =>
          type === 'dedicated' || type === 'on-road' || type === 'other',
      ),
    [activeTypes],
  )
  const routes = useMemo(
    () =>
      deriveBikeRoutes(data, {
        infrastructureTypes: routableInfrastructureTypes,
        minDistanceKm: routeFilters.minDistanceKm,
        maxDistanceKm: routeFilters.maxDistanceKm,
        roundTrip: routeFilters.roundTrip,
        allowRetracing: routeFilters.allowRetracing,
      }),
    [
      data,
      routeFilters.allowRetracing,
      routeFilters.maxDistanceKm,
      routeFilters.minDistanceKm,
      routeFilters.roundTrip,
      routableInfrastructureTypes,
    ],
  )
  const amenitiesByRoute = useMemo(
    () =>
      Object.fromEntries(
        routes.map((route) => [
          route.id,
          findNearbyAmenities(route, data),
        ]),
      ),
    [data, routes],
  )
  const filteredRoutes = useMemo(
    () => filterRoutes(routes, amenitiesByRoute, routeFilters),
    [amenitiesByRoute, routeFilters, routes],
  )
  const [visibleRoutes, setVisibleRoutes] = useState<BikeRoute[]>(filteredRoutes)
  const activeTypeSet = useMemo(() => new Set(activeTypes), [activeTypes])
  const infrastructureCounts = useMemo(
    () => countInfrastructureTypes(data.features),
    [data],
  )
  const geoJsonKey = activeTypes.join('-') || 'no-infrastructure'
  const visibleRouteIds = new Set(visibleRoutes.map((route) => route.id))
  const displayedRoutes = filteredRoutes.filter((route) =>
    visibleRouteIds.has(route.id),
  )
  const orderedRoutes = selectedRoute
    ? [
        ...displayedRoutes.filter((route) => route.id !== selectedRoute.id),
        selectedRoute,
      ]
    : displayedRoutes
  const toggleInfrastructureType = (type: InfrastructureType) => {
    setActiveTypes((currentTypes) =>
      currentTypes.includes(type)
        ? currentTypes.filter((currentType) => currentType !== type)
        : ALL_INFRASTRUCTURE_TYPES.filter(
            (infrastructureType) =>
              currentTypes.includes(infrastructureType) ||
              infrastructureType === type,
          ),
    )
  }
  const updateVisibleRoutes = useCallback(
    (routeIds: string[]) => {
      const visibleRouteIdSet = new Set(routeIds)
      setVisibleRoutes(
        filteredRoutes.filter((route) => visibleRouteIdSet.has(route.id)),
      )
    },
    [filteredRoutes],
  )

  useEffect(() => {
    if (
      selectedRoute &&
      !filteredRoutes.some((route) => route.id === selectedRoute.id)
    ) {
      onClearRoute()
    }
  }, [filteredRoutes, onClearRoute, selectedRoute])

  return (
    <section
      aria-label="Dan region bike infrastructure map"
      className="relative isolate z-0 min-h-0 w-full flex-1 overflow-hidden bg-stone-200"
    >
      <MapContainer
        center={MAP_CENTER}
        className="absolute inset-0 h-full w-full"
        preferCanvas
        scrollWheelZoom
        zoom={13}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON
          key={geoJsonKey}
          data={data}
          filter={(feature) => {
            const type = classifyInfrastructureFeature(feature)
            return type !== null && activeTypeSet.has(type)
          }}
          onEachFeature={bindFeatureTooltip}
          pointToLayer={createAmenityMarker}
          style={getPathStyle}
        />
        {orderedRoutes.map((route) => {
          const isSelected = route.id === selectedRoute?.id

          return (
            <Polyline
              key={route.id}
              eventHandlers={{ click: () => onSelectRoute(route) }}
              pathOptions={{
                color: isSelected ? '#7c3aed' : '#334155',
                dashArray: isSelected ? undefined : '8 7',
                opacity: isSelected ? 1 : 0.7,
                weight: isSelected ? 7 : 4,
              }}
              positions={route.coordinates}
            >
              <Tooltip direction="top" sticky>
                <strong>{route.title}</strong>
                <br />
                {route.distanceKm} km · {route.difficulty}
              </Tooltip>
            </Polyline>
          )
        })}
        {selectedRoute && (
          <>
            <CircleMarker
              center={selectedRoute.coordinates[0]}
              pathOptions={{
                color: '#ffffff',
                fillColor: '#059669',
                fillOpacity: 1,
                weight: 3,
              }}
              radius={8}
            >
              <Tooltip direction="top">
                {selectedRoute.isRoundTrip ? 'Start & finish' : `Start: ${selectedRoute.startPoint}`}
              </Tooltip>
            </CircleMarker>
            {!selectedRoute.isRoundTrip && (
              <CircleMarker
                center={selectedRoute.coordinates.at(-1) ?? selectedRoute.coordinates[0]}
                pathOptions={{
                  color: '#ffffff',
                  fillColor: '#7c3aed',
                  fillOpacity: 1,
                  weight: 3,
                }}
                radius={8}
              >
                <Tooltip direction="top">Finish: {selectedRoute.endPoint}</Tooltip>
              </CircleMarker>
            )}
          </>
        )}
        <MapViewportController selectedRoute={selectedRoute} />
        <ViewportRouteTracker
          routes={filteredRoutes}
          onVisibleRoutesChange={updateVisibleRoutes}
        />
      </MapContainer>

      <InfrastructureFilters
        activeTypes={activeTypes}
        counts={infrastructureCounts}
        onToggle={toggleInfrastructureType}
      />

      <RoutesPanel
        amenitiesByRoute={amenitiesByRoute}
        filters={routeFilters}
        isCollapsed={isRoutesPanelCollapsed}
        routes={visibleRoutes}
        totalRouteCount={filteredRoutes.length}
        unfilteredRouteCount={routes.length}
        selectedRoute={selectedRoute}
        onClearRoute={onClearRoute}
        onFiltersChange={setRouteFilters}
        onSelectRoute={onSelectRoute}
        onToggle={onToggleRoutesPanel}
      />
    </section>
  )
}

function MapViewportController({
  selectedRoute,
}: {
  selectedRoute: BikeRoute | null
}) {
  const map = useMap()

  useEffect(() => {
    if (!selectedRoute) {
      map.setView(MAP_CENTER, 13, { animate: true })
      return
    }

    const isDesktop = window.matchMedia('(min-width: 640px)').matches
    const bounds = latLngBounds(selectedRoute.coordinates)

    map.fitBounds(bounds, {
      animate: true,
      maxZoom: 15,
      paddingBottomRight: isDesktop ? [390, 32] : [32, 260],
      paddingTopLeft: [32, 32],
    })
  }, [map, selectedRoute])

  return null
}

interface ViewportRouteTrackerProps {
  routes: BikeRoute[]
  onVisibleRoutesChange: (routeIds: string[]) => void
}

function ViewportRouteTracker({
  routes,
  onVisibleRoutesChange,
}: ViewportRouteTrackerProps) {
  const map = useMap()
  const updateVisibleRoutes = useCallback(() => {
    const mapBounds = map.getBounds()
    const routeIds = routes
      .filter((route) => mapBounds.intersects(latLngBounds(route.coordinates)))
      .map((route) => route.id)

    onVisibleRoutesChange(routeIds)
  }, [map, onVisibleRoutesChange, routes])

  useMapEvents({
    moveend: updateVisibleRoutes,
    zoomend: updateVisibleRoutes,
  })

  useEffect(() => {
    updateVisibleRoutes()
  }, [updateVisibleRoutes])

  return null
}
