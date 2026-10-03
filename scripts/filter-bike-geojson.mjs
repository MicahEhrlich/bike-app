import { createReadStream, createWriteStream } from 'node:fs'
import { once } from 'node:events'
import { createInterface } from 'node:readline'

const [inputPath, outputPath] = process.argv.slice(2)

if (!inputPath || !outputPath) {
  console.error(
    'Usage: node scripts/filter-bike-geojson.mjs <input.geojson> <output.geojson>',
  )
  process.exit(1)
}

const bounds = {
  south: 32.03,
  west: 34.74,
  north: 32.13,
  east: 34.88,
}

function hasBikeTag(properties) {
  return (
    properties.highway === 'cycleway' ||
    'cycleway' in properties ||
    'cycleway:left' in properties ||
    'cycleway:right' in properties
  )
}

function intersectsDanRegion(coordinates) {
  if (!Array.isArray(coordinates)) return false

  if (
    coordinates.length >= 2 &&
    typeof coordinates[0] === 'number' &&
    typeof coordinates[1] === 'number'
  ) {
    const [longitude, latitude] = coordinates
    return (
      longitude >= bounds.west &&
      longitude <= bounds.east &&
      latitude >= bounds.south &&
      latitude <= bounds.north
    )
  }

  return coordinates.some(intersectsDanRegion)
}

const input = createInterface({
  input: createReadStream(inputPath, { encoding: 'utf8' }),
  crlfDelay: Infinity,
})
const output = createWriteStream(outputPath, { encoding: 'utf8' })

let featureCount = 0
let isFirstFeature = true

output.write('{"type":"FeatureCollection","features":[\n')

for await (const line of input) {
  const candidate = line.trim().replace(/,$/, '')
  if (!candidate.startsWith('{"type":"Feature"')) continue

  const feature = JSON.parse(candidate)
  const geometry = feature.geometry ?? {}
  const properties = feature.properties ?? {}

  if (
    !['LineString', 'MultiLineString'].includes(geometry.type) ||
    !hasBikeTag(properties) ||
    !intersectsDanRegion(geometry.coordinates)
  ) {
    continue
  }

  if (!isFirstFeature) output.write(',\n')
  output.write(JSON.stringify(feature))
  isFirstFeature = false
  featureCount += 1
}

output.end('\n]}\n')
await once(output, 'finish')

console.log(`Wrote ${featureCount} Dan-region bike features to ${outputPath}`)
