/* Design-token mirror for non-CSS consumers (category accents, etc.).
   Values must stay in sync with src/styles/tokens.css. */

export const brand = {
  50: "#eef0fe",
  100: "#e0e3fd",
  200: "#c6cbfb",
  300: "#a3a9f7",
  400: "#7f83f1",
  500: "#6363e8",
  600: "#5555e6",
  700: "#4746c9",
  800: "#3a3aa0",
  900: "#33337e",
  950: "#1f1f4d",
} as const;

export const categoryAccent: Record<string, { light: string; dark: string }> = {
  pdf: { light: "#be185d", dark: "#f472b6" },
  image: { light: "#b45309", dark: "#fbbf24" },
  text: { light: "#1d4ed8", dark: "#93c5fd" },
  developer: { light: "#6d28d9", dark: "#c4b5fd" },
  utility: { light: "#047857", dark: "#6ee7b7" },
  video: { light: "#0d9488", dark: "#5eead4" },
};

export const radius = { sm: 10, md: 14, lg: 18, xl: 24 } as const;

/** Transition used on all interactive elements (150–200ms ease-out). */
export const TRANSITION = "transition-all duration-200 ease-out";
