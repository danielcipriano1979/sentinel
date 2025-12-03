/**
 * Design Tokens
 *
 * Centralized design values for the entire application.
 * This file serves as the single source of truth for:
 * - Colors
 * - Spacing
 * - Typography
 * - Shadows
 * - Border radius
 * - Transitions
 * - Z-index values
 *
 * These tokens are used to maintain consistency across all components
 * and to make future design updates easier to manage.
 */

// ============================================
// SPACING SCALE
// ============================================
// Base unit: 0.25rem (4px)
export const spacing = {
  0: "0",
  1: "0.25rem",    // 4px
  2: "0.5rem",     // 8px
  3: "0.75rem",    // 12px
  4: "1rem",       // 16px
  6: "1.5rem",     // 24px
  8: "2rem",       // 32px
  12: "3rem",      // 48px
  16: "4rem",      // 64px
  20: "5rem",      // 80px
  24: "6rem",      // 96px
  32: "8rem",      // 128px
} as const;

// ============================================
// COLORS
// ============================================
// Using HSL format (hue saturation lightness)
// HSL is preferred for theming as it's easier to create
// consistent color variations and dark/light mode variants

export const colors = {
  // PRIMARY COLOR - Blue
  primary: {
    50: "217 91% 95%",
    100: "217 91% 90%",
    200: "217 91% 80%",
    300: "217 91% 65%",
    400: "217 91% 53%",
    500: "217 91% 42%",
    600: "217 91% 35%",
    700: "217 91% 25%",
    800: "217 91% 15%",
    900: "217 91% 8%",
  },

  // SECONDARY COLOR - Gray
  secondary: {
    50: "220 15% 98%",
    100: "220 15% 95%",
    200: "220 12% 92%",
    300: "220 12% 88%",
    400: "220 12% 75%",
    500: "220 12% 60%",
    600: "220 12% 45%",
    700: "220 12% 30%",
    800: "220 14% 10%",
    900: "220 15% 8%",
  },

  // ACCENT COLOR
  accent: {
    50: "271 81% 95%",
    100: "271 81% 90%",
    500: "271 81% 56%",
    900: "271 81% 20%",
  },

  // STATUS COLORS - CRITICAL (Red)
  critical: {
    50: "0 84% 95%",
    100: "0 84% 90%",
    200: "0 84% 80%",
    300: "0 84% 65%",
    400: "0 84% 56%",
    500: "0 84% 48%",
    600: "0 84% 40%",
    700: "0 84% 25%",
    800: "0 84% 15%",
    900: "0 84% 8%",
  },

  // STATUS COLORS - WARNING (Orange)
  warning: {
    50: "38 92% 95%",
    100: "38 92% 90%",
    200: "38 92% 80%",
    300: "38 92% 65%",
    400: "38 92% 57%",
    500: "38 92% 50%",
    600: "38 92% 40%",
    700: "38 92% 25%",
    800: "38 92% 15%",
    900: "38 92% 8%",
  },

  // STATUS COLORS - INFO (Blue)
  info: {
    50: "217 91% 95%",
    100: "217 91% 90%",
    200: "217 91% 80%",
    300: "217 91% 65%",
    400: "217 91% 53%",
    500: "217 91% 42%",
    600: "217 91% 35%",
    700: "217 91% 25%",
    800: "217 91% 15%",
    900: "217 91% 8%",
  },

  // STATUS COLORS - SUCCESS (Green)
  success: {
    50: "142 76% 95%",
    100: "142 76% 90%",
    200: "142 76% 80%",
    300: "142 76% 65%",
    400: "142 76% 50%",
    500: "142 76% 36%",
    600: "142 76% 28%",
    700: "142 76% 18%",
    800: "142 76% 10%",
    900: "142 76% 5%",
  },

  // NEUTRAL GRAYS - Light mode base
  neutral: {
    50: "220 15% 98%",
    100: "220 15% 95%",
    200: "220 12% 92%",
    300: "220 12% 88%",
    400: "220 12% 75%",
    500: "220 12% 60%",
    600: "220 12% 45%",
    700: "220 15% 18%",
    800: "220 14% 10%",
    900: "220 15% 8%",
  },
};

