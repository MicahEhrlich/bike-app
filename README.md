# Bishvil

A local React, Vite, and TypeScript starter for discovering continuous bike
routes across Tel Aviv, Ramat Gan, and Givatayim.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Create the project from scratch

```bash
npm create vite@latest . -- --template react-ts
npm install
npm install tailwindcss @tailwindcss/vite lucide-react leaflet react-leaflet
npm install -D @types/leaflet @types/geojson
```

## Run locally

```bash
npm run dev
```

## Validate a change

```bash
npm run build
npm run lint
```

The app generates continuous route suggestions by joining compatible endpoints
in `public/dan_bike_lanes.geojson`. Distance limits and enabled infrastructure
layers rebuild those suggestions from the underlying geometry. Route lengths and
amenity proximity are computed from that geometry. Difficulty, continuity, and
city labels are estimates and the data may be incomplete, so the app is not
navigation guidance.

Round-trip mode detects closed cycles in the enabled infrastructure graph and
combines multiple connected segments into routes whose start and finish match.
An optional retracing mode also generates out-and-back rides, counting both the
outbound and repeated return legs in the displayed distance.

Available route filters include distance, estimated difficulty, city, nearby
drinking water, and nearby public restrooms. The visible list also follows the
current map viewport.

The header theme control switches between light and dark modes. The preference
is stored locally, with the operating-system preference used on the first visit.

The language control switches between English and Hebrew using i18next. Hebrew
mode applies right-to-left layout and prefers Hebrew OpenStreetMap names; the
device-local language choice is restored on later visits.
