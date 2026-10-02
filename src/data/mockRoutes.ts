export type RouteDifficulty = 'Easy' | 'Moderate' | 'Hard'

export interface BikeRoute {
  id: string
  title: string
  cities: string[]
  distanceKm: number
  continuityScore: number
  difficulty: RouteDifficulty
  description: string
  startPoint: string
  endPoint: string
}

export const mockRoutes: BikeRoute[] = [
  {
    id: 'yarkon-park-trail',
    title: 'Yarkon Park Trail',
    cities: ['Tel Aviv', 'Ramat Gan'],
    distanceKm: 12.8,
    continuityScore: 96,
    difficulty: 'Easy',
    description:
      'A relaxed riverside ride through Yarkon Park, linking the coast with the green heart of Ramat Gan.',
    startPoint: 'Tel Aviv Port',
    endPoint: 'Ramat Gan Stadium',
  },
  {
    id: 'ofanidan-expressway',
    title: 'Ofanidan Expressway',
    cities: ['Tel Aviv', 'Ramat Gan', 'Givatayim'],
    distanceKm: 10.4,
    continuityScore: 100,
    difficulty: 'Moderate',
    description:
      'A direct metropolitan corridor designed for efficient cross-city riding on fully separated infrastructure.',
    startPoint: 'Menachem Begin Road',
    endPoint: 'Aluf Sade Interchange',
  },
  {
    id: 'givatayim-ring',
    title: 'Givatayim Ring',
    cities: ['Givatayim', 'Ramat Gan'],
    distanceKm: 7.2,
    continuityScore: 78,
    difficulty: 'Moderate',
    description:
      'A compact urban loop connecting neighborhood centers, parks, and local streets across Givatayim and Ramat Gan.',
    startPoint: 'Givatayim Mall',
    endPoint: 'Rambam Square',
  },
]
