export type Language = 'sl' | 'en';
export type RiderLevel = 'beginner' | 'intermediate' | 'hardcore';

export const strings = {
  sl: {
    // Welcome/Onboarding
    welcomeTitle: 'Dobrodošel na NaBajk',
    welcomeSubtitle: 'Najlepše ceste za cestno kolesarjenje',
    heroTitle: 'Najlepše ceste za cestno kolesarjenje',
    heroSubtitle: 'Izberi jezik in nivo. Potem dobiš poti, ki ti pašejo.',
    languageLabel: 'Jezik',
    languageSectionLabel: 'Izberi jezik',
    levelLabel: 'Tvoj nivo',
    levelSectionLabel: 'Kakšen kolesar si?',
    levelHelper: 'Uporabimo to za priporočila poti. Kadarkoli spremeniš v Nastavitvah.',
    levelBeginner: 'Začetnik',
    levelIntermediate: 'Srednji',
    levelHardcore: 'Pro',
    levelBeginnerDesc: 'Lažje poti, varne izbire',
    levelIntermediateDesc: 'Redni trening',
    levelHardcoreDesc: 'Dolgi klanci, brez milosti',
    continue: 'Nadaljuj',
    skip: 'Preskoči',

    // Settings
    settings: 'Nastavitve',
    about: 'O aplikaciji',
    aboutNabajk: 'O NaBajk',
    version: 'Verzija',
    privacyPolicy: 'Politika zasebnosti',
    viewPrivacy: 'Poglej politiko zasebnosti',
    termsOfService: 'Pogoji uporabe',
    viewTerms: 'Poglej pogoje uporabe',

    // Home Screen
    appName: 'NaBajk',
    appSubtitle: 'Najlepše ceste za cestno kolesarjenje',
    searchPlaceholder: 'Išči poti…',
    todaysWeather: 'Vreme danes',
    weather: 'Vreme',
    featuredRoutes: 'Priporočene poti',
    allRoutes: 'Vse poti',
    searchResults: 'rezultatov',
    searchResult: 'rezultat',
    noRoutesFound: 'Ni najdenih poti',

    // Categories
    categoryBrowsing: 'Prebrskaj po kategorijah',
    categoryVzponi: 'Vzponi',
    categoryCoffee: 'Coffee ride',
    categoryFamily: 'Družinska',
    categoryTrainingLong: 'Trening (dolge)',

    // Category Descriptions
    categoryDescVzponi: 'Poti z večjimi vzponi (1000m+)',
    categoryDescCoffee: 'Mirne, družabne vožnje s postanki',
    categoryDescFamily: 'Lahke poti primerne za družine',
    categoryDescTrainingLong: 'Dolge treningske poti (60km+)',

    // Time browsing
    timeBrowsing: 'Prebrskaj po času',
    time1h: '1h',
    time2h: '2h',
    time3h: '3h',
    time4hPlus: '4h+',
    timeDesc1h: 'Hitre poti do 1 ure',
    timeDesc2h: 'Poti 1-2 uri',
    timeDesc3h: 'Poti 2-3 ure',
    timeDesc4hPlus: 'Dolge poti nad 3 ure',

    // Quick picks & Partners
    quickPicks: 'Hitri izbiri',
    partners: 'Partnerji',
    partnerTag: 'Partner',

    // Regions
    gorenjska: 'Gorenjska',
    dolenjska: 'Dolenjska (kmalu)',
    stajerska: 'Štajerska (kmalu)',

    // Route Details
    routeOverview: 'Pregled poti',
    aboutRoute: 'O tej poti',
    traffic: 'Promet',
    roadQuality: 'Kakovost ceste',
    whyGood: 'Zakaj je dobra',
    exportGPX: 'Izvozi GPX za Garmin',
    mapPlaceholder: 'Zemljevid bo tu',

    // Route Descriptions (mock data)
    trafficDesc: 'Malo prometa na Soriški, več ob Bohinjskem jezeru.',
    roadQualityDesc: 'Večinoma dober asfalt. Krajši odsek makadama pred Sorišku.',
    whyGoodDesc: 'Kombinacija dveh jezer in gorskega vzpona. Razgledna pot z lepimi postanki.',

    // Stats
    km: 'km',
    meters: 'm vzpon',
    time: 'čas',

    // Difficulty
    easy: 'Lahka',
    medium: 'Srednja',
    hard: 'Težka',

    // Tabs
    routes: 'Poti',
    events: 'Tekme',
    profile: 'Profil',

    // Group Rides
    groupRides: 'Skupinske',
    groupRideTitle: 'Skupinske vožnje',
    createGroupRide: 'Ustvari skupinsko',
    upcomingRides: 'Prihajajoče',
    noGroupRides: 'Ni skupinskih voženj. Ustvari prvo.',

    // Races
    noRaces: 'Ni tekem',
    fetchRacesError: 'Ne more naložiti tekem',
    openLink: 'Odpri',
    racesSearch: 'Išči tekme…',
    racesSubtitle: 'Amaterske dirke in prireditve',
    racesEmptyHelper: 'Dodamo nove termine sproti.',

    // Recording
    recordTitle: 'Zabeleži',
    recordDisclaimerTitle: 'Varnostno opozorilo',
    recordDisclaimer: 'Vozite na lastno odgovornost. Spoštujte prometna pravila. Podatki GPS so lahko nepnatančni.',
    recordDisclaimerAccept: 'Razumem, nadaljuj',
    recordPermissionDenied: 'NaBajk potrebuje vašo lokacijo za snemanje vožnje. Prosim dovoljte dostop.',
    recordPermissionRetry: 'Dovoli lokacijo',
    recordWaitingGPS: 'Čaka GPS signal…',
    recordStart: 'ZAČNI',
    recordStop: 'USTAVI',
    recordElapsed: 'Pretekli čas',
    recordDistance: 'Razdalja',
    recordForegroundOnly: 'Samo v prvem planu',
    recordBackgroundWarning: 'Snemanje je ustavljeno, ker NaBajk za zdaj ne snemal v ozadju.',
    recordBackgroundSave: 'Shrani vožnjo',
    recordBackgroundDiscard: 'Zavrži',

    // Summary
    summaryTitle: 'Povzetek vožnje',
    summaryNamePlaceholder: 'Naslov vožnje…',
    summaryRegionLabel: 'Regija',
    summaryShortWarning: 'Ta vožnja je precej kratka (manj kot 1 km ali 2 min). Ali res želite shraniti?',
    summaryNoData: 'Ni podatkov o vožnji',

    // Saved Rides
    savedRidesTitle: 'Posnete vožnje',
    savedRidesEmpty: 'Nobene posnete vožnje',
    savedRidesEmptyHelper: 'Tapnite gumb Zabeleži za vašo prvo vožnjo.',

    // Share
    shareRecordedWith: 'Posneto z NaBajk',

    // Create Form
    rideTitle: 'Naziv vožnje',
    rideTitlePlaceholder: 'npr. Sobotna kava v Radovljico',
    selectRegion: 'Izberi regijo',
    selectDate: 'Izberi datum',
    selectTime: 'Izberi čas',
    meetingPointLabel: 'Zbirno mesto',
    meetingPointPlaceholder: 'npr. Parkirišče pri jezeru',
    meetingCoordinatesLabel: 'Koordinate (Google Maps link ali lat,lng)',
    meetingCoordinatesPlaceholder: 'Prilepi Google Maps link ali vnesi koordinate',
    selectRoute: 'Izberi pot',
    selectRoutePlaceholder: 'Izberi obstoječo pot',
    notesLabel: 'Opombe (neobvezno)',
    notesPlaceholder: 'Dodatne informacije za udeležence...',
    externalUrlLabel: 'Zunanji link (neobvezno)',
    externalUrlPlaceholder: 'https://...',
    visibilityLabel: 'Vidnost',
    publicRide: 'Javna',
    unlistedRide: 'Nejavna',
    capacityLabel: 'Omejitev udeležencev (neobvezno)',
    capacityPlaceholder: 'Največje število',
    createRide: 'Ustvari vožnjo',
    cancel: 'Prekliči',

    // Detail Screen
    rideDetails: 'Podrobnosti vožnje',
    startsAt: 'Začetek',
    meetingPoint: 'Zbirno mesto',
    openInMaps: 'Odpri v zemljevidu',
    routePreview: 'Pregled poti',
    attendees: 'Udeleženci',
    going: 'Grem',
    maybe: 'Mogoče',
    notGoing: 'Ne grem',
    viewRoute: 'Poglej pot',
    shareRide: 'Deli vožnjo',
    sharingRide: 'Pripravljam...',
    rsvpGoing: 'udeležencev',
    rsvpMaybe: 'mogoče',
    noAttendees: 'Še nihče se ni prijavil',
    beFirstRSVP: 'Bodi prvi, ki se prijavi!',

    // Name Prompt
    enterYourName: 'Vnesi svoje ime',
    namePromptHelper: 'To je samo za druge udeležence, da vidijo kdo gre. Lahko uporabiš vzdevek.',
    namePlaceholder: 'Tvoje ime ali vzdevek',
    save: 'Shrani',

    // Create Card
    createYourOwn: 'Ustvari svojo vožnjo',
    createYourOwnDesc: 'Organiziraj skupinsko vožnjo in povabi prijatelje.',

    // Search
    searchRoutes: 'Išči poti…',
    optional: '(neobvezno)',
  },
  en: {
    // Welcome/Onboarding
    welcomeTitle: 'Welcome to NaBajk',
    welcomeSubtitle: 'The best roads for road cycling',
    heroTitle: 'The best roads for road cycling',
    heroSubtitle: 'Pick language and level. Get routes that fit your ride.',
    languageLabel: 'Language',
    languageSectionLabel: 'Choose language',
    levelLabel: 'Your level',
    levelSectionLabel: 'What kind of rider are you?',
    levelHelper: 'Used for route recommendations. Change anytime in Settings.',
    levelBeginner: 'Beginner',
    levelIntermediate: 'Intermediate',
    levelHardcore: 'Pro',
    levelBeginnerDesc: 'Easy routes, safe picks',
    levelIntermediateDesc: 'Regular training',
    levelHardcoreDesc: 'Long climbs, no mercy',
    continue: 'Continue',
    skip: 'Skip',

    // Settings
    settings: 'Settings',
    about: 'About',
    aboutNabajk: 'About NaBajk',
    version: 'Version',
    privacyPolicy: 'Privacy Policy',
    viewPrivacy: 'View our privacy policy',
    termsOfService: 'Terms of Service',
    viewTerms: 'View terms and conditions',

    // Home Screen
    appName: 'NaBajk',
    appSubtitle: 'The best roads for road cycling',
    searchPlaceholder: 'Search routes…',
    todaysWeather: "Today's Weather",
    weather: 'Weather',
    featuredRoutes: 'Featured Routes',
    allRoutes: 'All Routes',
    searchResults: 'results',
    searchResult: 'result',
    noRoutesFound: 'No routes found',

    // Categories
    categoryBrowsing: 'Browse by Category',
    categoryVzponi: 'Climbs',
    categoryCoffee: 'Coffee ride',
    categoryFamily: 'Family',
    categoryTrainingLong: 'Training (Long)',

    // Category Descriptions
    categoryDescVzponi: 'Routes with major climbs (1000m+)',
    categoryDescCoffee: 'Relaxed, social rides with stops',
    categoryDescFamily: 'Easy routes suitable for families',
    categoryDescTrainingLong: 'Long-distance training routes (60km+)',

    // Time browsing
    timeBrowsing: 'Browse by Time',
    time1h: '1h',
    time2h: '2h',
    time3h: '3h',
    time4hPlus: '4h+',
    timeDesc1h: 'Quick routes up to 1 hour',
    timeDesc2h: 'Routes 1-2 hours',
    timeDesc3h: 'Routes 2-3 hours',
    timeDesc4hPlus: 'Long routes over 3 hours',

    // Quick picks & Partners
    quickPicks: 'Quick picks',
    partners: 'Partners',
    partnerTag: 'Partner',

    // Regions
    gorenjska: 'Gorenjska',
    dolenjska: 'Dolenjska (coming soon)',
    stajerska: 'Štajerska (coming soon)',

    // Route Details
    routeOverview: 'Route overview',
    aboutRoute: 'About this route',
    traffic: 'Traffic',
    roadQuality: 'Road quality',
    whyGood: "Why it's good",
    exportGPX: 'Export GPX for Garmin',
    mapPlaceholder: 'Map will be added here',

    // Route Descriptions (mock data)
    trafficDesc: 'Light traffic on Soriška, more around Lake Bohinj.',
    roadQualityDesc: 'Mostly good asphalt. Short gravel section before Soriška.',
    whyGoodDesc: 'Combination of two lakes and mountain climb. Scenic route with beautiful rest stops.',

    // Stats
    km: 'km',
    meters: 'm climb',
    time: 'time',

    // Difficulty
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',

    // Tabs
    routes: 'Routes',
    events: 'Events',
    profile: 'Profile',

    // Group Rides
    groupRides: 'Group rides',
    groupRideTitle: 'Group Rides',
    createGroupRide: 'Create ride',
    upcomingRides: 'Upcoming',
    noGroupRides: 'No group rides. Create the first.',

    // Races
    noRaces: 'No races',
    fetchRacesError: 'Could not load races',
    openLink: 'Open',
    racesSearch: 'Search races…',
    racesSubtitle: 'Amateur races and events',
    racesEmptyHelper: 'We add new events regularly.',

    // Recording
    recordTitle: 'Record',
    recordDisclaimerTitle: 'Safety Notice',
    recordDisclaimer: 'You ride at your own risk. Follow road laws. GPS data may be inaccurate.',
    recordDisclaimerAccept: 'I understand, continue',
    recordPermissionDenied: 'NaBajk needs your location to record rides. Please allow location access.',
    recordPermissionRetry: 'Allow Location',
    recordWaitingGPS: 'Waiting for GPS…',
    recordStart: 'START',
    recordStop: 'STOP',
    recordElapsed: 'Elapsed',
    recordDistance: 'Distance',
    recordForegroundOnly: 'Foreground only',
    recordBackgroundWarning: 'Recording stopped because NaBajk does not record in the background yet.',
    recordBackgroundSave: 'Save ride',
    recordBackgroundDiscard: 'Discard',

    // Summary
    summaryTitle: 'Ride Summary',
    summaryNamePlaceholder: 'Name your ride…',
    summaryRegionLabel: 'Region',
    summaryShortWarning: 'This ride is very short (under 1 km or 2 min). Save anyway?',
    summaryNoData: 'No ride data',

    // Saved Rides
    savedRidesTitle: 'Recorded Rides',
    savedRidesEmpty: 'No recorded rides yet',
    savedRidesEmptyHelper: 'Tap the Record button to start your first ride.',

    // Share
    shareRecordedWith: 'Recorded with NaBajk',

    // Create Form
    rideTitle: 'Ride title',
    rideTitlePlaceholder: 'e.g. Saturday coffee ride to Radovljica',
    selectRegion: 'Select region',
    selectDate: 'Select date',
    selectTime: 'Select time',
    meetingPointLabel: 'Meeting point',
    meetingPointPlaceholder: 'e.g. Parking lot at the lake',
    meetingCoordinatesLabel: 'Coordinates (Google Maps link or lat,lng)',
    meetingCoordinatesPlaceholder: 'Paste Google Maps link or enter coordinates',
    selectRoute: 'Select route',
    selectRoutePlaceholder: 'Choose existing route',
    notesLabel: 'Notes (optional)',
    notesPlaceholder: 'Additional info for participants...',
    externalUrlLabel: 'External link (optional)',
    externalUrlPlaceholder: 'https://...',
    visibilityLabel: 'Visibility',
    publicRide: 'Public',
    unlistedRide: 'Unlisted',
    capacityLabel: 'Capacity limit (optional)',
    capacityPlaceholder: 'Max number',
    createRide: 'Create ride',
    cancel: 'Cancel',

    // Detail Screen
    rideDetails: 'Ride details',
    startsAt: 'Starts at',
    meetingPoint: 'Meeting point',
    openInMaps: 'Open in maps',
    routePreview: 'Route preview',
    attendees: 'Attendees',
    going: 'Going',
    maybe: 'Maybe',
    notGoing: 'Not going',
    viewRoute: 'View route',
    shareRide: 'Share ride',
    sharingRide: 'Preparing...',
    rsvpGoing: 'going',
    rsvpMaybe: 'maybe',
    noAttendees: 'No one has signed up yet',
    beFirstRSVP: 'Be the first to RSVP!',

    // Name Prompt
    enterYourName: 'Enter your name',
    namePromptHelper: 'This is only for other participants to see who is going. You can use a nickname.',
    namePlaceholder: 'Your name or nickname',
    save: 'Save',

    // Create Card
    createYourOwn: 'Create your own ride',
    createYourOwnDesc: 'Organize a group ride and invite friends.',

    // Search
    searchRoutes: 'Search routes…',
    optional: '(optional)',
  },
};

export function t(lang: Language, key: keyof typeof strings.sl): string {
  return strings[lang][key];
}
