# Phase 1 Integration Checklist

Use this checklist to systematically integrate the new design system into your existing components.

---

## Preparation Phase

- [ ] Review `PHASE_1_COMPLETION_SUMMARY.md`
- [ ] Review `DESIGN_IMPROVEMENTS.md`
- [ ] Review `DESIGN_TOKENS_QUICK_REFERENCE.md`
- [ ] Ensure all new files are created:
  - [ ] `client/src/lib/design-tokens.ts`
  - [ ] `client/src/styles/design-tokens.css`
  - [ ] `client/src/lib/a11y-utils.ts`
  - [ ] `client/src/components/enhanced/card-variants.tsx`
- [ ] Verify `client/src/index.css` has design-tokens import
- [ ] Run `npm run build` to verify no errors

---

## Color System Integration

### Update CSS Variables in Components
- [ ] Review existing color usage in stylesheets
- [ ] Replace hardcoded colors with CSS variables:
  ```css
  /* Before */
  color: #rgb(0, 0, 0);

  /* After */
  color: hsl(var(--color-text-primary));
  ```
- [ ] Check all status colors use new status variables
- [ ] Verify dark mode colors look correct

### Components to Review
- [ ] `host-card.tsx` - Check alert colors
- [ ] `status-badge.tsx` - Use status color variables
- [ ] `metrics-chart.tsx` - Verify chart colors
- [ ] `app-sidebar.tsx` - Check sidebar colors
- [ ] All page components - General color usage

### Color Conversion Examples
```css
/* Status colors */
--status-critical: hsl(var(--color-critical-500));
--status-warning: hsl(var(--color-warning-500));
--status-success: hsl(var(--color-success-500));

/* Text colors */
--text-primary: hsl(var(--color-text-primary));
--text-secondary: hsl(var(--color-text-secondary));

/* Background colors */
--bg-primary: hsl(var(--color-bg-primary));
--bg-secondary: hsl(var(--color-bg-secondary));
```

---

## Accessibility Enhancement

### Update Existing Components with A11y Utilities

#### HostCard Component
- [ ] Import `useStatusA11y` from a11y-utils
- [ ] Add ARIA attributes to card element:
  ```typescript
  <Card
    role="article"
    aria-label={`Host: ${displayName}`}
    aria-describedby={`host-status-${host.id}`}
  >
    <div id={`host-status-${host.id}`} className="sr-only">
      {description for screen readers}
    </div>
  </Card>
  ```
- [ ] Add status badge ARIA:
  ```typescript
  <StatusBadge {...useStatusA11y(status)} />
  ```
- [ ] Test with screen reader

#### StatusBadge Component
- [ ] Add role="status"
- [ ] Add aria-label with status text
- [ ] Ensure icon has aria-hidden="true"
- [ ] Test with axe DevTools

#### App Sidebar Component
- [ ] Add aria-label to navigation
- [ ] Use `useNavLinkA11y` for active links:
  ```typescript
  <Link href={url} {...useNavLinkA11y(isActive)}>
    {title}
  </Link>
  ```
- [ ] Add keyboard navigation support
- [ ] Test with keyboard (Tab, Enter, Arrow keys)

#### Form Components
- [ ] Import `useFormFieldA11y`
- [ ] Add ARIA attributes to inputs:
  ```typescript
  <input {...useFormFieldA11y(label, required, error, hint)} />
  ```
- [ ] Add error message IDs and association
- [ ] Add help text IDs and association
- [ ] Test form accessibility

### Accessibility Audit
- [ ] Run axe DevTools scan
- [ ] Check for contrast issues
- [ ] Verify keyboard navigation works
- [ ] Test with screen reader (VoiceOver/NVDA)
- [ ] Check for ARIA errors

---

## Card Component Migration

### Update Existing Card Usage

#### Dashboard Cards
- [ ] Identify all Card components in dashboard
- [ ] Replace with `CardVariant` where applicable:
  ```typescript
  // Before
  <Card><CardContent>...</CardContent></Card>

  // After
  <CardVariant variant="elevated">
    <CardContent>...</CardContent>
  </CardVariant>
  ```
