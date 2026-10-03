import type { TFunction } from 'i18next'
import type {
  BikeRoute,
  RouteCity,
  RouteDifficulty,
} from '../data/routes'
import type { SupportedLanguage } from '../i18n'
import type { BikePathProperties } from './loadBikeData'
import type { RouteAmenity } from './routePois'

const cityKeys: Record<RouteCity, string> = {
  'Tel Aviv': 'cities.telAviv',
  'Ramat Gan': 'cities.ramatGan',
  Givatayim: 'cities.givatayim',
}

const difficultyKeys: Record<RouteDifficulty, string> = {
  Easy: 'difficulty.easy',
  Moderate: 'difficulty.moderate',
  Hard: 'difficulty.hard',
}

export function getSupportedLanguage(language: string): SupportedLanguage {
  return language.toLowerCase().startsWith('he') ? 'he' : 'en'
}

export function formatNumber(
  value: number,
  language: SupportedLanguage,
  maximumFractionDigits = 1,
) {
  return new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-US', {
    maximumFractionDigits,
  }).format(value)
}

export function translateCity(city: RouteCity, t: TFunction) {
  return t(cityKeys[city])
}

export function translateDifficulty(
  difficulty: RouteDifficulty,
  t: TFunction,
) {
  return t(difficultyKeys[difficulty])
}

export function getRouteLabels(route: BikeRoute, t: TFunction) {
  const area = route.cities.map((city) => translateCity(city, t)).join(' / ')
  const titleKey =
    route.routeKind === 'out-and-back'
      ? 'routes.outAndBackTitle'
      : route.routeKind === 'round'
        ? 'routes.roundTitle'
        : 'routes.generatedTitle'
  const descriptionKey =
    route.routeKind === 'out-and-back'
      ? 'routes.outAndBackDescription'
      : route.routeKind === 'round'
        ? 'routes.roundDescription'
        : 'routes.generatedDescription'

  return {
    title: t(titleKey, { area, number: route.routeNumber }),
    description: t(descriptionKey),
    startPoint:
      route.isRoundTrip || route.routeKind !== 'standard'
        ? t('routes.roundStartFinish')
        : t('routes.generatedStart'),
    endPoint:
      route.isRoundTrip || route.routeKind !== 'standard'
        ? t('routes.roundStartFinish')
        : t('routes.generatedFinish'),
  }
}

function stringProperty(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function getLocalizedOsmName(
  properties: BikePathProperties,
  language: SupportedLanguage,
) {
  const primary = stringProperty(properties.name)
  const hebrew = stringProperty(properties['name:he'])
  const english = stringProperty(properties['name:en'])

  return language === 'he'
    ? hebrew ?? primary ?? english
    : english ?? primary ?? hebrew
}

export function getLocalizedAmenityName(
  amenity: RouteAmenity,
  language: SupportedLanguage,
  t: TFunction,
) {
  const name = stringProperty(amenity.name)
  const hebrew = stringProperty(amenity.nameHe)
  const english = stringProperty(amenity.nameEn)
  const localizedName =
    language === 'he'
      ? hebrew ?? name ?? english
      : english ?? name ?? hebrew

  return (
    localizedName ??
    t(
      amenity.type === 'fountain'
        ? 'amenities.drinkingWater'
        : 'amenities.publicRestroom',
    )
  )
}
