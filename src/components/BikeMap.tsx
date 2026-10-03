import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Feature, Geometry, Point } from 'geojson'
import type { TFunction } from 'i18next'
import { LoaderCircle, LocateFixed } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  marker,
  divIcon,
  latLngBounds,
  type LatLng,
  type Layer,
  type Marker as LeafletMarker,
  type PathOptions,
} from 'leaflet'
import {
  Circle,
  CircleMarker,
  GeoJSON,
  MapContainer,
  Marker,
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
  buildBikeNetwork,
  coordinateAlongRoute,
  findShortestBikePath,
  snapToBikeNetwork,
  type NetworkSnap,
  type PointToPointRoute,
} from '../utils/pointToPointRouting'
import {
  formatNumber,
  getLocalizedOsmName,
  getRouteLabels,
  getSupportedLanguage,
  translateDifficulty,
} from '../utils/localization'
import type { SupportedLanguage } from '../i18n'
import {
  filterRoutes,
  type RouteFiltersState,
} from '../utils/routeFilters'
import {
  ALL_INFRASTRUCTURE_TYPES,
  classifyInfrastructureFeature,
  countInfrastructureTypes,
  type InfrastructureType,
} from '../utils/infrastructure'
import { InfrastructureFilters } from './InfrastructureFilters'
import {
  PointRoutePlanner,
  type PointRoutePlanningStage,
} from './PointRoutePlanner'
import { RoutesPanel } from './RoutesPanel'

interface BikeMapProps {
  data: BikePathCollection
  selectedRoute: BikeRoute | null
  isRoutesPanelCollapsed: boolean
  routeFilters: RouteFiltersState
  onSelectRoute: (route: BikeRoute) => void
  onClearRoute: () => void
  onRouteFiltersChange: (filters: RouteFiltersState) => void
  onToggleRoutesPanel: () => void
}

const START_MAX_SNAP_METERS = 700

const MAP_CENTER: [number, number] = [32.078, 34.781]
const ROUTE_DRAG_HANDLE_ICON = divIcon({
  className: 'route-drag-handle',
  html: '',
  iconAnchor: [14, 14],
  iconSize: [28, 28],
})

const ENDPOINT_ICONS = {
  start: divIcon({ className: 'route-endpoint route-endpoint--start', html: '', iconSize: [26, 26], iconAnchor: [13, 13] }),
  end: divIcon({ className: 'route-endpoint route-endpoint--end', html: '', iconSize: [26, 26], iconAnchor: [13, 13] }),
}

interface CurrentLocation {
  latitude: number
  longitude: number
  accuracyMeters: number
}

type LocationStatus = 'idle' | 'loading' | 'ready' | 'error'

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
  t: TFunction,
  language: SupportedLanguage,
) {
  const properties = feature.properties ?? {}
  const infrastructureType = classifyInfrastructureFeature(feature)
  const isWater = infrastructureType === 'fountain'
  const isRestroom = infrastructureType === 'restroom'
  const name =
    getLocalizedOsmName(properties, language) ??
    (isWater
      ? t('amenities.drinkingWater')
      : isRestroom
        ? t('amenities.publicRestroom')
        : t('map.unnamedPath'))
  const tooltip = document.createElement('div')
  const title = document.createElement('strong')
  const typeLabel = document.createElement('span')

  title.textContent = name
  const layerKey =
    infrastructureType === 'dedicated'
      ? 'layers.dedicated'
      : infrastructureType === 'on-road'
        ? 'layers.onRoad'
        : infrastructureType === 'other'
          ? 'layers.other'
          : infrastructureType === 'fountain'
            ? 'layers.fountain'
            : infrastructureType === 'restroom'
              ? 'layers.restroom'
              : 'map.bikeInfrastructure'
  typeLabel.textContent = t(layerKey)
  typeLabel.className = 'bike-path-tooltip__type'
  tooltip.className = 'bike-path-tooltip'
  tooltip.append(title, typeLabel)

  layer.bindTooltip(tooltip, {
    direction: 'top',
    opacity: 0.97,
    sticky: true,
  })
}

