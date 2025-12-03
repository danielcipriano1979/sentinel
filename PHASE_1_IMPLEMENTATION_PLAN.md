# Phase 1 Implementation Plan - Design System Foundation

## Overview
Phase 1 focuses on establishing a solid design foundation that will support all future UI improvements. This phase is critical as it sets the standards for all subsequent work.

**Duration**: 1-2 weeks
**Estimated Hours**: 40-60 hours

---

## Task 1: Create Design Tokens System

### Objective
Build a centralized design tokens system to establish a single source of truth for all design values.

### Files to Create
```
client/src/lib/design-tokens.ts
client/src/styles/design-tokens.css
```

### Implementation Details

#### 1.1 TypeScript Design Tokens (`design-tokens.ts`)

```typescript
// Spacing scale - 0.25rem base (4px base)
export const spacing = {
  2: "0.5rem",    // 8px
  3: "0.75rem",   // 12px
  4: "1rem",      // 16px
  6: "1.5rem",    // 24px
  8: "2rem",      // 32px
  12: "3rem",     // 48px
  16: "4rem",     // 64px
} as const;

// Colors - HSL format for easy manipulation
export const colors = {
  // Primary - Blue
  primary: {
    50: "217 91% 95%",
    100: "217 91% 90%",
    500: "217 91% 42%",
    900: "217 91% 15%",
  },

  // Status Colors
  status: {
    critical: {
      light: { bg: "0 84% 95%", fg: "0 84% 20%", main: "0 84% 48%" },
      dark: { bg: "0 84% 15%", fg: "0 84% 88%", main: "0 84% 60%" },
    },
    warning: {
      light: { bg: "38 92% 95%", fg: "38 92% 20%", main: "38 92% 50%" },
      dark: { bg: "38 92% 15%", fg: "38 92% 88%", main: "38 92% 65%" },
    },
    info: {
      light: { bg: "217 91% 95%", fg: "217 91% 20%", main: "217 91% 42%" },
      dark: { bg: "217 91% 15%", fg: "217 91% 88%", main: "217 91% 58%" },
    },
    success: {
      light: { bg: "142 76% 95%", fg: "142 76% 15%", main: "142 76% 36%" },
      dark: { bg: "142 76% 15%", fg: "142 76% 88%", main: "142 76% 55%" },
    },
  },

  // Neutral grays
  neutral: {
    50: "220 15% 98%",
    100: "220 15% 95%",
    200: "220 12% 92%",
    300: "220 12% 88%",
    400: "220 12% 75%",
    500: "220 12% 60%",
    600: "220 12% 35%",
    700: "220 15% 18%",
    800: "220 14% 10%",
    900: "220 15% 8%",
  },
};

// Typography scale
export const typography = {
  sizes: {
    xs: { size: "12px", lineHeight: "1.4", letterSpacing: "0.3px" },
    sm: { size: "13px", lineHeight: "1.5", letterSpacing: "0.2px" },
    base: { size: "14px", lineHeight: "1.5", letterSpacing: "0px" },
    lg: { size: "16px", lineHeight: "1.6", letterSpacing: "-0.5px" },
    xl: { size: "18px", lineHeight: "1.6", letterSpacing: "-0.5px" },
    "2xl": { size: "22px", lineHeight: "1.5", letterSpacing: "-1px" },
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  fonts: {
    sans: '"Inter", "Helvetica Neue", sans-serif',
    mono: '"Fira Code", "Menlo", monospace',
  },
};

// Shadow system
export const shadows = {
  none: "none",
  xs: "0px 2px 0px 0px hsl(220 12% 5% / 0.05)",
  sm: "0px 2px 0px 0px hsl(220 12% 5% / 0.05), 0px 1px 2px -1px hsl(220 12% 5% / 0.08)",
  md: "0px 2px 0px 0px hsl(220 12% 5% / 0.10), 0px 2px 4px -1px hsl(220 12% 5% / 0.15)",
  lg: "0px 2px 0px 0px hsl(220 12% 5% / 0.12), 0px 4px 6px -1px hsl(220 12% 5% / 0.18)",
  xl: "0px 2px 0px 0px hsl(220 12% 5% / 0.15), 0px 8px 10px -1px hsl(220 12% 5% / 0.22)",
};

// Radius
export const borderRadius = {
  none: "0",
  xs: "0.25rem",
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  full: "9999px",
};

// Transitions
export const transitions = {
  fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
  base: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
};

// Z-index scale
export const zIndex = {
  dropdown: 1000,
  tooltip: 1100,
  modal: 1200,
  notification: 1300,
};
```

#### 1.2 CSS Design Tokens (`design-tokens.css`)

Create file that maps TypeScript tokens to CSS variables for use in stylesheets and Tailwind.

