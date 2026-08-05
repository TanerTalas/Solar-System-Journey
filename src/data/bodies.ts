export type Stat = { label: string; value: string };

export type Body = {
  slug: string;
  /** two digit order label shown in the caption */
  num: string;
  name: string;
  tag: string;
  short: string;
  long: string;
  stats: Stat[];
  /** query sent to the NASA image library */
  nasaQuery: string;
  /** basename under /textures/{4k,2k}/ */
  texture: string;
  /** mean radius, km */
  radiusKm: number;
  /** distance from the Sun, km — the Moon is measured from Earth */
  distanceKm: number;
  /** rotation period, hours — negative when the body spins backwards */
  dayHours: number;
  /** axial tilt, degrees */
  tiltDeg: number;
  ring?: { inner: number; outer: number };
};

export const BODIES: Body[] = [
  {
    slug: "sun",
    num: "01",
    name: "The Sun",
    tag: "The star",
    short: "99.86% of all the mass out here. Everything that follows is leftovers.",
    long: "A G-type main-sequence star, four and a half billion years into a ten-billion-year life. Its core fuses about 600 million tonnes of hydrogen every second, and the light released can take a hundred thousand years to escape to the surface — then just over eight minutes to reach you. Every element in your body heavier than hydrogen was forged in a star like it.",
    stats: [
      { label: "Diameter", value: "1.39 million km" },
      { label: "Surface", value: "5,505 °C" },
      { label: "Age", value: "4.6 bn years" },
    ],
    nasaQuery: "sun solar flare dynamics observatory",
    texture: "sun",
    radiusKm: 696340,
    distanceKm: 0,
    dayHours: 609.12,
    tiltDeg: 7.25,
  },
  {
    slug: "mercury",
    num: "02",
    name: "Mercury",
    tag: "First planet",
    short: "No air to hold the heat. 430 °C by day, −180 °C by night.",
    long: "The smallest planet and the closest to the Sun, with almost no atmosphere to trade heat, so its surface swings through 600 °C between noon and midnight. A year lasts 88 Earth days, yet thanks to its slow spin a single sunrise-to-sunrise day takes 176. Its cratered face has barely changed in four billion years.",
    stats: [
      { label: "Radius", value: "2,440 km" },
      { label: "From the Sun", value: "57.9 M km" },
      { label: "Solar day", value: "176 days" },
    ],
    nasaQuery: "mercury planet messenger",
    texture: "mercury",
    radiusKm: 2440,
    distanceKm: 57.9e6,
    dayHours: 1407.6,
    tiltDeg: 0.03,
  },
  {
    slug: "venus",
    num: "03",
    name: "Venus",
    tag: "Second planet",
    short: "464 °C under permanent cloud. Hot enough to melt lead.",
    long: "Earth’s twin in size and its opposite in temperament. A runaway greenhouse effect traps heat under a carbon-dioxide atmosphere ninety times denser than ours, holding the surface at 464 °C. It spins backwards, and so slowly that its day outlasts its year.",
    stats: [
      { label: "Radius", value: "6,052 km" },
      { label: "From the Sun", value: "108.2 M km" },
      { label: "Surface", value: "464 °C" },
    ],
    nasaQuery: "venus planet magellan",
    texture: "venus",
    radiusKm: 6052,
    distanceKm: 108.2e6,
    dayHours: -5832.5,
    tiltDeg: 177.4,
  },
  {
    slug: "earth",
    num: "04",
    name: "Earth",
    tag: "Third planet",
    short: "The only world we know that looks back.",
    long: "The only place in the universe confirmed to host life. Seventy-one percent of it is covered by liquid water, its atmosphere burns up most incoming debris, and a magnetic field deflects the solar wind. From six billion kilometres away it is a single pale blue pixel — every human story so far has happened on it.",
    stats: [
      { label: "Radius", value: "6,371 km" },
      { label: "From the Sun", value: "149.6 M km" },
      { label: "Ocean cover", value: "71%" },
    ],
    nasaQuery: "earth from space",
    texture: "earth",
    radiusKm: 6371,
    distanceKm: 149.6e6,
    dayHours: 23.93,
    tiltDeg: 23.44,
  },
  {
    slug: "moon",
    num: "05",
    name: "The Moon",
    tag: "Earth’s companion",
    short: "Close enough that its pull still moves every ocean we have.",
    long: "Born, most likely, from a Mars-sized impact with the young Earth, the Moon has drifted outward ever since, about 3.8 centimetres a year. Its gravity steadies Earth’s tilt and drives the tides. Twelve people have walked on it; their bootprints will last for millions of years.",
    stats: [
      { label: "Radius", value: "1,737 km" },
      { label: "From Earth", value: "384,400 km" },
      { label: "Drift", value: "+3.8 cm / yr" },
    ],
    nasaQuery: "apollo moon surface",
    texture: "moon",
    radiusKm: 1737,
    distanceKm: 149.6e6 + 384400,
    dayHours: 655.7,
    tiltDeg: 6.68,
  },
  {
    slug: "mars",
    num: "06",
    name: "Mars",
    tag: "Fourth planet",
    short: "Rust, dust, and the tallest volcano we know of.",
    long: "Half Earth’s size, with a thin CO₂ sky and rust-coloured dust. It keeps the tallest volcano in the Solar System: Olympus Mons, 21.9 km high, and a canyon that would stretch across the United States. Dry riverbeds and lake floors say it was once warm and wet. It is the only planet we know inhabited entirely by robots.",
    stats: [
      { label: "Radius", value: "3,390 km" },
      { label: "From the Sun", value: "227.9 M km" },
      { label: "Olympus Mons", value: "21.9 km" },
    ],
    nasaQuery: "mars surface curiosity",
    texture: "mars",
    radiusKm: 3390,
    distanceKm: 227.9e6,
    dayHours: 24.62,
    tiltDeg: 25.19,
  },
  {
    slug: "jupiter",
    num: "07",
    name: "Jupiter",
    tag: "Fifth planet",
    short: "A storm wider than Earth, turning for 350 years.",
    long: "Jupiter outweighs every other planet combined, twice over. Its Great Red Spot is a storm wider than Earth that has raged for at least 350 years, and its magnetic field is the largest structure in the Solar System after the Sun’s own. With 95 known moons, it is nearly a planetary system of its own.",
    stats: [
      { label: "Radius", value: "69,911 km" },
      { label: "From the Sun", value: "778.5 M km" },
      { label: "Known moons", value: "95" },
    ],
    nasaQuery: "jupiter planet juno",
    texture: "jupiter",
    radiusKm: 69911,
    distanceKm: 778.5e6,
    dayHours: 9.93,
    tiltDeg: 3.13,
  },
  {
    slug: "saturn",
    num: "08",
    name: "Saturn",
    tag: "Sixth planet",
    short: "Rings 280,000 km wide and about ten metres thick.",
    long: "The lightest planet for its size: it would float, given a big enough ocean. Its rings span 280,000 kilometres yet average only about ten metres thick: ice and rock from a shattered moon or comet, shepherded into bands by dozens of moonlets. Cassini spent thirteen years there and ended its life inside them.",
    stats: [
      { label: "Radius", value: "58,232 km" },
      { label: "From the Sun", value: "1.43 bn km" },
      { label: "Ring span", value: "280,000 km" },
    ],
    nasaQuery: "saturn planet cassini",
    texture: "saturn",
    radiusKm: 58232,
    distanceKm: 1432e6,
    dayHours: 10.66,
    tiltDeg: 26.73,
    ring: { inner: 1.24, outer: 2.27 },
  },
  {
    slug: "uranus",
    num: "09",
    name: "Uranus",
    tag: "Seventh planet",
    short: "Tipped on its side. Forty-two years of night at a time.",
    long: "Uranus rolls around the Sun on its side, tilted 98 degrees, probably knocked over by a planet-sized collision long ago. Each pole gets 42 years of continuous sunlight followed by 42 years of night. Its methane haze absorbs red light, leaving the calmest, palest blue-green disc in the Solar System.",
    stats: [
      { label: "Radius", value: "25,362 km" },
      { label: "From the Sun", value: "2.87 bn km" },
      { label: "Axial tilt", value: "98°" },
    ],
    nasaQuery: "uranus planet voyager",
    texture: "uranus",
    radiusKm: 25362,
    distanceKm: 2867e6,
    dayHours: -17.24,
    tiltDeg: 97.77,
  },
  {
    slug: "neptune",
    num: "10",
    name: "Neptune",
    tag: "Eighth planet",
    short: "Winds at 2,100 km/h, in the dark.",
    long: "The farthest planet, found by mathematics before telescopes: its position predicted from the wobble it caused in Uranus’s orbit. Supersonic winds reach 2,100 km/h despite sunlight 900 times weaker than Earth’s. It has completed just one orbit since its discovery in 1846.",
    stats: [
      { label: "Radius", value: "24,622 km" },
      { label: "From the Sun", value: "4.50 bn km" },
      { label: "Winds", value: "2,100 km/h" },
    ],
    nasaQuery: "neptune planet voyager",
    texture: "neptune",
    radiusKm: 24622,
    distanceKm: 4500e6,
    dayHours: 16.11,
    tiltDeg: 28.32,
  },
];

export const bodyBySlug = (slug: string) => BODIES.find((b) => b.slug === slug);

export const bodyIndex = (slug: string) => BODIES.findIndex((b) => b.slug === slug);
