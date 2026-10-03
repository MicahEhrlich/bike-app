import type { Geometry, LineString, MultiLineString } from 'geojson'
import type { BikePathCollection, BikePathProperties } from '../utils/loadBikeData'
import {
  classifyInfrastructureFeature,
  type InfrastructureType,
} from '../utils/infrastructure'

export type RouteDifficulty = 'Easy' | 'Moderate' | 'Hard'
export type RouteCity = 'Tel Aviv' | 'Ramat Gan' | 'Givatayim'
export type RouteKind = 'standard' | 'round' | 'out-and-back'
export type RouteCoordinate = [latitude: number, longitude: number]

export interface BikeRoute {
  id: string
  routeNumber: number
  routeKind: RouteKind
  cities: RouteCity[]
  distanceKm: number
  continuityScore: number
  difficulty: RouteDifficulty
  coordinates: RouteCoordinate[]
  source: 'OpenStreetMap'
  sourceFeatureCount: number
  isRoundTrip: boolean
  usesRepeatedSegments: boolean
}

interface PathSegment {
  coordinates: RouteCoordinate[]
  dedicated: boolean
  lengthKm: number
}

interface RouteChain {
  coordinates: RouteCoordinate[]
  segments: PathSegment[]
  usesRepeatedSegments?: boolean
}

interface GraphEdge extends PathSegment {
  id: number
  startNode: number
  endNode: number
}

interface GraphNode {
  coordinate: RouteCoordinate
  edges: number[]
}

const CONNECTION_TOLERANCE_METERS = 5
const MIN_ROUTE_LENGTH_KM = 0.1
const DEFAULT_MAX_GENERATED_ROUTE_KM = 3

type RoutableInfrastructureType = Exclude<
  InfrastructureType,
  'fountain' | 'restroom'
>

export interface RouteGenerationOptions {
  minDistanceKm?: number | null
  maxDistanceKm?: number | null
  infrastructureTypes?: RoutableInfrastructureType[]
  roundTrip?: boolean
  allowRetracing?: boolean
}

function distanceKm(first: RouteCoordinate, second: RouteCoordinate): number {
  const earthRadiusKm = 6_371
  const firstLatitude = (first[0] * Math.PI) / 180
  const secondLatitude = (second[0] * Math.PI) / 180
  const latitudeDelta = ((second[0] - first[0]) * Math.PI) / 180
  const longitudeDelta = ((second[1] - first[1]) * Math.PI) / 180
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2

  return earthRadiusKm * 2 * Math.asin(Math.sqrt(haversine))
}

function pathLengthKm(coordinates: RouteCoordinate[]): number {
  return coordinates.slice(1).reduce(
    (total, coordinate, index) =>
      total + distanceKm(coordinates[index], coordinate),
    0,
  )
}

function coordinatesConnect(
  first: RouteCoordinate,
  second: RouteCoordinate,
): boolean {
  return distanceKm(first, second) * 1_000 <= CONNECTION_TOLERANCE_METERS
}

function isDedicated(properties: BikePathProperties): boolean {
  return (
    properties.highway === 'cycleway' ||
    properties.highway === 'path' ||
    properties.highway === 'footway' ||
    properties.cycleway === 'track'
  )
}

function geometryToSegments(
  geometry: Geometry,
  properties: BikePathProperties,
): PathSegment[] {
  const lines =
    geometry.type === 'LineString'
      ? [(geometry as LineString).coordinates]
      : geometry.type === 'MultiLineString'
        ? (geometry as MultiLineString).coordinates
        : []

  return lines
    .map((line) =>
      line.map(
        ([longitude, latitude]): RouteCoordinate => [latitude, longitude],
      ),
    )
    .filter((line) => line.length >= 2)
    .map((coordinates) => ({
      coordinates,
      dedicated: isDedicated(properties),
      lengthKm: pathLengthKm(coordinates),
    }))
}