### Subtasks
- [ ] Create `/client/src/lib/design-tokens.ts` with all token definitions
- [ ] Create `/client/src/styles/design-tokens.css` mapping tokens to CSS variables
- [ ] Update Tailwind config to extend with design tokens
- [ ] Create documentation for token usage
- [ ] Test tokens in existing components

---

## Task 2: Enhance Color System with Status Colors

### Objective
Add semantic status colors to the design system for consistent alert/status messaging.

### Files to Modify
```
client/src/index.css (main stylesheet)
client/src/components/status-badge.tsx (existing)
```

### Implementation Details

#### 2.1 Update CSS Variables in `index.css`

```css
:root {
  /* Status Colors - Light Mode */
  --status-critical-50: 0 84% 95%;
  --status-critical-100: 0 84% 88%;
  --status-critical-500: 0 84% 48%;
  --status-critical-900: 0 84% 15%;

  --status-warning-50: 38 92% 95%;
  --status-warning-100: 38 92% 88%;
  --status-warning-500: 38 92% 50%;
  --status-warning-900: 38 92% 15%;

  --status-info-50: 217 91% 95%;
  --status-info-100: 217 91% 88%;
  --status-info-500: 217 91% 42%;
  --status-info-900: 217 91% 15%;

  --status-success-50: 142 76% 95%;
  --status-success-100: 142 76% 88%;
  --status-success-500: 142 76% 36%;
  --status-success-900: 142 76% 15%;
}

.dark {
  /* Status Colors - Dark Mode */
  --status-critical-50: 0 84% 15%;
  --status-critical-100: 0 84% 20%;
  --status-critical-500: 0 84% 60%;
  --status-critical-900: 0 84% 88%;

  --status-warning-50: 38 92% 15%;
  --status-warning-100: 38 92% 20%;
  --status-warning-500: 38 92% 65%;
  --status-warning-900: 38 92% 88%;

  --status-info-50: 217 91% 15%;
  --status-info-100: 217 91% 20%;
  --status-info-500: 217 91% 58%;
  --status-info-900: 217 91% 88%;

  --status-success-50: 142 76% 15%;
  --status-success-100: 142 76% 20%;
  --status-success-500: 142 76% 55%;
  --status-success-900: 142 76% 88%;
}
```

#### 2.2 Enhance Status Badge Component

Update `status-badge.tsx` to use semantic colors:

```typescript
interface StatusBadgeProps {
  status: "online" | "offline" | "idle" | "critical" | "warning";
  size?: "sm" | "md";
}

const statusColors = {
  online: { bg: "hsl(var(--status-success-50))", fg: "hsl(var(--status-success-900))" },
  offline: { bg: "hsl(var(--neutral-100))", fg: "hsl(var(--neutral-900))" },
  idle: { bg: "hsl(var(--status-warning-50))", fg: "hsl(var(--status-warning-900))" },
  critical: { bg: "hsl(var(--status-critical-50))", fg: "hsl(var(--status-critical-900))" },
  warning: { bg: "hsl(var(--status-warning-50))", fg: "hsl(var(--status-warning-900))" },
};
```

### Subtasks
- [ ] Update `index.css` with complete status color variables
- [ ] Update `status-badge.tsx` to use status colors
- [ ] Update `host-card.tsx` to use semantic status colors
- [ ] Create utility functions for status color mapping
- [ ] Test all status states in light and dark mode
- [ ] Update any alert components to use status colors

---

## Task 3: Create Advanced Card Component Variants

### Objective
Build enhanced Card component with multiple variants and states.

### Files to Create/Modify
```
client/src/components/ui/card.tsx (modify existing)
client/src/components/enhanced/card-variants.tsx (new)
client/src/components/enhanced/card-skeleton.tsx (new)
client/src/components/enhanced/card-error.tsx (new)
client/src/components/enhanced/card-empty.tsx (new)
```

### Implementation Details

#### 3.1 Enhanced Card Component with Variants

```typescript
// components/enhanced/card-variants.tsx

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "elevated" | "outlined" | "flat" | "action";
  state?: "default" | "hover" | "active" | "disabled";
  isLoading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function Card({
  variant = "elevated",
  state = "default",
  isLoading = false,
  error = null,
  isEmpty = false,
  children,
  className,
  ...props
}: CardProps) {
  if (isLoading) return <CardSkeleton />;
  if (error) return <CardError error={error} />;
  if (isEmpty) return <CardEmpty />;

  const variantStyles = {
    elevated: "bg-card border border-card-border shadow-md hover-elevate",
    outlined: "bg-background border-2 border-card-border",
    flat: "bg-card border-0",
    action: "bg-card border border-card-border cursor-pointer hover-elevate-2",
  };

  return (
    <div
      className={cn(
        "rounded-lg transition-all",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
```