- [ ] Add loading states:
  ```typescript
  <CardVariant isLoading={isLoading} />
  ```
- [ ] Add error states:
  ```typescript
  <CardVariant error={error} onRetry={refetch} />
  ```
- [ ] Add empty states:
  ```typescript
  <CardVariant isEmpty emptyTitle="No data" />
  ```

#### Host Cards
- [ ] Review `host-card.tsx`
- [ ] Add loading skeleton support
- [ ] Add error state handling
- [ ] Verify status colors use new system

#### Alert/Notification Cards
- [ ] Use `AlertCard` component for alerts:
  ```typescript
  <AlertCard type="critical" title="Error" description="..." />
  ```

#### Metric Cards
- [ ] Use `StatCard` for statistics:
  ```typescript
  <StatCard label="Active" value={42} change={{ value: 10, type: "increase" }} />
  ```

### Card Variant Usage
- [ ] Test "elevated" variant (default)
- [ ] Test "outlined" variant
- [ ] Test "flat" variant
- [ ] Test "action" variant
- [ ] Verify all variants look correct in light mode
- [ ] Verify all variants look correct in dark mode

### State Testing
- [ ] Test loading state (skeleton)
- [ ] Test error state with retry
- [ ] Test empty state with action
- [ ] Test disabled state
- [ ] Test hover state

---

## Typography Integration

### Review Typography Usage
- [ ] Check font family usage - should use var(--font-sans) or var(--font-mono)
- [ ] Verify font sizes match design token scale
- [ ] Check font weights are semantic (regular, medium, semibold, bold)

### Components to Update
- [ ] Headings - Use consistent sizes
- [ ] Body text - Use base size
- [ ] Labels - Use sm size
- [ ] Captions - Use xs size
- [ ] Code blocks - Use font-mono

### Typography Checklist
- [ ] All text uses design token font sizes
- [ ] Font weights are semantic
- [ ] Line heights are appropriate
- [ ] Letter spacing matches token values
- [ ] Monospace font used for code

---

## Spacing Integration

### Review Spacing Usage
- [ ] Replace hardcoded px values with spacing tokens:
  ```css
  /* Before */
  padding: 16px;
  margin: 24px;
  gap: 12px;

  /* After (using CSS variables) */
  padding: 1rem;      /* spacing[4] */
  margin: 1.5rem;     /* spacing[6] */
  gap: 0.75rem;       /* spacing[3] */
  ```

### Components to Update
- [ ] Card padding
- [ ] Section margins
- [ ] Grid gaps
- [ ] List item spacing
- [ ] Button padding

### Spacing Checklist
- [ ] All padding uses spacing scale
- [ ] All margins use spacing scale
- [ ] All gaps use spacing scale
- [ ] Consistent spacing between sections
- [ ] Mobile padding appropriately sized

---

## Shadow Integration

### Review Shadow Usage
- [ ] Replace hardcoded box-shadows with tokens:
  ```css
  /* Before */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  /* After */
  box-shadow: var(--shadow-md);
  ```

### Shadow Application
- [ ] Cards use appropriate shadows
- [ ] Modals use shadow-xl
- [ ] Buttons have subtle shadows on hover
- [ ] Elevation system shadows working
- [ ] Dark mode shadows look correct

---

## Border Radius Integration

### Review Radius Usage
- [ ] Update border-radius values:
  ```css
  /* Before */
  border-radius: 8px;

  /* After */
  border-radius: var(--radius-md);
  ```

### Components to Update
- [ ] Cards - Use radius-lg
- [ ] Buttons - Use radius-md
- [ ] Modals - Use radius-xl
- [ ] Badges - Use radius-sm
- [ ] Input fields - Use radius-md

---

## Transition Integration