function buildConnectedChains(segments: PathSegment[]): RouteChain[] {
  const unused = [...segments]
  const chains: RouteChain[] = []

  while (unused.length > 0) {
    const initialSegment = unused.shift()
    if (!initialSegment) break

    const chain: RouteChain = {
      coordinates: [...initialSegment.coordinates],
      segments: [initialSegment],
    }
    let attachedSegment = true

    while (attachedSegment) {
      attachedSegment = false
      const chainStart = chain.coordinates[0]
      const chainEnd = chain.coordinates.at(-1) ?? chainStart

      for (let index = 0; index < unused.length; index += 1) {
        const segment = unused[index]
        const segmentStart = segment.coordinates[0]
        const segmentEnd = segment.coordinates.at(-1) ?? segmentStart
        let nextCoordinates: RouteCoordinate[] | null = null

        if (coordinatesConnect(chainEnd, segmentStart)) {
          nextCoordinates = [...chain.coordinates, ...segment.coordinates]
        } else if (coordinatesConnect(chainEnd, segmentEnd)) {
          nextCoordinates = [
            ...chain.coordinates,
            ...[...segment.coordinates].reverse(),
          ]
        } else if (coordinatesConnect(chainStart, segmentEnd)) {
          nextCoordinates = [
            ...segment.coordinates,
            ...chain.coordinates,
          ]
        } else if (coordinatesConnect(chainStart, segmentStart)) {
          nextCoordinates = [
            ...[...segment.coordinates].reverse(),
            ...chain.coordinates,
          ]
        }

        if (nextCoordinates) {
          chain.coordinates = nextCoordinates
          chain.segments.push(segment)
          unused.splice(index, 1)
          attachedSegment = true
          break
        }
      }
    }

    chains.push(chain)
  }

  return chains
}

function buildInfrastructureGraph(segments: PathSegment[]) {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  const findOrCreateNode = (coordinate: RouteCoordinate) => {
    const existingIndex = nodes.findIndex(
      (node) =>
        distanceKm(node.coordinate, coordinate) * 1_000 <=
        CONNECTION_TOLERANCE_METERS,
    )
    if (existingIndex >= 0) return existingIndex

    nodes.push({ coordinate, edges: [] })
    return nodes.length - 1
  }

  segments.forEach((segment, id) => {
    const startNode = findOrCreateNode(segment.coordinates[0])
    const endNode = findOrCreateNode(
      segment.coordinates.at(-1) ?? segment.coordinates[0],
    )
    const edge: GraphEdge = { ...segment, id, startNode, endNode }
    edges.push(edge)
    nodes[startNode].edges.push(id)
    nodes[endNode].edges.push(id)
  })

  return { nodes, edges }
}

interface OrientedEdge {
  edge: GraphEdge
  fromNode: number
  toNode: number
}

function orientEdge(
  edge: GraphEdge,
  fromNode: number,
  toNode: number,
): RouteCoordinate[] {
  return edge.startNode === fromNode && edge.endNode === toNode
    ? edge.coordinates
    : [...edge.coordinates].reverse()
}

function combineOrientedEdges(steps: OrientedEdge[]): RouteCoordinate[] {
  const coordinates: RouteCoordinate[] = []

  for (const step of steps) {
    const nextCoordinates = orientEdge(step.edge, step.fromNode, step.toNode)
    if (coordinates.length === 0) {
      coordinates.push(...nextCoordinates)
      continue
    }

    const previous = coordinates.at(-1) ?? nextCoordinates[0]
    const next = nextCoordinates[0]
    coordinates.push(
      ...(coordinatesConnect(previous, next)
        ? nextCoordinates.slice(1)
        : nextCoordinates),
    )
  }

  const first = coordinates[0]
  const last = coordinates.at(-1)
  if (first && last && distanceKm(first, last) > 0) coordinates.push(first)
  return coordinates
}

function findTreePath(
  startNode: number,
  endNode: number,
  parentNode: number[],
  parentEdge: number[],
  edges: GraphEdge[],
): OrientedEdge[] {
  const startAncestors = new Map<number, number>()
  const startSteps: OrientedEdge[] = []
  let current = startNode

  while (current >= 0) {
    startAncestors.set(current, startSteps.length)
    const parent = parentNode[current]
    if (parent === undefined || parent < 0) break
    startSteps.push({
      edge: edges[parentEdge[current]],
      fromNode: current,
      toNode: parent,
    })
    current = parent
  }

  const endSteps: OrientedEdge[] = []
  current = endNode
  while (!startAncestors.has(current)) {
    const parent = parentNode[current]
    if (parent === undefined || parent < 0) return []
    endSteps.push({
      edge: edges[parentEdge[current]],
      fromNode: current,
      toNode: parent,
    })
    current = parent
  }

  const stepsToCommonAncestor = startAncestors.get(current) ?? 0
  const reversedEndSteps = endSteps.reverse().map((step) => ({
    edge: step.edge,
    fromNode: step.toNode,
    toNode: step.fromNode,
  }))
  return [...startSteps.slice(0, stepsToCommonAncestor), ...reversedEndSteps]
}

