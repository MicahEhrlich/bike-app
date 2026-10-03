import type { LineString, MultiLineString } from 'geojson'
import type { RouteCoordinate } from '../data/routes'
import {
  classifyInfrastructureFeature,
  type InfrastructureType,
} from './infrastructure'
import type { BikePathCollection } from './loadBikeData'

export type RoutableInfrastructureType = Extract<
  InfrastructureType,
  'dedicated' | 'on-road' | 'other'
>

interface NetworkEdge {
  to: number
  distanceKm: number
}

interface NetworkNode {
  coordinate: RouteCoordinate
  edges: NetworkEdge[]
}

export interface BikeNetwork {
  nodes: NetworkNode[]
}

export interface NetworkSnap {
  nodeId: number
  coordinate: RouteCoordinate
  distanceMeters: number
}

export interface PointToPointRoute {
  coordinates: RouteCoordinate[]
  distanceKm: number
}

const NODE_CONNECTION_METERS = 6
const DEFAULT_MAX_SNAP_METERS = 300
const GRID_SIZE_DEGREES = 0.00006

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

export function coordinateAlongRoute(
  coordinates: RouteCoordinate[],
  fraction: number,
): RouteCoordinate {
  if (coordinates.length === 0) return [0, 0]
  if (coordinates.length === 1) return coordinates[0]
  const segmentLengths = coordinates.slice(1).map((coordinate, index) =>
    distanceKm(coordinates[index], coordinate),
  )
  const targetDistance =
    segmentLengths.reduce((total, length) => total + length, 0) *
    Math.max(0, Math.min(1, fraction))
  let coveredDistance = 0

  for (let index = 0; index < segmentLengths.length; index += 1) {
    const segmentLength = segmentLengths[index]
    if (coveredDistance + segmentLength >= targetDistance) {
      const ratio =
        segmentLength === 0
          ? 0
          : (targetDistance - coveredDistance) / segmentLength
      return [
        coordinates[index][0] +
          (coordinates[index + 1][0] - coordinates[index][0]) * ratio,
        coordinates[index][1] +
          (coordinates[index + 1][1] - coordinates[index][1]) * ratio,
      ]
    }
    coveredDistance += segmentLength
  }

  return coordinates.at(-1) ?? coordinates[0]
}

function gridCoordinate(value: number) {
  return Math.floor(value / GRID_SIZE_DEGREES)
}

function gridKey(latitudeCell: number, longitudeCell: number) {
  return `${latitudeCell}:${longitudeCell}`
}

/** Builds an undirected graph from every consecutive pair of imported path coordinates. */
export function buildBikeNetwork(
  data: BikePathCollection,
  allowedTypes: RoutableInfrastructureType[],
): BikeNetwork {
  const allowedTypeSet = new Set(allowedTypes)
  const nodes: NetworkNode[] = []
  const nodeGrid = new Map<string, number[]>()

  const findOrCreateNode = (coordinate: RouteCoordinate) => {
    const latitudeCell = gridCoordinate(coordinate[0])
    const longitudeCell = gridCoordinate(coordinate[1])

    for (let latitudeOffset = -1; latitudeOffset <= 1; latitudeOffset += 1) {
      for (
        let longitudeOffset = -1;
        longitudeOffset <= 1;
        longitudeOffset += 1
      ) {
        const candidates =
          nodeGrid.get(
            gridKey(
              latitudeCell + latitudeOffset,
              longitudeCell + longitudeOffset,
            ),
          ) ?? []
        const existingNode = candidates.find(
          (nodeId) =>
            distanceKm(nodes[nodeId].coordinate, coordinate) * 1_000 <=
            NODE_CONNECTION_METERS,
        )
        if (existingNode !== undefined) return existingNode
      }
    }

    const nodeId = nodes.length
    nodes.push({ coordinate, edges: [] })
    const key = gridKey(latitudeCell, longitudeCell)
    nodeGrid.set(key, [...(nodeGrid.get(key) ?? []), nodeId])
    return nodeId
  }

  for (const feature of data.features) {
    const type = classifyInfrastructureFeature(feature)
    if (
      type !== 'dedicated' &&
      type !== 'on-road' &&
      type !== 'other'
    ) {
      continue
    }
    if (!allowedTypeSet.has(type)) continue

    const lines =
      feature.geometry.type === 'LineString'
        ? [(feature.geometry as LineString).coordinates]
        : feature.geometry.type === 'MultiLineString'
          ? (feature.geometry as MultiLineString).coordinates
          : []

    for (const line of lines) {
      for (let index = 1; index < line.length; index += 1) {
        const previous = line[index - 1]
        const current = line[index]
        if (previous.length < 2 || current.length < 2) continue
        const start: RouteCoordinate = [previous[1], previous[0]]
        const end: RouteCoordinate = [current[1], current[0]]
        const segmentDistanceKm = distanceKm(start, end)
        if (!Number.isFinite(segmentDistanceKm) || segmentDistanceKm === 0) {
          continue
        }

        const startNode = findOrCreateNode(start)
        const endNode = findOrCreateNode(end)
        if (startNode === endNode) continue
        nodes[startNode].edges.push({ to: endNode, distanceKm: segmentDistanceKm })
        nodes[endNode].edges.push({ to: startNode, distanceKm: segmentDistanceKm })
      }
    }
  }

  return { nodes }
}

