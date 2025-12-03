# Design Tokens Quick Reference Guide

A quick cheat sheet for using the new design system in your components.

---

## Colors

### Using TypeScript
```typescript
import { colors } from '@/lib/design-tokens';

const primaryColor = `hsl(${colors.primary['500']})`;
const criticalBg = `hsl(${colors.critical['50']})`;
const successText = `hsl(${colors.success['900']})`;
```

### Using CSS Variables
```css
/* Primary */
background: hsl(var(--color-primary-500));

/* Status - Critical */
background: hsl(var(--color-critical-50));
color: hsl(var(--color-critical-900));

/* Status - Warning */
background: hsl(var(--color-warning-50));
color: hsl(var(--color-warning-900));

/* Status - Success */
background: hsl(var(--color-success-50));
color: hsl(var(--color-success-900));

/* Semantic */
color: var(--color-text-primary);
background: var(--color-bg-secondary);
border-color: var(--color-border-normal);
```

### Color Palette

**Primary** (Blue): Used for main actions and interactive elements
- 500 (main), 50 (lightest), 900 (darkest)

**Secondary** (Gray): Used for text, backgrounds, and neutral elements
- 500 (main), 50 (lightest), 900 (darkest)

**Status Colors**:
- **Critical** (Red): Errors, alerts, dangerous actions
- **Warning** (Orange): Warnings, cautions
- **Info** (Blue): Information, notifications
- **Success** (Green): Positive confirmations, completed actions

---

## Typography

### Using CSS Variables
```css
/* Font families */
font-family: var(--font-sans);      /* Inter - Main text */
font-family: var(--font-mono);      /* Fira Code - Code blocks */

/* Font sizes */
font-size: var(--text-xs-size);     /* 12px */
font-size: var(--text-sm-size);     /* 13px */
font-size: var(--text-base-size);   /* 14px */
font-size: var(--text-lg-size);     /* 16px */
font-size: var(--text-xl-size);     /* 18px */
font-size: var(--text-2xl-size);    /* 22px */

/* Line height & letter spacing are included with each size */
line-height: var(--text-lg-line-height);
letter-spacing: var(--text-lg-letter-spacing);

/* Font weights */
font-weight: var(--font-weight-regular);    /* 400 */
font-weight: var(--font-weight-semibold);   /* 600 */
font-weight: var(--font-weight-bold);       /* 700 */
```

### Size Scale
- **xs**: 12px (labels, badges)
- **sm**: 13px (small text, helper text)
- **base**: 14px (body text)
- **md**: 15px (subheadings)
- **lg**: 16px (headings, button text)
- **xl**: 18px (larger headings)
- **2xl**: 22px (page titles)
- **3xl**: 28px (hero titles)

---

## Spacing

### Using TypeScript
```typescript
import { spacing } from '@/lib/design-tokens';

const padding = spacing[4];    // 1rem (16px)
const margin = spacing[6];     // 1.5rem (24px)
const gap = spacing[3];        // 0.75rem (12px)
```

### Spacing Scale
- 0: 0
- 1: 0.25rem (4px)
- 2: 0.5rem (8px)
- 3: 0.75rem (12px)
- 4: 1rem (16px) ← Common default
- 6: 1.5rem (24px)
- 8: 2rem (32px)
- 12: 3rem (48px)
- 16: 4rem (64px)

### Common Patterns
```css
/* Card padding */
padding: var(--spacing-4);

/* Section margin */
margin-bottom: var(--spacing-6);

/* Gap between items */
gap: var(--spacing-3);

/* Small padding */
padding: var(--spacing-2);
```

---

## Shadows

### Using CSS Variables
```css
/* Light shadows (default) */
box-shadow: var(--shadow-xs);      /* Subtle */
box-shadow: var(--shadow-sm);      /* Light */
box-shadow: var(--shadow-md);      /* Medium - Card default */
box-shadow: var(--shadow-lg);      /* Large - Hovered card */
box-shadow: var(--shadow-xl);      /* Extra large - Modal */
box-shadow: var(--shadow-2xl);     /* 2xl - Top-level overlay */
box-shadow: var(--shadow-none);    /* No shadow */
```

### Shadow Scale
- **xs**: Subtle elevation (2px)
- **sm**: Light elevation (2px + 1px blur)
- **md**: Medium elevation (2px + 4px blur) ← Card default
- **lg**: Large elevation (4px + 6px blur) ← Hovered card
- **xl**: Extra large (8px + 10px blur) ← Modal
- **2xl**: Maximum (8px + 10px blur with higher opacity)