function buildRoundTripChains(segments: PathSegment[]): RouteChain[] {
  const { nodes, edges } = buildInfrastructureGraph(segments)
  const visited = new Set<number>()
  const parentNode = Array<number>(nodes.length).fill(-1)
  const parentEdge = Array<number>(nodes.length).fill(-1)
  const nonTreeEdges = new Set<number>()

  nodes.forEach((_node, rootNode) => {
    if (visited.has(rootNode)) return
    visited.add(rootNode)
    const queue = [rootNode]

    while (queue.length > 0) {
      const nodeId = queue.shift()
      if (nodeId === undefined) break

      for (const edgeId of nodes[nodeId].edges) {
        const edge = edges[edgeId]
        const nextNode =
          edge.startNode === nodeId ? edge.endNode : edge.startNode

        if (!visited.has(nextNode)) {
          visited.add(nextNode)
          parentNode[nextNode] = nodeId
          parentEdge[nextNode] = edgeId
          queue.push(nextNode)
        } else if (
          parentEdge[nodeId] !== edgeId &&
          parentEdge[nextNode] !== edgeId
        ) {
          nonTreeEdges.add(edgeId)
        }
      }
    }
  })

  return [...nonTreeEdges].flatMap((edgeId): RouteChain[] => {
    const closingEdge = edges[edgeId]
    if (closingEdge.startNode === closingEdge.endNode) return []

    const treePath = findTreePath(
      closingEdge.startNode,
      closingEdge.endNode,
      parentNode,
      parentEdge,
      edges,
    )
    if (treePath.length === 0) return []

    const steps = [
      ...treePath,
      {
        edge: closingEdge,
        fromNode: closingEdge.endNode,
        toNode: closingEdge.startNode,
      },
    ]

    return [
      {
        coordinates: combineOrientedEdges(steps),
        segments: steps.map((step) => step.edge),
      },
    ]
  })
}

function buildRetracedRoundTripChains(
  segments: PathSegment[],
  maxRoundTripDistanceKm: number,
): RouteChain[] {
  return buildConnectedChains(segments).flatMap((chain): RouteChain[] => {
    const first = chain.coordinates[0]
    const last = chain.coordinates.at(-1) ?? first
    if (coordinatesConnect(first, last)) return []

    return splitCoordinatesByDistance(
      chain.coordinates,
      maxRoundTripDistanceKm / 2,
    ).map((outboundCoordinates) => ({
      coordinates: [
        ...outboundCoordinates,
        ...[...outboundCoordinates].reverse().slice(1),
      ],
      segments: [...chain.segments, ...chain.segments],
      usesRepeatedSegments: true,
    }))
  })
}

function deriveDifficulty(
  distance: number,
  continuityScore: number,
): RouteDifficulty {
  if (distance <= 2 && continuityScore >= 80) return 'Easy'
  if (distance <= 6 && continuityScore >= 60) return 'Moderate'
  return 'Hard'
}

function cityForCoordinate([latitude, longitude]: RouteCoordinate): RouteCity {
  // The Overpass export has no municipal boundary polygons, so use conservative
  // approximate bounds and treat everything else in this regional file as Tel Aviv.
  if (
    latitude >= 32.055 &&
    latitude <= 32.075 &&
    longitude >= 34.8015 &&
    longitude <= 34.825
  ) {
    return 'Givatayim'
  }

  if (
    latitude >= 32.045 &&
    latitude <= 32.13 &&
    longitude >= 34.802
  ) {
    return 'Ramat Gan'
  }

  return 'Tel Aviv'
}

function deriveCities(coordinates: RouteCoordinate[]): RouteCity[] {
  const cities = new Set(coordinates.map(cityForCoordinate))
  return (['Tel Aviv', 'Ramat Gan', 'Givatayim'] as RouteCity[]).filter((city) =>
    cities.has(city),
  )
}

function interpolateCoordinate(
  start: RouteCoordinate,
  end: RouteCoordinate,
  ratio: number,
): RouteCoordinate {
  return [
    start[0] + (end[0] - start[0]) * ratio,
    start[1] + (end[1] - start[1]) * ratio,
  ]
}