const AMENITY_ICONS = {
  fountain: divIcon({
    className: 'amenity-marker amenity-marker--water',
    html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c-2.5 3.5-7 7.9-7 12a7 7 0 0 0 14 0c0-4.1-4.5-8.5-7-12Z"/><path d="M8 15a4 4 0 0 0 4 4"/></svg>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    tooltipAnchor: [0, -16],
  }),
  restroom: divIcon({
    className: 'amenity-marker amenity-marker--restroom',
    html: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="6" cy="4" r="2"/><circle cx="18" cy="4" r="2"/><path d="M3 7h6v7H8v7H6.5v-7h-1v7H4v-7H3V7Zm13 0h4l3 9h-3v5h-1.5v-5h-1v5H16v-5h-3l3-9Z"/><path d="M11.5 2h1v20h-1z"/></svg>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    tooltipAnchor: [0, -16],
  }),
}

function createAmenityMarker(
  feature: Feature<Point, BikePathProperties>,
  latLng: LatLng,
  t: TFunction,
) {
  const isRestroom = classifyInfrastructureFeature(feature) === 'restroom'
  const label = t(isRestroom ? 'amenities.publicRestroom' : 'amenities.drinkingWater')
  return marker(latLng, {
    icon: isRestroom ? AMENITY_ICONS.restroom : AMENITY_ICONS.fountain,
    alt: label,
    title: label,
    keyboard: true,
    riseOnHover: true,
  })
}