// ============================================
// TYPOGRAPHY
// ============================================
export const typography = {
  sizes: {
    xs: {
      size: "12px",
      lineHeight: "1.4",
      letterSpacing: "0.3px",
    },
    sm: {
      size: "13px",
      lineHeight: "1.5",
      letterSpacing: "0.2px",
    },
    base: {
      size: "14px",
      lineHeight: "1.5",
      letterSpacing: "0px",
    },
    md: {
      size: "15px",
      lineHeight: "1.5",
      letterSpacing: "0px",
    },
    lg: {
      size: "16px",
      lineHeight: "1.6",
      letterSpacing: "-0.5px",
    },
    xl: {
      size: "18px",
      lineHeight: "1.6",
      letterSpacing: "-0.5px",
    },
    "2xl": {
      size: "22px",
      lineHeight: "1.5",
      letterSpacing: "-1px",
    },
    "3xl": {
      size: "28px",
      lineHeight: "1.4",
      letterSpacing: "-1.5px",
    },
  },

  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  fonts: {
    // Primary sans-serif for UI
    sans: '"Inter", "Helvetica Neue", sans-serif',
    // Monospace for code and technical content
    mono: '"Fira Code", "Menlo", monospace',
  },
};

// ============================================
// SHADOWS
// ============================================
// Shadow system with progressive depth
// Used for elevation and visual hierarchy
export const shadows = {
  none: "none",

  // Extra small - subtle shadows for slight elevation
  xs: "0px 2px 0px 0px hsl(220 12% 5% / 0.05)",

  // Small - used for cards at rest
  sm: "0px 2px 0px 0px hsl(220 12% 5% / 0.05), 0px 1px 2px -1px hsl(220 12% 5% / 0.08)",

  // Medium - used for hovered cards, small modals
  md: "0px 2px 0px 0px hsl(220 12% 5% / 0.10), 0px 2px 4px -1px hsl(220 12% 5% / 0.15)",

  // Large - used for larger modals, dropdowns
  lg: "0px 2px 0px 0px hsl(220 12% 5% / 0.12), 0px 4px 6px -1px hsl(220 12% 5% / 0.18)",

  // Extra large - used for floating panels, tooltips
  xl: "0px 2px 0px 0px hsl(220 12% 5% / 0.15), 0px 8px 10px -1px hsl(220 12% 5% / 0.22)",

  // 2XL - reserved for top-level overlays
  "2xl": "0px 2px 0px 0px hsl(220 12% 5% / 0.25)",
};

// Dark mode shadows (higher opacity, different base color)
export const shadowsDark = {
  none: "none",
  xs: "0px 2px 0px 0px hsl(220 12% 2% / 0.30)",
  sm: "0px 2px 0px 0px hsl(220 12% 2% / 0.35), 0px 1px 2px -1px hsl(220 12% 2% / 0.40)",
  md: "0px 2px 0px 0px hsl(220 12% 2% / 0.45), 0px 2px 4px -1px hsl(220 12% 2% / 0.50)",
  lg: "0px 2px 0px 0px hsl(220 12% 2% / 0.50), 0px 4px 6px -1px hsl(220 12% 2% / 0.55)",
  xl: "0px 2px 0px 0px hsl(220 12% 2% / 0.55), 0px 8px 10px -1px hsl(220 12% 2% / 0.60)",
  "2xl": "0px 2px 0px 0px hsl(220 12% 2% / 0.65)",
};

// ============================================
// BORDER RADIUS
// ============================================
export const borderRadius = {
  none: "0",
  xs: "0.25rem",    // 4px - small buttons, tight components
  sm: "0.375rem",   // 6px
  md: "0.5rem",     // 8px - default for most elements
  lg: "0.75rem",    // 12px - cards, larger components
  xl: "1rem",       // 16px - large modals, panels
  "2xl": "1.5rem",  // 24px - very large elements
  full: "9999px",   // Perfect circle/pill shape
};