export function snapToBikeNetwork(
  network: BikeNetwork,
  coordinate: RouteCoordinate,
  maxDistanceMeters = DEFAULT_MAX_SNAP_METERS,
): NetworkSnap | null {
  let closestNodeId = -1
  let closestDistanceMeters = Number.POSITIVE_INFINITY

  network.nodes.forEach((node, nodeId) => {
    const nodeDistanceMeters = distanceKm(node.coordinate, coordinate) * 1_000
    if (nodeDistanceMeters < closestDistanceMeters) {
      closestNodeId = nodeId
      closestDistanceMeters = nodeDistanceMeters
    }
  })

  if (closestNodeId < 0 || closestDistanceMeters > maxDistanceMeters) return null
  return {
    nodeId: closestNodeId,
    coordinate: network.nodes[closestNodeId].coordinate,
    distanceMeters: Math.round(closestDistanceMeters),
  }
}

interface HeapEntry {
  nodeId: number
  distanceKm: number
}

function pushHeap(heap: HeapEntry[], entry: HeapEntry) {
  heap.push(entry)
  let index = heap.length - 1
  while (index > 0) {
    const parentIndex = Math.floor((index - 1) / 2)
    if (heap[parentIndex].distanceKm <= entry.distanceKm) break
    heap[index] = heap[parentIndex]
    index = parentIndex
  }
  heap[index] = entry
}

function popHeap(heap: HeapEntry[]): HeapEntry | undefined {
  const first = heap[0]
  const last = heap.pop()
  if (!first || !last || heap.length === 0) return first

  let index = 0
  while (true) {
    const leftIndex = index * 2 + 1
    const rightIndex = leftIndex + 1
    if (leftIndex >= heap.length) break
    const smallerChildIndex =
      rightIndex < heap.length &&
      heap[rightIndex].distanceKm < heap[leftIndex].distanceKm
        ? rightIndex
        : leftIndex
    if (heap[smallerChildIndex].distanceKm >= last.distanceKm) break
    heap[index] = heap[smallerChildIndex]
    index = smallerChildIndex
  }
  heap[index] = last
  return first
}

/** Finds the shortest connected path between two snapped network nodes. */
export function findShortestBikePath(
  network: BikeNetwork,
  startNodeId: number,
  endNodeId: number,
): PointToPointRoute | null {
  if (!network.nodes[startNodeId] || !network.nodes[endNodeId]) return null
  if (startNodeId === endNodeId) {
    return {
      coordinates: [network.nodes[startNodeId].coordinate],
      distanceKm: 0,
    }
  }

  const distances = Array<number>(network.nodes.length).fill(
    Number.POSITIVE_INFINITY,
  )
  const previous = Array<number>(network.nodes.length).fill(-1)
  const heap: HeapEntry[] = []
  distances[startNodeId] = 0
  pushHeap(heap, { nodeId: startNodeId, distanceKm: 0 })

  while (heap.length > 0) {
    const current = popHeap(heap)
    if (!current) break
    if (current.distanceKm !== distances[current.nodeId]) continue
    if (current.nodeId === endNodeId) break

    for (const edge of network.nodes[current.nodeId].edges) {
      const nextDistance = current.distanceKm + edge.distanceKm
      if (nextDistance >= distances[edge.to]) continue
      distances[edge.to] = nextDistance
      previous[edge.to] = current.nodeId
      pushHeap(heap, { nodeId: edge.to, distanceKm: nextDistance })
    }
  }

  if (!Number.isFinite(distances[endNodeId])) return null
  const nodeIds: number[] = []
  let nodeId = endNodeId
  while (nodeId >= 0) {
    nodeIds.push(nodeId)
    if (nodeId === startNodeId) break
    nodeId = previous[nodeId]
  }
  if (nodeIds.at(-1) !== startNodeId) return null
  nodeIds.reverse()

  return {
    coordinates: nodeIds.map((id) => network.nodes[id].coordinate),
    distanceKm: distances[endNodeId],
  }
}
