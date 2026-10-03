import { useEffect, useRef, useState } from 'react'
import { Bike, Gauge, Languages, MapPinned, Route, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { RouteCity, RouteDifficulty } from '../data/routes'
import { getSupportedLanguage } from '../utils/localization'
import type {
  PreferredLength,
  RiderProfile,
} from '../utils/riderProfile'

interface OnboardingWizardProps {
  initialProfile: RiderProfile
  isEditing: boolean
  onCancel: () => void
  onComplete: (profile: RiderProfile) => void
  onSkip: () => void
}

const focusableSelector =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function OnboardingWizard({
  initialProfile,
  isEditing,
  onCancel,
  onComplete,
  onSkip,
}: OnboardingWizardProps) {
  const { t, i18n } = useTranslation()
  const language = getSupportedLanguage(i18n.resolvedLanguage ?? i18n.language)
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<RiderProfile>(initialProfile)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    document.body.style.overflow = 'hidden'
    window.requestAnimationFrame(() => {
      dialog?.querySelector<HTMLElement>(focusableSelector)?.focus()
    })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (isEditing) onCancel()
        else onSkip()
        return
      }

      if (event.key !== 'Tab' || !dialog) return
      const focusableElements = [
        ...dialog.querySelectorAll<HTMLElement>(focusableSelector),
      ]
      if (focusableElements.length === 0) return
      const first = focusableElements[0]
      const last = focusableElements.at(-1) ?? first

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [isEditing, onCancel, onSkip])

  const toggleCity = (city: RouteCity) => {
    setDraft((current) => ({
      ...current,
      cities: current.cities.includes(city)
        ? current.cities.filter((currentCity) => currentCity !== city)
        : [...current.cities, city],
    }))
  }

  return (
    <div className="fixed inset-0 z-[3000] flex items-end justify-center bg-slate-950/65 backdrop-blur-sm sm:items-center sm:p-6">
      <div
        ref={dialogRef}
        aria-labelledby="onboarding-title"
        aria-modal="true"
        className="flex h-full w-full flex-col overflow-hidden bg-[#f7f7f3] shadow-2xl dark:bg-slate-950 sm:h-auto sm:max-h-[min(46rem,calc(100vh-3rem))] sm:max-w-xl sm:rounded-[2rem] sm:border sm:border-white/20"
        role="dialog"
      >
        <div className="border-b border-stone-200 px-6 pb-5 pt-6 dark:border-slate-800 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-800 text-white shadow-sm">
              <Bike aria-hidden="true" size={23} />
            </span>
            <div className="flex items-center gap-2">
              <p className="hidden text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-800 dark:text-emerald-400 sm:block">
                {t('onboarding.progress', { current: step + 1, total: 4 })}
              </p>
              <button
                aria-label={t('app.switchLanguageLabel')}
                className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white"
                type="button"
                onClick={() => void i18n.changeLanguage(language === 'he' ? 'en' : 'he')}
              >
                <Languages aria-hidden="true" size={14} />
                {t('app.switchLanguage')}
              </button>
            </div>
          </div>
          <div className="mt-5 flex gap-2" aria-hidden="true">
            {[0, 1, 2, 3].map((item) => (
              <span
                key={item}
                className={`h-1.5 flex-1 rounded-full transition ${
                  item <= step ? 'bg-emerald-700' : 'bg-stone-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
          <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.12em] text-emerald-800 dark:text-emerald-400 sm:hidden">
            {t('onboarding.progress', { current: step + 1, total: 4 })}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-7 sm:px-8">
          {step === 0 && (
            <WizardStep
              icon={<UserRound size={22} />}
              title={t('onboarding.nameTitle')}
              description={t('onboarding.nameDescription')}
            >
              <label className="mt-6 block text-sm font-bold text-slate-700 dark:text-slate-200">
                {t('onboarding.nameLabel')}
                <input
                  autoComplete="given-name"
                  className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  maxLength={40}
                  placeholder={t('onboarding.namePlaceholder')}
                  type="text"
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {t('onboarding.nameOptional')}
              </p>
            </WizardStep>
          )}

          {step === 1 && (
            <WizardStep
              icon={<Gauge size={22} />}
              title={t('onboarding.difficultyTitle')}
              description={t('onboarding.difficultyDescription')}
            >
              <div className="mt-6 grid grid-cols-2 gap-3">
                {(['all', 'Easy', 'Moderate', 'Hard'] as const).map((value) => (
                  <ChoiceButton
                    key={value}
                    active={draft.difficulty === value}
                    label={
                      value === 'all'
                        ? t('routes.anyDifficulty')
                        : t(`difficulty.${value.toLowerCase()}`)
                    }
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        difficulty: value as RouteDifficulty | 'all',
                      }))
                    }
                  />
                ))}
              </div>
            </WizardStep>
          )}

          {step === 2 && (
            <WizardStep
              icon={<Route size={22} />}
              title={t('onboarding.lengthTitle')}
              description={t('onboarding.lengthDescription')}
            >
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {(['any', 'short', 'medium', 'long'] as PreferredLength[]).map(
                  (value) => (
                    <ChoiceButton
                      key={value}
                      active={draft.preferredLength === value}
                      label={t(`onboarding.length.${value}.label`)}
                      supportingText={t(`onboarding.length.${value}.description`)}
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          preferredLength: value,
                        }))
                      }
                    />
                  ),
                )}
              </div>
            </WizardStep>
          )}

          {step === 3 && (
            <WizardStep
              icon={<MapPinned size={22} />}
              title={t('onboarding.citiesTitle')}
              description={t('onboarding.citiesDescription')}
            >
              <div className="mt-6 space-y-3">
                {(
                  [
                    ['Tel Aviv', 'cities.telAviv'],
                    ['Ramat Gan', 'cities.ramatGan'],
                    ['Givatayim', 'cities.givatayim'],
                  ] as const
                ).map(([city, labelKey]) => (
                  <label
                    key={city}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-sm font-bold text-slate-700 transition hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <input
                      checked={draft.cities.includes(city)}
                      className="size-4 accent-emerald-700"
                      type="checkbox"
                      onChange={() => toggleCity(city)}
                    />
                    {t(labelKey)}
                  </label>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                {t('onboarding.citiesOptional')}
              </p>
            </WizardStep>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-stone-200 px-5 py-4 dark:border-slate-800 sm:px-8">
          <button
            className="rounded-xl px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-stone-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-emerald-700 dark:hover:bg-slate-800 dark:hover:text-white"
            type="button"
            onClick={isEditing ? onCancel : onSkip}
          >
            {t(isEditing ? 'onboarding.cancel' : 'onboarding.skip')}
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-emerald-300 focus-visible:outline-2 focus-visible:outline-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                type="button"
                onClick={() => setStep((current) => current - 1)}
              >
                {t('onboarding.back')}
              </button>
            )}
            <button
              className="rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              type="button"
              onClick={() => {
                if (step < 3) setStep((current) => current + 1)
                else onComplete(draft)
              }}
            >
              {t(
                step < 3
                  ? 'onboarding.continue'
                  : isEditing
                    ? 'onboarding.save'
                    : 'onboarding.finish',
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function WizardStep({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section>
      <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
        {icon}
      </span>
      <h2
        id="onboarding-title"
        className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-slate-950 dark:text-white"
      >
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
        {description}
      </p>
      {children}
    </section>
  )
}

function ChoiceButton({
  active,
  label,
  supportingText,
  onClick,
}: {
  active: boolean
  label: string
  supportingText?: string
  onClick: () => void
}) {
  return (
    <button
      aria-pressed={active}
      className={`rounded-2xl border p-4 text-start transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
        active
          ? 'border-emerald-700 bg-emerald-50 text-emerald-900 shadow-sm dark:bg-emerald-950 dark:text-emerald-100'
          : 'border-stone-200 bg-white text-slate-700 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
      }`}
      type="button"
      onClick={onClick}
    >
      <span className="block text-sm font-extrabold">{label}</span>
      {supportingText && (
        <span className="mt-1 block text-xs leading-5 opacity-70">
          {supportingText}
        </span>
      )}
    </button>
  )
}