export function BikeMap({
  data,
  selectedRoute,
  isRoutesPanelCollapsed,
  routeFilters,
  onSelectRoute,
  onClearRoute,
  onRouteFiltersChange,
  onToggleRoutesPanel,
}: BikeMapProps) {
  const { t, i18n } = useTranslation()
  const language = getSupportedLanguage(i18n.resolvedLanguage ?? i18n.language)
  const [activeTypes, setActiveTypes] = useState<InfrastructureType[]>(
    ALL_INFRASTRUCTURE_TYPES,
  )
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(
    null,
  )
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle')
  const [locationErrorKey, setLocationErrorKey] = useState<string | null>(null)
  const [locationFocusRequest, setLocationFocusRequest] = useState(0)
  const [planningStage, setPlanningStage] =
    useState<PointRoutePlanningStage>('inactive')
  const [plannedStart, setPlannedStart] = useState<NetworkSnap | null>(null)
  const [plannedEnd, setPlannedEnd] = useState<NetworkSnap | null>(null)
  const [pointToPointRoute, setPointToPointRoute] =
    useState<PointToPointRoute | null>(null)
  const [dragRoutePreview, setDragRoutePreview] = useState<PointToPointRoute | null>(null)
  const previewFrame = useRef<number | null>(null)
  const [routeViaPoint, setRouteViaPoint] = useState<NetworkSnap | null>(null)
  const [dragHandleRevision, setDragHandleRevision] = useState(0)
  const [pointRouteErrorKey, setPointRouteErrorKey] = useState<string | null>(
    null,
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
  const bikeNetwork = useMemo(
    () => buildBikeNetwork(data, routableInfrastructureTypes),
    [data, routableInfrastructureTypes],
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
  const geoJsonKey = `${activeTypes.join('-') || 'no-infrastructure'}-${language}`
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
  const displayedPointRoute = dragRoutePreview ?? pointToPointRoute
  const routeDragHandlePosition = pointToPointRoute
    ? routeViaPoint?.coordinate ??
      coordinateAlongRoute(pointToPointRoute.coordinates, 0.5)
    : null
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
  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      setLocationErrorKey('map.locationNotSupported')
      return
    }

    setLocationStatus('loading')
    setLocationErrorKey(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
        })
        setLocationStatus('ready')
        setLocationFocusRequest((request) => request + 1)
      },
      (error) => {
        const errorKey =
          error.code === error.PERMISSION_DENIED
            ? 'map.locationPermissionDenied'
            : error.code === error.POSITION_UNAVAILABLE
              ? 'map.locationUnavailable'
              : error.code === error.TIMEOUT
                ? 'map.locationTimeout'
                : 'map.locationError'
        setLocationStatus('error')
        setLocationErrorKey(errorKey)
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 10_000 },
    )
  }
  const activatePointRoutePlanning = () => {
    onClearRoute()
    setPlannedStart(null)
    setPlannedEnd(null)
    setPointToPointRoute(null)
    setRouteViaPoint(null)
    setPointRouteErrorKey(null)
    setPlanningStage('start')
  }
  const cancelPointRoutePlanning = () => {
    setPlanningStage('inactive')
    setPlannedStart(null)
    setPlannedEnd(null)
    setPointToPointRoute(null)
    setRouteViaPoint(null)
    setPointRouteErrorKey(null)
  }
  const startPointRouteOver = () => {
    setPlannedStart(null)
    setPlannedEnd(null)
    setPointToPointRoute(null)
    setRouteViaPoint(null)
    setPointRouteErrorKey(null)
    setPlanningStage('start')
  }
  const selectPointRouteCoordinate = useCallback(
    (coordinate: [number, number]) => {
      if (planningStage !== 'start' && planningStage !== 'end') return
      const snap = snapToBikeNetwork(
        bikeNetwork,
        coordinate,
        planningStage === 'start' ? START_MAX_SNAP_METERS : undefined,
      )
      if (!snap) {
        setPointRouteErrorKey(
          bikeNetwork.nodes.length === 0
            ? 'pointRoute.noInfrastructure'
            : planningStage === 'start'
              ? 'pointRoute.startTooFar'
              : 'pointRoute.pointTooFar',
        )
        return
      }

      if (planningStage === 'start') {
        setPlannedStart(snap)
        setPlannedEnd(null)
        setPointToPointRoute(null)
        setRouteViaPoint(null)
        setPointRouteErrorKey(null)
        setPlanningStage('end')
        return
      }

      if (!plannedStart) {
        setPlanningStage('start')
        return
      }
      const route = findShortestBikePath(
        bikeNetwork,
        plannedStart.nodeId,
        snap.nodeId,
      )
      if (!route || route.distanceKm < 0.01) {
        setPointRouteErrorKey(
          route ? 'pointRoute.pointsTooClose' : 'pointRoute.noConnectedRoute',
        )
        return
      }

      setPlannedEnd(snap)
      setPointToPointRoute(route)
      setRouteViaPoint(null)
      setPointRouteErrorKey(null)
      setPlanningStage('complete')
    },
    [bikeNetwork, plannedStart, planningStage],
  )
  const detourCache = useRef<{
    network: unknown
    start: NetworkSnap
    end: NetworkSnap
    nodeId: number
    route: PointToPointRoute | null
  } | null>(null)
  const calculateDetour = useCallback((coordinate: [number, number]):
    { error: string } | { route: PointToPointRoute; snap: NetworkSnap } => {
      const snap = snapToBikeNetwork(bikeNetwork, coordinate)
      if (!snap) return { error: 'pointRoute.dragTooFar' } as const
      if (!plannedStart || !plannedEnd) return { error: 'pointRoute.noConnectedDetour' } as const
      if (detourCache.current?.network !== bikeNetwork || detourCache.current?.start !== plannedStart || detourCache.current?.end !== plannedEnd || detourCache.current?.nodeId !== snap.nodeId) {
        const firstLeg = findShortestBikePath(bikeNetwork, plannedStart.nodeId, snap.nodeId)
        const secondLeg = findShortestBikePath(bikeNetwork, snap.nodeId, plannedEnd.nodeId)
        const route = firstLeg && secondLeg ? {
          coordinates: [...firstLeg.coordinates, ...secondLeg.coordinates.slice(1)],
          distanceKm: firstLeg.distanceKm + secondLeg.distanceKm,
        } : null
        detourCache.current = { network: bikeNetwork, start: plannedStart, end: plannedEnd, nodeId: snap.nodeId, route }
      }
      const cachedRoute = detourCache.current?.route
      if (!cachedRoute) return { error: 'pointRoute.noConnectedDetour' } as const
      return { route: cachedRoute, snap }
  }, [bikeNetwork, plannedStart, plannedEnd])
  const previewRouteThroughCoordinate = useCallback((coordinate: [number, number] | null) => {
    if (previewFrame.current !== null) cancelAnimationFrame(previewFrame.current)
    previewFrame.current = null
    if (!coordinate) {
      setDragRoutePreview(null)
      return
    }
    previewFrame.current = requestAnimationFrame(() => {
      previewFrame.current = null
      const result = calculateDetour(coordinate)
      setDragRoutePreview('route' in result ? result.route : null)
    })
  }, [calculateDetour])
  useEffect(() => () => {
    if (previewFrame.current !== null) cancelAnimationFrame(previewFrame.current)
  }, [])
  const rerouteThroughCoordinate = useCallback((coordinate: [number, number]) => {
    previewRouteThroughCoordinate(null)
    const result = calculateDetour(coordinate)
    if ('error' in result) {
      setPointRouteErrorKey(result.error)
    } else {
      setPointToPointRoute(result.route)
      setRouteViaPoint(result.snap)
      setPointRouteErrorKey(null)
    }
    setDragHandleRevision((revision) => revision + 1)
  }, [calculateDetour, previewRouteThroughCoordinate])
  const calculateEndpointRoute = (endpoint: 'start' | 'end', coordinate: [number, number]):
    { error: string } | { route: PointToPointRoute; snap: NetworkSnap } => {
    const snap = snapToBikeNetwork(bikeNetwork, coordinate,
      endpoint === 'start' ? START_MAX_SNAP_METERS : undefined)
    if (!snap) return { error: endpoint === 'start' ? 'pointRoute.startTooFar' : 'pointRoute.pointTooFar' }
    const start = endpoint === 'start' ? snap : plannedStart
    const end = endpoint === 'end' ? snap : plannedEnd
    if (!start || !end) return { error: 'pointRoute.endpointUnavailable' }
    const waypoints = routeViaPoint ? [start, routeViaPoint, end] : [start, end]
    const legs = waypoints.slice(1).map((point, index) =>
      findShortestBikePath(bikeNetwork, waypoints[index].nodeId, point.nodeId))
    if (legs.some((leg) => !leg)) return { error: 'pointRoute.endpointUnavailable' }
    const route = {
      coordinates: legs.flatMap((leg, index) => index === 0 ? leg!.coordinates : leg!.coordinates.slice(1)),
      distanceKm: legs.reduce((total, leg) => total + leg!.distanceKm, 0),
    }
    if (route.distanceKm < 0.01) return { error: 'pointRoute.pointsTooClose' }
    return { route, snap }
  }
  const previewEndpoint = (endpoint: 'start' | 'end', coordinate: [number, number]) => {
    if (previewFrame.current !== null) cancelAnimationFrame(previewFrame.current)
    previewFrame.current = requestAnimationFrame(() => {
      previewFrame.current = null
      const result = calculateEndpointRoute(endpoint, coordinate)
      setDragRoutePreview('route' in result ? result.route : null)
    })
  }
  const moveEndpoint = (endpoint: 'start' | 'end', coordinate: [number, number]) => {
    previewRouteThroughCoordinate(null)
    const result = calculateEndpointRoute(endpoint, coordinate)
    if ('error' in result) {
      setPointRouteErrorKey(result.error)
    } else {
      if (endpoint === 'start') setPlannedStart(result.snap)
      else setPlannedEnd(result.snap)
      setPointToPointRoute(result.route)
      setPointRouteErrorKey(null)
    }
    setDragHandleRevision((revision) => revision + 1)
  }
  const changePointRouteDestination = () => {
    previewRouteThroughCoordinate(null)
    setPlannedEnd(null)
    setPointToPointRoute(null)
    setRouteViaPoint(null)
    setPointRouteErrorKey(null)
    setPlanningStage(plannedStart ? 'end' : 'start')
  }
  const removeRouteViaPoint = () => {
    if (!plannedStart || !plannedEnd) return
    const directRoute = findShortestBikePath(
      bikeNetwork,
      plannedStart.nodeId,
      plannedEnd.nodeId,
    )
    if (!directRoute) return
    setPointToPointRoute(directRoute)
    setRouteViaPoint(null)
    setPointRouteErrorKey(null)
    setDragHandleRevision((revision) => revision + 1)
  }

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
      aria-label={t('map.ariaLabel')}
      className={`relative isolate z-0 min-h-0 w-full flex-1 overflow-hidden bg-stone-200 dark:bg-slate-900 ${
        planningStage === 'start' || planningStage === 'end'
          ? 'route-point-selection'
          : ''
      }`}
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
          onEachFeature={(feature, layer) =>
            bindFeatureTooltip(feature, layer, t, language)
          }
          pointToLayer={(feature, latLng) => createAmenityMarker(feature, latLng, t)}
          style={getPathStyle}
        />
        {(planningStage === 'inactive' ? orderedRoutes : []).map((route) => {
          const isSelected = route.id === selectedRoute?.id
          const labels = getRouteLabels(route, t)

          return (
            <Polyline
              key={route.id}
              eventHandlers={
                planningStage === 'inactive'
                  ? { click: () => onSelectRoute(route) }
                  : undefined
              }
              pathOptions={{
                color: isSelected ? '#7c3aed' : '#334155',
                dashArray: isSelected ? undefined : '8 7',
                opacity: isSelected ? 1 : 0.7,
                weight: isSelected ? 7 : 4,
              }}
              positions={route.coordinates}
            >
              <Tooltip direction="top" sticky>
                <strong>{labels.title}</strong>
                <br />
                {t('units.kilometers', {
                  value: formatNumber(route.distanceKm, language),
                })}{' '}
                · {translateDifficulty(route.difficulty, t)}
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
                {selectedRoute.isRoundTrip
                  ? t('map.startAndFinish')
                  : t('map.start', {
                      point: getRouteLabels(selectedRoute, t).startPoint,
                    })}
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
                <Tooltip direction="top">
                  {t('map.finish', {
                    point: getRouteLabels(selectedRoute, t).endPoint,
                  })}
                </Tooltip>
              </CircleMarker>
            )}
          </>
        )}
        {displayedPointRoute && (
          <Polyline
            pathOptions={{
              color: '#e11d48',
              opacity: 1,
              weight: 7,
            }}
            positions={displayedPointRoute.coordinates}
          >
            <Tooltip direction="top" sticky>
              <strong>{t('pointRoute.yourRoute')}</strong>
              <br />
              {t('units.kilometers', {
                value: formatNumber(displayedPointRoute.distanceKm, language, 2),
              })}
            </Tooltip>
          </Polyline>
        )}
        {(['start', 'end'] as const).map((endpoint) => {
          const point = endpoint === 'start' ? plannedStart : plannedEnd
          const label = t(endpoint === 'start' ? 'pointRoute.start' : 'pointRoute.destination')
          const dragLabel = t(endpoint === 'start' ? 'pointRoute.dragStart' : 'pointRoute.dragDestination')
          return point && (
            <Marker
              key={`${endpoint}-${dragHandleRevision}`}
              position={point.coordinate}
              icon={ENDPOINT_ICONS[endpoint]}
              draggable={planningStage === 'complete'}
              alt={label}
              title={planningStage === 'complete' ? dragLabel : label}
              eventHandlers={{
                drag: (event) => {
                  const coordinate = (event.target as LeafletMarker).getLatLng()
                  previewEndpoint(endpoint, [coordinate.lat, coordinate.lng])
                },
                dragend: (event) => {
                  const coordinate = (event.target as LeafletMarker).getLatLng()
                  moveEndpoint(endpoint, [coordinate.lat, coordinate.lng])
                },
              }}
            >
              <Tooltip direction="top">{planningStage === 'complete' ? dragLabel : label}</Tooltip>
            </Marker>
          )
        })}
        {planningStage === 'complete' && routeDragHandlePosition && (
          <Marker
            key={`route-drag-handle-${dragHandleRevision}`}
            alt={t('pointRoute.dragHandle')}
            draggable
            icon={ROUTE_DRAG_HANDLE_ICON}
            keyboard
            position={routeDragHandlePosition}
            title={t('pointRoute.dragHandle')}
            eventHandlers={{
              drag: (event) => {
                const coordinate = (event.target as LeafletMarker).getLatLng()
                previewRouteThroughCoordinate([coordinate.lat, coordinate.lng])
              },
              dragend: (event) => {
                const marker = event.target as LeafletMarker
                const coordinate = marker.getLatLng()
                rerouteThroughCoordinate([coordinate.lat, coordinate.lng])
              },
            }}
          >
            <Tooltip direction="top">{t('pointRoute.dragHandle')}</Tooltip>
          </Marker>
        )}
        {currentLocation && (
          <>
            <Circle
              center={[currentLocation.latitude, currentLocation.longitude]}
              interactive={false}
              pathOptions={{
                color: '#0284c7',
                fillColor: '#38bdf8',
                fillOpacity: 0.12,
                opacity: 0.35,
                weight: 1,
              }}
              radius={currentLocation.accuracyMeters}
            />
            <CircleMarker
              center={[currentLocation.latitude, currentLocation.longitude]}
              pathOptions={{
                color: '#ffffff',
                fillColor: '#0284c7',
                fillOpacity: 1,
                weight: 3,
              }}
              radius={8}
            >
              <Tooltip direction="top">
                <strong>{t('map.yourLocation')}</strong>
                <br />
                {t('map.locationAccuracy', {
                  value: formatNumber(
                    Math.round(currentLocation.accuracyMeters),
                    language,
                    0,
                  ),
                })}
              </Tooltip>
            </CircleMarker>
          </>
        )}
        <MapViewportController selectedRoute={selectedRoute} />
        <CurrentLocationViewportController
          focusRequest={locationFocusRequest}
          location={currentLocation}
        />
        <PointRouteViewportController route={pointToPointRoute} />
        {pointToPointRoute && planningStage === 'complete' && (
          <RouteDragController
            route={pointToPointRoute}
            onDrop={rerouteThroughCoordinate}
            onPreview={previewRouteThroughCoordinate}
          />
        )}
        <PointSelectionHandler
          enabled={planningStage === 'start' || planningStage === 'end'}
          onSelect={selectPointRouteCoordinate}
        />
        <ViewportRouteTracker
          routes={filteredRoutes}
          onVisibleRoutesChange={updateVisibleRoutes}
        />
      </MapContainer>

      <button
        aria-label={t(
          locationStatus === 'loading' ? 'map.locating' : 'map.locateMe',
        )}
        className="absolute left-14 top-3 z-[1200] inline-flex h-10 items-center gap-2 rounded-xl border border-white/70 bg-white/95 px-3 text-sm font-extrabold text-slate-700 shadow-lg backdrop-blur transition hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-wait disabled:opacity-70 dark:border-slate-700/80 dark:bg-slate-900/95 dark:text-slate-200 dark:hover:text-emerald-300"
        disabled={locationStatus === 'loading'}
        title={t(locationStatus === 'loading' ? 'map.locating' : 'map.locateMe')}
        type="button"
        onClick={requestCurrentLocation}
      >
        {locationStatus === 'loading' ? (
          <LoaderCircle aria-hidden="true" className="animate-spin" size={18} />
        ) : (
          <LocateFixed aria-hidden="true" size={18} />
        )}
        <span className="hidden sm:inline">
          {t(locationStatus === 'loading' ? 'map.locating' : 'map.locateMe')}
        </span>
      </button>

      {locationErrorKey && (
        <p
          className="absolute left-28 top-3 z-[1200] max-w-[calc(100%-8rem)] rounded-xl border border-rose-200 bg-white/95 px-3 py-2 text-xs font-bold leading-5 text-rose-700 shadow-lg backdrop-blur dark:border-rose-900 dark:bg-slate-900/95 dark:text-rose-300 sm:left-48"
          role="alert"
        >
          {t(locationErrorKey)}
        </p>
      )}
      <p aria-live="polite" className="sr-only">
        {locationStatus === 'ready' ? t('map.locationFound') : ''}
      </p>

      <PointRoutePlanner
        distanceKm={displayedPointRoute?.distanceKm ?? null}
        errorKey={pointRouteErrorKey}
        hasViaPoint={routeViaPoint !== null}
        stage={planningStage}
        onActivate={activatePointRoutePlanning}
        onCancel={cancelPointRoutePlanning}
        onRemoveViaPoint={removeRouteViaPoint}
        onStartOver={startPointRouteOver}
        onChangeDestination={changePointRouteDestination}
      />

      {planningStage === 'inactive' && (
        <>
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
            onFiltersChange={onRouteFiltersChange}
            onSelectRoute={onSelectRoute}
            onToggle={onToggleRoutesPanel}
          />
        </>
      )}
    </section>
  )
}