### Dark Mode
Shadows automatically increase in dark mode via `.dark` class

---

## Border Radius

### Using TypeScript
```typescript
import { borderRadius } from '@/lib/design-tokens';

const cardRadius = borderRadius.lg;     // 0.75rem
const buttonRadius = borderRadius.md;   // 0.5rem
```

### Using CSS Variables
```css
border-radius: var(--radius-md);    /* Default - 0.5rem */
border-radius: var(--radius-lg);    /* Cards - 0.75rem */
border-radius: var(--radius-xl);    /* Large modals - 1rem */
border-radius: var(--radius-full);  /* Perfect circle/pill - 9999px */
```

### Scale
- **xs**: 0.25rem (4px) - Tight elements
- **sm**: 0.375rem (6px) - Buttons
- **md**: 0.5rem (8px) - Default ← Most elements
- **lg**: 0.75rem (12px) - Cards
- **xl**: 1rem (16px) - Large modals
- **2xl**: 1.5rem (24px) - Extra large
- **full**: 9999px - Perfect circle/pill shape

---

## Transitions

### Using TypeScript
```typescript
import { transitions, transitionString } from '@/lib/design-tokens';

// Access durations
const duration = transitions.duration.base;        // 200ms
const fastDuration = transitions.duration.fast;    // 150ms

// Access easing
const easing = transitions.easing['in-out'];       // cubic-bezier(0.4, 0, 0.2, 1)

// Create transition string
const transition = transitionString('base', 'in-out', ['all']);
// Result: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)"
```

### Using CSS Variables
```css
/* Durations */
transition-duration: var(--transition-duration-instant);  /* 0ms */
transition-duration: var(--transition-duration-fast);     /* 150ms */
transition-duration: var(--transition-duration-base);     /* 200ms - Default */
transition-duration: var(--transition-duration-slow);     /* 300ms */

/* Easing */
transition-timing-function: var(--transition-easing-linear);    /* No easing */
transition-timing-function: var(--transition-easing-in-out);    /* Default */

/* Combined */
transition: all var(--transition-duration-base) var(--transition-easing-in-out);
```

### Common Patterns
```css
/* Smooth color transition */
transition: background-color, color, border-color
  var(--transition-duration-base) var(--transition-easing-in-out);

/* Fast feedback */
transition: box-shadow
  var(--transition-duration-fast) var(--transition-easing-in-out);

/* Slow reveal */
transition: opacity
  var(--transition-duration-slow) var(--transition-easing-in-out);
```

---

## Shadows (Elevation System)

### Using CSS Variables
```css
/* For interactive elevation */
--color-elevate-1: Light elevation (3% or 4%)
--color-elevate-2: Heavy elevation (8% or 9%)

/* Usage */
background: var(--color-elevate-1);  /* Subtle hover effect */
background: var(--color-elevate-2);  /* Strong active effect */
```

### In Components
```css
.hover-elevate:hover::after {
  background-color: var(--color-elevate-1);
}

.active-elevate-2:active::after {
  background-color: var(--color-elevate-2);
}
```

---

## Z-Index

### Using TypeScript
```typescript
import { zIndex } from '@/lib/design-tokens';

const dropdownZ = zIndex.dropdown;      // 1000
const modalZ = zIndex.modal;            // 1060
const tooltipZ = zIndex.tooltip;        // 1080
```

### Z-Index Scale
- **0**: Base layer
- **10**: Docked elements
- **1000**: Dropdowns
- **1020**: Sticky elements
- **1030**: Fixed elements
- **1040**: Backdrops
- **1050**: Offcanvas
- **1060**: Modals
- **1070**: Popovers
- **1080**: Tooltips
- **1090**: Notifications

### Usage
```css
.dropdown {
  z-index: var(--z-dropdown);      /* 1000 */
}

.modal {
  z-index: var(--z-modal);          /* 1060 */
}

.modal-backdrop {
  z-index: calc(var(--z-modal) - 1); /* 1059 */
}
```

---

## Accessibility Utilities

### Icon-Only Buttons
```typescript
import { useIconButtonA11y } from '@/lib/a11y-utils';

<button {...useIconButtonA11y("Close dialog")}>
  <X />
</button>
```

### Status Indicators
```typescript
import { useStatusA11y } from '@/lib/a11y-utils';

<div {...useStatusA11y("online")}>
  <span aria-hidden="true">●</span> Online
</div>
```