#### 3.2 Skeleton Loading Component

```typescript
// components/enhanced/card-skeleton.tsx

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <Card variant="flat" className="space-y-4 p-4">
      <div className="h-6 bg-muted rounded animate-pulse" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-muted rounded animate-pulse" />
      ))}
    </Card>
  );
}

// Also add:
// - TableSkeleton
// - ChartSkeleton
// - ListSkeleton
```

#### 3.3 Error State Component

```typescript
// components/enhanced/card-error.tsx

interface CardErrorProps {
  error: string;
  onRetry?: () => void;
}

export function CardError({ error, onRetry }: CardErrorProps) {
  return (
    <Card variant="outlined" className="border-status-critical-500 bg-status-critical-50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-status-critical-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Error</h3>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          {onRetry && (
            <Button size="sm" onClick={onRetry} className="mt-3">
              Try Again
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
```

#### 3.4 Empty State Component

```typescript
// components/enhanced/card-empty.tsx

interface CardEmptyProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function CardEmpty({ icon, title, description, action }: CardEmptyProps) {
  return (
    <Card variant="flat" className="flex flex-col items-center justify-center p-12">
      <div className="text-muted-foreground mb-4">{icon}</div>
      <h3 className="font-semibold text-sm mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground text-center mb-4 max-w-xs">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </Card>
  );
}
```

### Subtasks
- [ ] Create enhanced Card component with variants
- [ ] Create CardSkeleton component
- [ ] Create CardError component
- [ ] Create CardEmpty component
- [ ] Create Storybook stories for each variant
- [ ] Update existing components to use new Card variants
- [ ] Test loading, error, and empty states
- [ ] Document component usage patterns

---

## Task 4: Add Accessibility Improvements

### Objective
Enhance semantic HTML and ARIA labels across the application.

### Files to Modify
```
client/src/components/host-card.tsx
client/src/components/app-sidebar.tsx
client/src/components/status-badge.tsx
client/src/pages/hosts.tsx
```

### Implementation Details

#### 4.1 Create Accessibility Utility Functions

```typescript
// lib/a11y-utils.ts

export function createAriaLabel(text: string, status?: string): string {
  return status ? `${text}, status: ${status}` : text;
}

export function createAriaDescription(text: string): string {
  return text;
}

// Helper for icon-only buttons
export function useIconButtonA11y(label: string, disabled?: boolean) {
  return {
    "aria-label": label,
    "aria-disabled": disabled || false,
  };
}
```

#### 4.2 Enhance HostCard Component

```typescript
// Update components/host-card.tsx

<Card
  role="article"
  aria-label={`Host: ${displayName}`}
  aria-describedby={`host-status-${host.id}`}
>
  <CardHeader>
    <div id={`host-status-${host.id}`} className="sr-only">
      {displayName} is {status}. Last seen {formatDistanceToNow(...)}
    </div>
    {/* Rest of component */}
  </CardHeader>
</Card>
```

#### 4.3 Enhance Sidebar Navigation

```typescript
// Update components/app-sidebar.tsx

<SidebarMenuButton
  asChild
  isActive={isActive(item.url)}
  aria-label={`Navigate to ${item.title}`}
  aria-current={isActive(item.url) ? "page" : undefined}
>
  <Link href={item.url}>
    <item.icon aria-hidden="true" />
    <span>{item.title}</span>
  </Link>
</SidebarMenuButton>
```

#### 4.4 Enhance StatusBadge

```typescript
// Update components/status-badge.tsx

<Badge
  variant={variant}
  role="status"
  aria-label={`Host status: ${status}`}
>
  <span aria-hidden="true" className="inline-block w-2 h-2 rounded-full mr-1" />
  {children}
</Badge>
```

### Subtasks
- [ ] Create `lib/a11y-utils.ts` with accessibility helpers
- [ ] Add `sr-only` class to `index.css` for screen reader-only content
- [ ] Update HostCard with aria-label and aria-describedby
- [ ] Update StatusBadge with role="status" and aria-label
- [ ] Update Sidebar with aria-current for active state
- [ ] Update AlertCircle, AlertTriangle icons with aria-hidden
- [ ] Test with screen reader (NVDA or JAWS)
- [ ] Run accessibility audit with axe DevTools
- [ ] Document accessibility patterns

---

## Task 5: Refine Dark Mode Colors for Better Contrast

### Objective
Ensure all colors meet WCAG AA contrast requirements in both light and dark modes.

### Files to Modify
```
client/src/index.css (main color variables)
```

### Implementation Details

#### 5.1 Review and Update Color Contrast

For dark mode, increase contrast:

```css
.dark {
  /* Increase text contrast in dark mode */
  --foreground: 220 15% 95%;        /* from 95% to ensure sufficient contrast */
  --muted-foreground: 220 12% 70%;  /* from 65% - more visible */

  /* Adjust input colors for better visibility */
  --input: 220 15% 32%;              /* from 28% - slightly lighter for focus */

  /* Ensure button text is readable */
  --primary-foreground: 220 15% 98%; /* from 98% - max contrast */

  /* Card backgrounds need adjustment */
  --card: 220 14% 12%;               /* slightly lighter than background */
  --card-border: 220 12% 20%;        /* higher contrast border */
}
```

#### 5.2 Create Contrast Testing Utilities

```typescript
// lib/contrast-checker.ts

export function getContrastRatio(rgb1: string, rgb2: string): number {
  // Implementation of WCAG contrast formula
  // Returns ratio (4.5:1 = AA, 7:1 = AAA)
}

export function isAccessible(ratio: number, level: "AA" | "AAA" = "AA"): boolean {
  const minRatio = level === "AA" ? 4.5 : 7;
  return ratio >= minRatio;
}
```

#### 5.3 Color Verification Checklist

- [ ] Text on background: 7:1 (AAA)
- [ ] Text on card: 7:1 (AAA)
- [ ] Button text: 4.5:1 (AA minimum)
- [ ] Icons: Same as text they represent
- [ ] Status colors: All legible in both modes
- [ ] Links: 4.5:1 with underline or color change on hover

### Subtasks
- [ ] Test current colors with contrast checker tool
- [ ] Adjust dark mode colors in `index.css`
- [ ] Create contrast ratio documentation
- [ ] Test with WebAIM contrast checker
- [ ] Create visual comparison screenshots
- [ ] Update color documentation with WCAG levels
- [ ] Test with color-blind simulators

---

## Implementation Checklist

### Phase 1 Completion Criteria

- [ ] All design tokens defined and documented
- [ ] CSS variables updated in main stylesheet
- [ ] Status colors implemented across the app
- [ ] Card variants working in all states
- [ ] Skeleton loaders in place
- [ ] Error and empty states functional
- [ ] Accessibility audit passes (axe)
- [ ] Dark mode contrast verified (WCAG AA minimum)
- [ ] All changes tested in Chrome, Firefox, Safari
- [ ] Documentation updated

### Testing Requirements

**Browser Testing**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Device Testing**
- [ ] Desktop (1920x1080)
- [ ] Tablet (iPad, 1024x768)
- [ ] Mobile (iPhone 12/13, 390x844)

**Accessibility Testing**
- [ ] axe DevTools
- [ ] WAVE (WebAIM)
- [ ] Screen reader (NVDA/JAWS on Windows, VoiceOver on Mac)
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Color blindness simulator (Coblis)

---

## Files Summary

### New Files to Create
```
client/src/lib/design-tokens.ts
client/src/lib/a11y-utils.ts
client/src/lib/contrast-checker.ts
client/src/styles/design-tokens.css
client/src/components/enhanced/card-variants.tsx
client/src/components/enhanced/card-skeleton.tsx
client/src/components/enhanced/card-error.tsx
client/src/components/enhanced/card-empty.tsx
```

### Files to Modify
```
client/src/index.css
client/src/components/ui/card.tsx
client/src/components/host-card.tsx
client/src/components/app-sidebar.tsx
client/src/components/status-badge.tsx
client/src/tailwind.config.js (optional - to extend with tokens)
```

---

## Success Metrics

1. **Code Quality**: All new code passes linting and type checking
2. **Design Consistency**: All components use design tokens
3. **Accessibility**: WCAG AA compliance verified
4. **Performance**: No performance regressions in metrics
5. **Test Coverage**: All new components have tests
6. **Documentation**: Components and patterns documented
7. **User Feedback**: Design improvements well-received

---

## Risks and Mitigations

### Risk: Breaking Changes in Existing Components
**Mitigation**: Keep old component APIs working, introduce new props gradually

### Risk: Accessibility Testing Takes Longer
**Mitigation**: Use automated tools first, then manual testing

### Risk: Color Contrast Issues in Dark Mode
**Mitigation**: Start with contrast checker tool before implementation

### Risk: Team Consensus on Color Changes
**Mitigation**: Create before/after comparisons for review

---

## Next Steps After Phase 1

Once Phase 1 is complete:
1. Team review of design system changes
2. Gather feedback from users
3. Document lessons learned
4. Plan Phase 2 (Components and Navigation)
5. Set up Storybook for ongoing documentation

---

## Resources

- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Radix UI Accessibility: https://www.radix-ui.com/docs/primitives/accessibility
- Tailwind CSS: https://tailwindcss.com/docs
- Design Tokens: https://www.designtokens.org/