### Review Animation Usage
- [ ] Update transition durations:
  ```css
  /* Before */
  transition: all 200ms ease-in-out;

  /* After */
  transition: all var(--transition-duration-base) var(--transition-easing-in-out);
  ```

### Animation Checklist
- [ ] All transitions use design tokens
- [ ] Durations are consistent
- [ ] Easing is appropriate
- [ ] No animations in prefers-reduced-motion
- [ ] Performance is good (60fps)

---

## Testing & Validation

### Visual Testing
- [ ] Light mode appearance correct
- [ ] Dark mode appearance correct
- [ ] All colors have sufficient contrast
- [ ] Shadows visible and appropriate
- [ ] Spacing is consistent
- [ ] Typography is readable

### Accessibility Testing
- [ ] axe DevTools scan passes
- [ ] Keyboard navigation works
- [ ] Screen reader reads all content
- [ ] Color not only indicator
- [ ] Focus indicators visible
- [ ] ARIA labels appropriate

### Browser Testing
- [ ] Chrome/Edge latest
- [ ] Firefox latest
- [ ] Safari latest
- [ ] Mobile Chrome
- [ ] Mobile Safari

### Device Testing
- [ ] Desktop (1920x1080)
- [ ] Laptop (1440x900)
- [ ] Tablet (1024x768)
- [ ] Mobile (390x844)
- [ ] Responsive breakpoints work

### Performance Testing
- [ ] No performance regression
- [ ] Build time acceptable
- [ ] Runtime speed acceptable
- [ ] CSS file size reasonable

---

## Documentation

### Update Component Documentation
- [ ] Add design tokens to component storybook stories
- [ ] Document card variants usage
- [ ] Document accessibility patterns
- [ ] Add examples of each pattern
- [ ] Include dark mode examples

### Team Communication
- [ ] Share DESIGN_TOKENS_QUICK_REFERENCE.md with team
- [ ] Hold design system workshop
- [ ] Document migration path for existing code
- [ ] Create component usage guidelines
- [ ] Set up design system documentation site (optional)

---

## Phase 2 Preparation

### Components to Plan for Phase 2
- [ ] Command Palette
- [ ] Breadcrumb Navigation
- [ ] Enhanced Tables
- [ ] Form Components
- [ ] Loading Skeletons
- [ ] Additional card variants

### Design System Extension
- [ ] Plan for additional tokens needed
- [ ] Identify new component patterns
- [ ] Plan accessibility improvements
- [ ] Plan performance optimizations

---

## Sign-Off

### Team Review
- [ ] Code review completed
- [ ] Design review completed
- [ ] Accessibility review completed
- [ ] Performance review completed

### Deployment
- [ ] All changes merged to main
- [ ] Tests passing in CI/CD
- [ ] Build successful
- [ ] Deployed to staging
- [ ] Deployed to production

### Post-Launch
- [ ] Monitor for any issues
- [ ] Gather user feedback
- [ ] Track performance metrics
- [ ] Plan improvements

---

## Rollback Plan

If issues are discovered:

1. **Minor Issues**: Fix and update in-place
2. **Major Issues**: Revert design tokens changes
3. **Critical Issues**: Full rollback to previous commit

**Rollback Command**:
```bash
git revert <commit-hash>
```

---

## Success Criteria

✅ **Code Quality**: All code passes linting and type checking
✅ **Design Consistency**: All components use design tokens
✅ **Accessibility**: WCAG AA compliance verified
✅ **Performance**: No regressions detected
✅ **Testing**: All tests passing
✅ **Documentation**: Complete and accurate

---

## Notes

### Known Limitations
- None at this time

### Future Improvements
- Storybook setup for component documentation
- Visual regression testing
- Automated accessibility testing
- Design token generation from design tools

---

## Support

For questions or issues:
1. Check `DESIGN_TOKENS_QUICK_REFERENCE.md`
2. Review component examples
3. Check accessibility utilities documentation
4. Ask in team chat

---

**Checklist Version**: 1.0.0
**Last Updated**: December 3, 2025
**Status**: Ready for integration