function splitCoordinatesByDistance(
  coordinates: RouteCoordinate[],
  maxDistanceKm: number,
): RouteCoordinate[][] {
  if (pathLengthKm(coordinates) <= maxDistanceKm) return [coordinates]

  const chunks: RouteCoordinate[][] = []
  let currentChunk: RouteCoordinate[] = [coordinates[0]]
  let currentLength = 0

  for (let index = 1; index < coordinates.length; index += 1) {
    let segmentStart = currentChunk.at(-1) ?? coordinates[index - 1]
    const segmentEnd = coordinates[index]
    let remainingLength = distanceKm(segmentStart, segmentEnd)

    while (currentLength + remainingLength > maxDistanceKm) {
      const distanceToCut = maxDistanceKm - currentLength
      const cutPoint = interpolateCoordinate(
        segmentStart,
        segmentEnd,
        distanceToCut / remainingLength,
      )
      currentChunk.push(cutPoint)
      chunks.push(currentChunk)
      currentChunk = [cutPoint]
      segmentStart = cutPoint
      remainingLength = distanceKm(segmentStart, segmentEnd)
      currentLength = 0
    }

    currentChunk.push(segmentEnd)
    currentLength += remainingLength
  }

  if (currentChunk.length > 1) chunks.push(currentChunk)
  return chunks
}

/** Builds continuous suggestions solely by joining endpoints in mapped linework. */
export function deriveBikeRoutes(
  data: BikePathCollection,
  options: RouteGenerationOptions = {},
): BikeRoute[] {
  const minDistanceKm = Math.max(
    MIN_ROUTE_LENGTH_KM,
    options.minDistanceKm ?? MIN_ROUTE_LENGTH_KM,
  )
  const maxDistanceKm =
    options.maxDistanceKm ??
    Math.max(DEFAULT_MAX_GENERATED_ROUTE_KM, minDistanceKm * 2)
  if (minDistanceKm > maxDistanceKm) return []

  const allowedTypes = new Set<RoutableInfrastructureType>(
    options.infrastructureTypes ?? ['dedicated', 'on-road', 'other'],
  )
  const segments = data.features.flatMap((feature) => {
    const type = classifyInfrastructureFeature(feature)
    if (
      type === null ||
      type === 'fountain' ||
      type === 'restroom' ||
      !allowedTypes.has(type)
    ) {
      return []
    }

    return geometryToSegments(feature.geometry, feature.properties ?? {})
  })
  const chains = (
    options.roundTrip
      ? [
          ...buildRoundTripChains(segments),
          ...(options.allowRetracing
            ? buildRetracedRoundTripChains(segments, maxDistanceKm)
            : []),
        ]
      : buildConnectedChains(segments)
  ).sort(
    (first, second) =>
      pathLengthKm(second.coordinates) - pathLengthKm(first.coordinates),
  )
  const routes: BikeRoute[] = []

  chains.forEach((chain, chainIndex) => {
    const chainLength = pathLengthKm(chain.coordinates)
    const dedicatedLength = chain.segments.reduce(
      (total, segment) => total + (segment.dedicated ? segment.lengthKm : 0),
      0,
    )
    const continuityScore = Math.min(
      100,
      Math.round((dedicatedLength / chainLength) * 100),
    )

    const routeGeometries = options.roundTrip
      ? chainLength <= maxDistanceKm
        ? [chain.coordinates]
        : []
      : splitCoordinatesByDistance(chain.coordinates, maxDistanceKm)

    routeGeometries.forEach(
      (coordinates, chunkIndex) => {
        const length = pathLengthKm(coordinates)
        if (length < minDistanceKm) return

        const cities = deriveCities(coordinates)
        const routeNumber = routes.length + 1
        const routeKind: RouteKind = chain.usesRepeatedSegments
          ? 'out-and-back'
          : options.roundTrip
            ? 'round'
            : 'standard'

        routes.push({
          id: `${options.roundTrip ? 'round' : 'generated'}-${chainIndex + 1}-${chunkIndex + 1}`,
          routeNumber,
          routeKind,
          cities,
          distanceKm: Math.round(length * 10) / 10,
          continuityScore,
          difficulty: deriveDifficulty(length, continuityScore),
          coordinates,
          source: 'OpenStreetMap',
          sourceFeatureCount: chain.segments.length,
          isRoundTrip: Boolean(options.roundTrip),
          usesRepeatedSegments: Boolean(chain.usesRepeatedSegments),
        })
      },
    )
  })

  return routes
}
