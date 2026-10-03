import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

export type SupportedLanguage = 'en' | 'he'

export const LANGUAGE_STORAGE_KEY = 'metrobike-language'

const resources = {
  en: {
    translation: {
      app: {
        brand: 'Bishvil',
        subtitle: 'Find a ride worth taking',
        greeting: 'Hello, <name>{{name}}</name>',
        guest: 'Guest',
        editPreferences: 'Edit rider preferences',
        pathsCount: '{{count}} paths',
        waterCount: '{{count}} water',
        restroomsCount: '{{count}} restrooms',
        loadingTitle: 'Loading bike infrastructure',
        loadingBody: 'Preparing the Dan region map…',
        errorTitle: 'Map data could not be loaded',
        unknownError: 'An unexpected error occurred while loading the map data.',
        retry: 'Try again',
        switchLanguage: 'עברית',
        switchLanguageLabel: 'Switch language to Hebrew',
        switchTheme: 'Switch to {{theme}} mode',
        light: 'light',
        dark: 'dark',
        documentTitle: 'Bishvil — find your next ride',
        documentDescription:
          'Find a bike ride that fits you across Tel Aviv, Ramat Gan, and Givatayim.',
      },
      map: {
        ariaLabel: 'Dan region bike infrastructure map',
        bikeInfrastructure: 'Bike infrastructure',
        unnamedPath: 'Unnamed path',
        locateMe: 'My location',
        locating: 'Finding your location…',
        yourLocation: 'Your current location',
        locationFound: 'Your location is now shown on the map.',
        locationAccuracy: 'Accurate to about {{value}} m',
        locationNotSupported: 'Location is not supported by this browser.',
        locationPermissionDenied:
          'Location access was denied. Allow it in your browser settings to show your position.',
        locationUnavailable: 'Your current location could not be determined.',
        locationTimeout: 'Finding your location took too long. Please try again.',
        locationError: 'Your location could not be loaded. Please try again.',
        start: 'Start: {{point}}',
        finish: 'Finish: {{point}}',
        startAndFinish: 'Start & finish',
      },
      pointRoute: {
        plannerLabel: 'Point-to-point route planner',
        planRoute: 'Plan a route',
        chooseStart: 'Choose your starting point on the map',
        chooseEnd: 'Now choose your destination',
        snapHelp: 'Your selection will snap to the nearest available bike path.',
        routeReady: 'Your route is ready · {{distance}}',
        startOver: 'Start over',
        closePlanner: 'Close route planner',
        start: 'Start',
        destination: 'Destination',
        yourRoute: 'Your bike route',
        noInfrastructure:
          'Turn on at least one bike infrastructure layer before choosing a point.',
        pointTooFar:
          'Choose a point closer to an available bike path (within 300 m).',
        noConnectedRoute:
          'These points are not connected by the available bike paths. Try another destination.',
        pointsTooClose: 'Choose a destination farther from the starting point.',
      },
      layers: {
        title: 'Map layers',
        filterLabel: 'Filter infrastructure types',
        dedicated: 'Dedicated paths',
        onRoad: 'On-road lanes',
        other: 'Other paths',
        fountain: 'Water fountains',
        restroom: 'Restrooms',
      },
      routes: {
        panelLabel: 'Generated bike routes',
        inView: '{{count}} routes in view',
        matching: '{{visible}} in view · {{total}} matching',
        heading: 'Generated routes',
        noRoutesTitle: 'No generated routes here',
        noRoutesBody: 'Pan the map or loosen the filters to discover more routes.',
        sourceNotice:
          'Routes are generated only from connected infrastructure in the current OpenStreetMap export.',
        filterSummary: 'Filter {{count}} generated routes',
        activeFilters: '{{count}} active',
        sortLabel: 'Sort routes',
        sortLengthDesc: 'Length: longest first',
        sortLengthAsc: 'Length: shortest first',
        sortDifficultyAsc: 'Difficulty: easy first',
        sortDifficultyDesc: 'Difficulty: hard first',
        distanceRange: 'Distance range (km)',
        minimum: 'Minimum',
        maximum: 'Maximum',
        noMinimum: 'No minimum',
        noMaximum: 'No maximum',
        invalidRange: 'Minimum distance must not exceed maximum distance.',
        generateRoundTrips: 'Generate round trips',
        generateRoundTripsHelp:
          'Combine connected paths into loops that start and finish together.',
        allowRetracing: 'Allow repeated return paths',
        allowRetracingHelp:
          'Include out-and-back rides that return along the same path.',
        difficultyLabel: 'Difficulty',
        anyDifficulty: 'Any difficulty',
        cityLabel: 'Cities',
        allCities: 'All cities',
        matchAnyCity: 'Matches any selected city',
        requiredAmenities: 'Required amenities',
        water: 'Water',
        restrooms: 'Restrooms',
        clearFilters: 'Clear all filters',
        roundTrip: 'Round trip',
        retracesPath: 'Retraces path',
        allRoutes: 'All routes',
        collapsePanel: 'Collapse routes panel',
        length: 'Length',
        dedicated: 'Dedicated',
        start: 'Start',
        finish: 'Finish',
        startAndFinish: 'Start & finish',
        nearbyAmenities: 'Amenities nearby',
        withinDistance: 'Within 200 m',
        noAmenities:
          'No mapped water fountains or restrooms were found near this route.',
        showingAmenities: 'Showing the closest 6 of {{count}} amenities.',
        safetyNotice:
          'Built from connected OpenStreetMap geometry. Check current street conditions before riding.',
        generatedTitle: '{{area}} generated route {{number}}',
        roundTitle: '{{area}} round route {{number}}',
        outAndBackTitle: '{{area}} out-and-back route {{number}}',
        generatedDescription:
          'Generated by joining nearby bike-infrastructure endpoints in the current OpenStreetMap export. No streets outside the imported network are used.',
        roundDescription:
          'A closed loop generated by combining connected bike-infrastructure segments in the current OpenStreetMap export.',
        outAndBackDescription:
          'An out-and-back round trip generated along connected bike infrastructure, returning over the same mapped path.',
        generatedStart: 'Generated route start',
        generatedFinish: 'Generated route finish',
        roundStartFinish: 'Round-trip start and finish',
      },
      difficulty: {
        easy: 'Easy',
        moderate: 'Moderate',
        hard: 'Hard',
      },
      cities: {
        telAviv: 'Tel Aviv',
        ramatGan: 'Ramat Gan',
        givatayim: 'Givatayim',
      },
      amenities: {
        drinkingWater: 'Drinking water',
        publicRestroom: 'Public restroom',
      },
      units: {
        kilometers: '{{value}} km',
        meters: '{{value}} m',
      },
      onboarding: {
        progress: 'Step {{current}} of {{total}}',
        nameTitle: 'What should we call you?',
        nameDescription:
          'A name makes your rides feel a little more personal. You can leave this blank.',
        nameLabel: 'Your name',
        namePlaceholder: 'For example, John',
        nameOptional: 'Optional · up to 40 characters',
        difficultyTitle: 'How do you like to ride?',
        difficultyDescription:
          'Choose a preferred difficulty. You can adjust this from the route filters anytime.',
        lengthTitle: 'How far should we take you?',
        lengthDescription:
          'Pick your usual ride length and we’ll start with routes that match.',
        length: {
          any: {
            label: 'Any distance',
            description: 'Show every available route',
          },
          short: {
            label: 'Short · up to 1 km',
            description: 'A quick spin or easy start',
          },
          medium: {
            label: 'Medium · 1–2 km',
            description: 'A balanced everyday ride',
          },
          long: {
            label: 'Long · 2–3 km',
            description: 'More time on the bike',
          },
        },
        citiesTitle: 'Where would you like to ride?',
        citiesDescription:
          'Choose one or more cities. Routes through any selected city will be included.',
        citiesOptional: 'Leave every city unchecked to explore the whole region.',
        cancel: 'Cancel',
        skip: 'Skip setup',
        back: 'Back',
        continue: 'Continue',
        save: 'Save preferences',
        finish: 'Find my ride',
      },
    },
  },
  he: {
    translation: {
      app: {
        brand: 'בשביל',
        subtitle: 'מוצאים סיבה לצאת לרכיבה',
        greeting: 'שלום, <name>{{name}}</name>',
        guest: 'אורח/ת',
        editPreferences: 'עריכת העדפות הרכיבה',
        pathsCount: '{{count}} שבילים',
        waterCount: '{{count}} נקודות מים',
        restroomsCount: '{{count}} שירותים',
        loadingTitle: 'טוענים תשתיות אופניים',
        loadingBody: 'מכינים את מפת גוש דן…',
        errorTitle: 'לא ניתן לטעון את נתוני המפה',
        unknownError: 'אירעה שגיאה לא צפויה בעת טעינת נתוני המפה.',
        retry: 'ניסיון נוסף',
        switchLanguage: 'English',
        switchLanguageLabel: 'החלפת השפה לאנגלית',
        switchTheme: 'מעבר למצב {{theme}}',
        light: 'בהיר',
        dark: 'כהה',
        documentTitle: 'בשביל — מוצאים את הרכיבה הבאה',
        documentDescription:
          'מוצאים רכיבת אופניים שמתאימה לכם בתל אביב, רמת גן וגבעתיים.',
      },
      map: {
        ariaLabel: 'מפת תשתיות האופניים בגוש דן',
        bikeInfrastructure: 'תשתית אופניים',
        unnamedPath: 'שביל ללא שם',
        locateMe: 'המיקום שלי',
        locating: 'מאתרים את המיקום שלך…',
        yourLocation: 'המיקום הנוכחי שלך',
        locationFound: 'המיקום שלך מוצג עכשיו על המפה.',
        locationAccuracy: 'דיוק משוער של {{value}} מ׳',
        locationNotSupported: 'הדפדפן הזה אינו תומך בשירותי מיקום.',
        locationPermissionDenied:
          'הגישה למיקום נדחתה. יש לאפשר אותה בהגדרות הדפדפן כדי להציג את המיקום שלך.',
        locationUnavailable: 'לא ניתן לקבוע את המיקום הנוכחי שלך.',
        locationTimeout: 'איתור המיקום נמשך זמן רב מדי. כדאי לנסות שוב.',
        locationError: 'לא ניתן לטעון את המיקום שלך. כדאי לנסות שוב.',
        start: 'התחלה: {{point}}',
        finish: 'סיום: {{point}}',
        startAndFinish: 'התחלה וסיום',
      },
      pointRoute: {
        plannerLabel: 'מתכנן מסלול מנקודה לנקודה',
        planRoute: 'תכנון מסלול',
        chooseStart: 'בחרו נקודת התחלה על המפה',
        chooseEnd: 'עכשיו בחרו יעד',
        snapHelp: 'הבחירה תוצמד לשביל האופניים הזמין הקרוב ביותר.',
        routeReady: 'המסלול מוכן · {{distance}}',
        startOver: 'התחלה מחדש',
        closePlanner: 'סגירת מתכנן המסלול',
        start: 'התחלה',
        destination: 'יעד',
        yourRoute: 'מסלול האופניים שלך',
        noInfrastructure:
          'יש להפעיל לפחות שכבת תשתית אופניים אחת לפני בחירת נקודה.',
        pointTooFar:
          'יש לבחור נקודה קרובה יותר לשביל אופניים זמין (עד 300 מ׳).',
        noConnectedRoute:
          'אין חיבור בין הנקודות דרך שבילי האופניים הזמינים. כדאי לבחור יעד אחר.',
        pointsTooClose: 'יש לבחור יעד רחוק יותר מנקודת ההתחלה.',
      },
      layers: {
        title: 'שכבות מפה',
        filterLabel: 'סינון סוגי תשתיות',
        dedicated: 'שבילים ייעודיים',
        onRoad: 'נתיבי אופניים בכביש',
        other: 'שבילים אחרים',
        fountain: 'ברזיות מים',
        restroom: 'שירותים',
      },
      routes: {
        panelLabel: 'מסלולי אופניים שנוצרו',
        inView: '{{count}} מסלולים בתצוגה',
        matching: '{{visible}} בתצוגה · {{total}} מתאימים',
        heading: 'מסלולים שנוצרו',
        noRoutesTitle: 'אין כאן מסלולים שנוצרו',
        noRoutesBody: 'אפשר להזיז את המפה או להקל את הסינון כדי לגלות מסלולים נוספים.',
        sourceNotice:
          'המסלולים נוצרים רק מתשתיות מחוברות בייצוא הנוכחי של OpenStreetMap.',
        filterSummary: 'סינון {{count}} מסלולים שנוצרו',
        activeFilters: '{{count}} פעילים',
        sortLabel: 'מיון מסלולים',
        sortLengthDesc: 'אורך: מהארוך לקצר',
        sortLengthAsc: 'אורך: מהקצר לארוך',
        sortDifficultyAsc: 'קושי: מהקל לקשה',
        sortDifficultyDesc: 'קושי: מהקשה לקל',
        distanceRange: 'טווח מרחק (ק״מ)',
        minimum: 'מינימום',
        maximum: 'מקסימום',
        noMinimum: 'ללא מינימום',
        noMaximum: 'ללא מקסימום',
        invalidRange: 'מרחק המינימום לא יכול להיות גדול ממרחק המקסימום.',
        generateRoundTrips: 'יצירת מסלולים מעגליים',
        generateRoundTripsHelp: 'שילוב שבילים מחוברים למסלול שמתחיל ומסתיים באותה נקודה.',
        allowRetracing: 'לאפשר חזרה באותה הדרך',
        allowRetracingHelp: 'כולל מסלולי הלוך־חזור שחוזרים על אותו שביל.',
        difficultyLabel: 'רמת קושי',
        anyDifficulty: 'כל רמות הקושי',
        cityLabel: 'ערים',
        allCities: 'כל הערים',
        matchAnyCity: 'התאמה לכל אחת מהערים שנבחרו',
        requiredAmenities: 'שירותים נדרשים',
        water: 'מים',
        restrooms: 'שירותים',
        clearFilters: 'ניקוי כל המסננים',
        roundTrip: 'מסלול מעגלי',
        retracesPath: 'חוזר באותו שביל',
        allRoutes: 'כל המסלולים',
        collapsePanel: 'כיווץ חלונית המסלולים',
        length: 'אורך',
        dedicated: 'שביל ייעודי',
        start: 'התחלה',
        finish: 'סיום',
        startAndFinish: 'התחלה וסיום',
        nearbyAmenities: 'שירותים בקרבת מקום',
        withinDistance: 'בטווח 200 מ׳',
        noAmenities: 'לא נמצאו ברזיות מים או שירותים ממופים בקרבת המסלול.',
        showingAmenities: 'מוצגים 6 הקרובים ביותר מתוך {{count}} שירותים.',
        safetyNotice:
          'נבנה מגאומטריה מחוברת של OpenStreetMap. יש לבדוק את תנאי הדרך העדכניים לפני הרכיבה.',
        generatedTitle: '{{area}} — מסלול {{number}}',
        roundTitle: '{{area}} — מסלול מעגלי {{number}}',
        outAndBackTitle: '{{area}} — מסלול הלוך־חזור {{number}}',
        generatedDescription:
          'נוצר באמצעות חיבור קצוות סמוכים של תשתיות אופניים בייצוא הנוכחי של OpenStreetMap, ללא שימוש ברחובות מחוץ לרשת המיובאת.',
        roundDescription:
          'מסלול סגור שנוצר משילוב מקטעי תשתית אופניים מחוברים בייצוא הנוכחי של OpenStreetMap.',
        outAndBackDescription:
          'מסלול הלוך־חזור שנוצר לאורך תשתיות אופניים מחוברות וחוזר באותה הדרך הממופה.',
        generatedStart: 'נקודת ההתחלה של המסלול',
        generatedFinish: 'נקודת הסיום של המסלול',
        roundStartFinish: 'נקודת ההתחלה והסיום',
      },
      difficulty: {
        easy: 'קל',
        moderate: 'בינוני',
        hard: 'קשה',
      },
      cities: {
        telAviv: 'תל אביב',
        ramatGan: 'רמת גן',
        givatayim: 'גבעתיים',
      },
      amenities: {
        drinkingWater: 'מי שתייה',
        publicRestroom: 'שירותים ציבוריים',
      },
      units: {
        kilometers: '{{value}} ק״מ',
        meters: '{{value}} מ׳',
      },
      onboarding: {
        progress: 'שלב {{current}} מתוך {{total}}',
        nameTitle: 'איך לפנות אליך?',
        nameDescription:
          'שם הופך את חוויית הרכיבה לאישית יותר. אפשר גם להשאיר את השדה ריק.',
        nameLabel: 'השם שלך',
        namePlaceholder: 'לדוגמה, דנה',
        nameOptional: 'לא חובה · עד 40 תווים',
        difficultyTitle: 'איך מתאים לך לרכוב?',
        difficultyDescription:
          'בחרו רמת קושי מועדפת. תמיד אפשר לשנות אותה במסנני המסלולים.',
        lengthTitle: 'לאיזה מרחק יוצאים?',
        lengthDescription:
          'בחרו את אורך הרכיבה הרגיל ונציג קודם מסלולים מתאימים.',
        length: {
          any: {
            label: 'כל מרחק',
            description: 'הצגת כל המסלולים הזמינים',
          },
          short: {
            label: 'קצר · עד 1 ק״מ',
            description: 'סיבוב מהיר או התחלה קלה',
          },
          medium: {
            label: 'בינוני · 1–2 ק״מ',
            description: 'רכיבה יומיומית מאוזנת',
          },
          long: {
            label: 'ארוך · 2–3 ק״מ',
            description: 'יותר זמן על האופניים',
          },
        },
        citiesTitle: 'איפה מתאים לך לרכוב?',
        citiesDescription:
          'בחרו עיר אחת או יותר. יוצגו מסלולים שעוברים בכל אחת מהערים שנבחרו.',
        citiesOptional: 'אם לא תיבחר עיר, נציג מסלולים מכל האזור.',
        cancel: 'ביטול',
        skip: 'דילוג על ההגדרה',
        back: 'חזרה',
        continue: 'המשך',
        save: 'שמירת העדפות',
        finish: 'למציאת רכיבה',
      },
    },
  },
} as const

function getInitialLanguage(): SupportedLanguage {
  try {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (savedLanguage === 'en' || savedLanguage === 'he') return savedLanguage
  } catch {
    // Browser storage is optional for this device-local preference.
  }

  return navigator.language.toLowerCase().startsWith('he') ? 'he' : 'en'
}

void i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  supportedLngs: ['en', 'he'],
  interpolation: { escapeValue: false },
  returnNull: false,
})

export default i18n