### Form Fields
```typescript
import { useFormFieldA11y } from '@/lib/a11y-utils';

<input {...useFormFieldA11y("Username", true, error)} />
```

### Navigation Links
```typescript
import { useNavLinkA11y } from '@/lib/a11y-utils';

<Link href="/dashboard" {...useNavLinkA11y(isActive)}>
  Dashboard
</Link>
```

### Table Columns
```typescript
import { useSortableColumnA11y } from '@/lib/a11y-utils';

<th {...useSortableColumnA11y("Name", sortOrder)}>
  Name
</th>
```

### Loading States
```typescript
import { useLoadingA11y } from '@/lib/a11y-utils';

<div {...useLoadingA11y(isLoading)}>
  {/* Content */}
</div>
```

---

## Card Components

### Basic Card
```typescript
import { CardVariant } from '@/components/enhanced/card-variants';

<CardVariant variant="elevated">
  <h3>Title</h3>
  <p>Content</p>
</CardVariant>
```

### With Loading State
```typescript
<CardVariant isLoading />
```

### With Error State
```typescript
<CardVariant
  error="Failed to load data"
  onRetry={() => refetch()}
/>
```

### With Empty State
```typescript
<CardVariant
  isEmpty
  emptyTitle="No hosts"
  emptyDescription="Add a host to get started"
  emptyAction={{
    label: "Add Host",
    onClick: openAddHostDialog
  }}
/>
```

### Card Variants
- **elevated**: Default, with shadow
- **outlined**: With border
- **flat**: Minimal, background only
- **action**: Interactive, clickable

### Specialized Cards
```typescript
import { AlertCard, StatCard } from '@/components/enhanced/card-variants';

// Alert card
<AlertCard
  type="critical"
  title="Alert"
  description="Something went wrong"
/>

// Stat card
<StatCard
  label="Active Hosts"
  value={42}
  change={{ value: 12, type: "increase" }}
/>
```

---

## Dark Mode

### Automatic Support
All colors automatically switch when `.dark` class is applied to root element.

### Manual Testing
```html
<!-- Add class to root to test dark mode -->
<html class="dark">
  ...
</html>
```

### In Code
```typescript
// Check if dark mode is active
const isDark = document.documentElement.classList.contains('dark');
```

---

## Common Usage Patterns

### Card with Status Color Background
```jsx
<div style={{
  backgroundColor: `hsl(var(--color-critical-50))`,
  color: `hsl(var(--color-critical-900))`
}}>
  Critical alert
</div>
```

### Hover Elevation on Card
```jsx
<Card className="hover-elevate transition-all">
  Content
</Card>
```

### Loading Skeleton
```jsx
<CardSkeleton lines={4} />
```

### Icon with Status Color
```jsx
<AlertCircle className="text-critical-500" />
```

---

## Tips & Best Practices

1. **Always use design tokens** - Don't hardcode colors
2. **Semantic naming** - Use status colors semantically (critical, warning, etc.)
3. **Light & Dark modes** - Test both modes for all components
4. **Accessibility first** - Use ARIA utilities for interactive elements
5. **Consistent spacing** - Use spacing scale for margins and padding
6. **Card variants** - Use appropriate card variant for context
7. **Contrast checking** - Verify all colors meet WCAG AA

---

## Troubleshooting

### Colors not applying?
- Check if design-tokens.css is imported in index.css
- Verify CSS variable names (double-check dashes and spelling)
- Make sure you're using `hsl(var(...))` for color values

### Dark mode not working?
- Verify `.dark` class is on root element
- Check if dark mode variables are defined in design-tokens.css
- Clear browser cache

### Accessibility issues?
- Import utilities from '@/lib/a11y-utils'
- Use semantic HTML elements
- Test with screen reader (NVDA/JAWS)
- Run axe DevTools in Chrome DevTools

---

## Need More Info?

- **Full Design Guide**: See `DESIGN_IMPROVEMENTS.md`
- **Implementation Plan**: See `PHASE_1_IMPLEMENTATION_PLAN.md`
- **Token Definitions**: See `client/src/lib/design-tokens.ts`
- **A11y Functions**: See `client/src/lib/a11y-utils.ts`
- **Card Components**: See `client/src/components/enhanced/card-variants.tsx`

---

**Last Updated**: December 3, 2025
**Version**: 1.0.0