function CurrentLocationViewportController({
  location,
  focusRequest,
}: {
  location: CurrentLocation | null
  focusRequest: number
}) {
  const map = useMap()

  useEffect(() => {
    if (!location || focusRequest === 0) return
    map.setView([location.latitude, location.longitude], Math.max(map.getZoom(), 16), {
      animate: true,
    })
  }, [focusRequest, location, map])

  return null
}

function PointRouteViewportController({
  route,
}: {
  route: PointToPointRoute | null
}) {
  const map = useMap()

  useEffect(() => {
    if (!route || route.coordinates.length < 2) return
    map.fitBounds(latLngBounds(route.coordinates), {
      animate: true,
      maxZoom: 17,
      padding: [48, 48],
      paddingTopLeft: [48, 140],
    })
  }, [map, route])

  return null
}

function PointSelectionHandler({
  enabled,
  onSelect,
}: {
  enabled: boolean
  onSelect: (coordinate: [number, number]) => void
}) {
  useMapEvents({
    click: (event) => {
      if (enabled) onSelect([event.latlng.lat, event.latlng.lng])
    },
  })
  return null
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

/** Capture route gestures before Leaflet starts panning (including touch gestures). */
function RouteDragController({
  route,
  onDrop,
  onPreview,
}: {
  route: PointToPointRoute
  onDrop: (coordinate: [number, number]) => void
  onPreview: (coordinate: [number, number] | null) => void
}) {
  const map = useMap()
  const [preview, setPreview] = useState<[number, number] | null>(null)

  useEffect(() => {
    const container = map.getContainer()
    let gesture: { pointerId: number; x: number; y: number } | null = null
    let restoreDragging = false
    let restoreTouchZoom = false

    const finish = () => {
      gesture = null
      if (restoreDragging) map.dragging.enable()
      if (restoreTouchZoom) map.touchZoom.enable()
      restoreDragging = false
      restoreTouchZoom = false
      setPreview(null)
      onPreview(null)
    }
    const start = (event: PointerEvent) => {
      if (gesture || !event.isPrimary || event.button !== 0) return
      if (event.target instanceof Element &&
        event.target.closest('.leaflet-marker-icon, .leaflet-control')) return
      const point = map.mouseEventToContainerPoint(event)
      const points = route.coordinates.map((coordinate) =>
        map.latLngToContainerPoint(coordinate),
      )
      const hitsRoute = points.slice(1).some((end, index) => {
        const startPoint = points[index]
        const dx = end.x - startPoint.x
        const dy = end.y - startPoint.y
        const lengthSquared = dx * dx + dy * dy
        const fraction = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1,
          ((point.x - startPoint.x) * dx + (point.y - startPoint.y) * dy) / lengthSquared,
        ))
        return Math.hypot(point.x - startPoint.x - fraction * dx,
          point.y - startPoint.y - fraction * dy) <= 12
      })
      if (!hitsRoute) return
      gesture = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
      restoreDragging = map.dragging.enabled()
      restoreTouchZoom = map.touchZoom.enabled()
      map.dragging.disable()
      map.touchZoom.disable()
      container.setPointerCapture(event.pointerId)
      event.preventDefault()
      event.stopPropagation()
    }
    const move = (event: PointerEvent) => {
      if (gesture?.pointerId !== event.pointerId) return
      const coordinate = map.mouseEventToLatLng(event)
      setPreview([coordinate.lat, coordinate.lng])
      onPreview([coordinate.lat, coordinate.lng])
      event.preventDefault()
      event.stopPropagation()
    }
    const end = (event: PointerEvent) => {
      if (gesture?.pointerId !== event.pointerId) return
      const moved = Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 5
      const coordinate = map.mouseEventToLatLng(event)
      finish()
      if (container.hasPointerCapture(event.pointerId)) container.releasePointerCapture(event.pointerId)
      event.preventDefault()
      event.stopPropagation()
      if (moved) onDrop([coordinate.lat, coordinate.lng])
    }
    const cancel = () => finish()
    container.addEventListener('pointerdown', start, true)
    container.addEventListener('pointermove', move, true)
    container.addEventListener('pointerup', end, true)
    container.addEventListener('pointercancel', cancel)
    container.addEventListener('lostpointercapture', cancel)
    return () => {
      container.removeEventListener('pointerdown', start, true)
      container.removeEventListener('pointermove', move, true)
      container.removeEventListener('pointerup', end, true)
      container.removeEventListener('pointercancel', cancel)
      container.removeEventListener('lostpointercapture', cancel)
      if (gesture && container.hasPointerCapture(gesture.pointerId)) {
        container.releasePointerCapture(gesture.pointerId)
      }
      finish()
    }
  }, [map, onDrop, onPreview, route])

  return preview ? (
    <CircleMarker
      center={preview}
      interactive={false}
      radius={10}
      pathOptions={{ color: '#e11d48', fillColor: '#ffffff', fillOpacity: 1, weight: 3 }}
    />
  ) : null
}
