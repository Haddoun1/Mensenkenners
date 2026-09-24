// Centrale cursusdata: gebruikt door het dashboard (index.astro) en het profiel (profile.astro),
// zodat het aantal vragen per module maar op één plek staat.

export const courses = [
  {
    id: "onboarding",
    title: "Onboarding",
    image: "/images/mockupmensenkenners.png",
    description:
      "Welkom bij de onboarding! In deze cursus maken we je wegwijs in het platform en leggen we uit wat je kunt verwachten in de verschillende delen van de cursus.",
    progress: 0,
    href: "/onboarding/step-1",
    color: "var(--color-green)",
  },
  {
    id: "module_1",
    title: "Module 1: Inclusief contact",
    description:
      "In deze module oefen je met basisprincipes die in veel situaties toepasbaar zijn.",
    image: "/images/Mensenkennerskaderdoof.png",
    progress: 0,
    href: "/module-1/1",
    color: "var(--color-pink)",
  },
  {
    id: "module_2",
    title: "Module 2: Perspectief en inlevingsvermogen",
    description:
      "In deze module sta je stil bij situaties waarin bezoekers de wereld anders ervaren.",
    image: "images/Mensenkennerskaderroller.png",
    progress: 0,
    href: "/module-2/1",
    color: "var(--color-yellow)",
  },
  {
    id: "module_3",
    title: "Module 3: Toegankelijkheid van jouw werkplek",
    description:
      "In deze module ga je leren hoe je jouw werplek concreet inclusief kunt maken.",
    image: "/images/Mensenkennerskadersd.png",
    progress: 0,
    href: "/module-3/1",
    color: "var(--color-red)",
  },
  {
    id: "module_4",
    title: "Module 4: Praktijksituaties en toepassing",
    description: "In deze module oefen je met herkenbare situaties.",
    image: "/images/Mensenkennerskadervisueel.png",
    progress: 0,
    href: "/module-4/1",
    color: "var(--color-blue)",
  },
];

// Totale aantal vragen per cursus, gebruikt om het voortgangspercentage te berekenen.
export const totals = {
  onboarding: 9,
  module_1: 6,
  module_2: 10,
  module_3: 7,
  module_4: 9,
};

// Startpagina van elke cursus.
export const courseStartHref = {
  onboarding: "/onboarding/step-1",
  module_1: "/module-1/1",
  module_2: "/module-2/1",
  module_3: "/module-3/1",
  module_4: "/module-4/1",
};

// Zet de category-slug uit course_progress om naar een cursus-ID.
export const categoryToCourseId = {
  onboarding: "onboarding",
  "module-1": "module_1",
  "module-2": "module_2",
  "module-3": "module_3",
  "module-4": "module_4",
};