// ============================================
// TRANSITIONS
// ============================================
// Easing functions and durations for animations
export const transitions = {
  // Durations
  duration: {
    instant: "0ms",
    faster: "100ms",
    fast: "150ms",
    base: "200ms",
    slow: "300ms",
    slower: "500ms",
  },

  // Easing functions
  easing: {
    linear: "cubic-bezier(0, 0, 1, 1)",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    "in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
  },
};

// Helper to create transition strings
export const transitionString = (
  duration: keyof typeof transitions.duration = "base",
  easing: keyof typeof transitions.easing = "in-out",
  properties: string[] = ["all"]
) => {
  return properties
    .map(
      (prop) =>
        `${prop} ${transitions.duration[duration]} ${transitions.easing[easing]}`
    )
    .join(", ");
};

// ============================================
// Z-INDEX SCALE
// ============================================
// Ensures proper stacking context throughout the app
export const zIndex = {
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  backdrop: 1040,
  offcanvas: 1050,
  modal: 1060,
  popover: 1070,
  tooltip: 1080,
  notification: 1090,
};

// ============================================
// STATUS COLOR UTILITIES
// ============================================
// Helper object for accessing status colors by semantic name

export const statusColors = {
  critical: {
    light: {
      bg: colors.critical["50"],
      fg: colors.critical["900"],
      border: colors.critical["500"],
    },
    dark: {
      bg: colors.critical["900"],
      fg: colors.critical["50"],
      border: colors.critical["500"],
    },
  },
  warning: {
    light: {
      bg: colors.warning["50"],
      fg: colors.warning["900"],
      border: colors.warning["500"],
    },
    dark: {
      bg: colors.warning["900"],
      fg: colors.warning["50"],
      border: colors.warning["500"],
    },
  },
  info: {
    light: {
      bg: colors.info["50"],
      fg: colors.info["900"],
      border: colors.info["500"],
    },
    dark: {
      bg: colors.info["900"],
      fg: colors.info["50"],
      border: colors.info["500"],
    },
  },
  success: {
    light: {
      bg: colors.success["50"],
      fg: colors.success["900"],
      border: colors.success["500"],
    },
    dark: {
      bg: colors.success["900"],
      fg: colors.success["50"],
      border: colors.success["500"],
    },
  },
};

// ============================================
// SEMANTIC ALIASES
// ============================================
// Use semantic names instead of literal color names for better maintainability

export const semanticColors = {
  // Text
  text: {
    primary: colors.secondary["900"],
    secondary: colors.secondary["600"],
    tertiary: colors.secondary["500"],
    disabled: colors.secondary["400"],
  },

  // Backgrounds
  background: {
    primary: colors.secondary["50"],
    secondary: colors.secondary["100"],
    tertiary: colors.secondary["200"],
  },

  // Borders
  border: {
    light: colors.secondary["200"],
    normal: colors.secondary["300"],
    dark: colors.secondary["400"],
  },

  // Interactive
  interactive: {
    primary: colors.primary["500"],
    secondary: colors.secondary["500"],
    success: colors.success["500"],
    warning: colors.warning["500"],
    critical: colors.critical["500"],
  },
};

// ============================================
// ELEVATION SYSTEM CONSTANTS
// ============================================
// Used for the elevation interaction pattern
// (hover-elevate, active-elevate, etc.)

export const elevation = {
  light: {
    level1: "rgba(0, 0, 0, 0.03)",
    level2: "rgba(0, 0, 0, 0.08)",
  },
  dark: {
    level1: "rgba(255, 255, 255, 0.04)",
    level2: "rgba(255, 255, 255, 0.09)",
  },
};

// ============================================
// BREAKPOINTS
// ============================================
// Responsive design breakpoints
// Matches Tailwind defaults but defined here for reference

export const breakpoints = {
  xs: "320px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

// ============================================
// DESIGN SYSTEM VERSION
// ============================================
// Update this when making significant design changes

export const designSystemVersion = "1.0.0";
export const lastUpdated = "2025-01-01";
