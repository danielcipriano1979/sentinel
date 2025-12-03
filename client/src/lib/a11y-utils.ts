/**
 * Accessibility Utilities
 *
 * Helper functions for creating accessible components following WCAG 2.1 guidelines.
 * These utilities help maintain consistent accessibility patterns across the application.
 */

/**
 * Create a descriptive aria-label for an element
 * @param text - The main label text
 * @param status - Optional status to append
 * @returns Formatted aria-label string
 */
export function createAriaLabel(text: string, status?: string): string {
  return status ? `${text}, status: ${status}` : text;
}

/**
 * Create a descriptive aria-description
 * @param text - The description text
 * @returns The description text
 */
export function createAriaDescription(text: string): string {
  return text;
}

/**
 * Create aria attributes for icon-only buttons
 * @param label - The accessible label for the button
 * @param disabled - Whether the button is disabled
 * @returns Object with aria attributes
 */
export function useIconButtonA11y(label: string, disabled?: boolean) {
  return {
    "aria-label": label,
    "aria-disabled": disabled || false,
  };
}

/**
 * Create aria attributes for status indicators
 * @param status - The status value (e.g., 'online', 'offline', 'critical')
 * @returns Object with aria attributes for status
 */
export function useStatusA11y(status: string) {
  return {
    role: "status",
    "aria-label": `Status: ${status}`,
  };
}

/**
 * Create aria attributes for loading states
 * @param isLoading - Whether the component is in a loading state
 * @returns Object with aria attributes for loading state
 */
export function useLoadingA11y(isLoading: boolean) {
  return {
    "aria-busy": isLoading,
    "aria-label": isLoading ? "Loading" : undefined,
  };
}

/**
 * Create aria attributes for error states
 * @param error - The error message
 * @param errorId - The ID of the error element
 * @returns Object with aria attributes for error state
 */
export function useErrorA11y(error: string | null, errorId?: string) {
  if (!error) {
    return { "aria-invalid": false };
  }

  return {
    "aria-invalid": true,
    "aria-describedby": errorId,
  };
}

/**
 * Create aria attributes for form fields
 * @param label - The field label
 * @param required - Whether the field is required
 * @param error - Error message if any
 * @param hint - Optional hint text
 * @returns Object with aria attributes for form field
 */
export function useFormFieldA11y(
  label: string,
  required?: boolean,
  error?: string | null,
  hint?: string
) {
  const attributes: Record<string, any> = {};

  if (required) {
    attributes["aria-required"] = true;
  }

  if (error) {
    attributes["aria-invalid"] = true;
  }

  if (error || hint) {
    attributes["aria-describedby"] = [
      error ? "error-message" : null,
      hint ? "field-hint" : null,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return attributes;
}

/**
 * Create aria attributes for navigation links
 * @param isActive - Whether this is the current page
 * @returns Object with aria attributes for navigation
 */
export function useNavLinkA11y(isActive: boolean) {
  return {
    "aria-current": isActive ? "page" : undefined,
  };
}

/**
 * Create aria attributes for sortable columns
 * @param columnName - The name of the column
 * @param sortOrder - The current sort order ('asc' | 'desc' | null)
 * @returns Object with aria attributes for sortable column
 */
export function useSortableColumnA11y(
  columnName: string,
  sortOrder: "asc" | "desc" | null = null
) {
  if (!sortOrder) {
    return {
      "aria-sort": "none" as const,
      role: "columnheader",
    };
  }

  return {
    "aria-sort": sortOrder === "asc" ? ("ascending" as const) : ("descending" as const),
    role: "columnheader",
  };
}

/**
 * Create aria attributes for expandable sections
 * @param isExpanded - Whether the section is expanded
 * @param controlId - The ID of the control element
 * @returns Object with aria attributes for expandable section
 */
export function useExpandableA11y(isExpanded: boolean, controlId?: string) {
  return {
    "aria-expanded": isExpanded,
    "aria-controls": controlId,
  };
}

/**
 * Create aria attributes for modal dialogs
 * @param labelledBy - ID of the element that labels the modal
 * @param describedBy - ID of the element that describes the modal
 * @returns Object with aria attributes for modal
 */
export function useModalA11y(labelledBy?: string, describedBy?: string) {
  return {
    role: "dialog",
    "aria-modal": true,
    "aria-labelledby": labelledBy,
    "aria-describedby": describedBy,
  };
}

/**
 * Create aria attributes for tooltips
 * @param tooltipId - The ID of the tooltip element
 * @returns Object with aria attributes for tooltip trigger
 */
export function useTooltipTriggerA11y(tooltipId: string) {
  return {
    "aria-describedby": tooltipId,
  };
}

/**
 * Create aria attributes for alerts/notifications
 * @param severity - The severity level ('error' | 'warning' | 'info' | 'success')
 * @param isLive - Whether to use aria-live for dynamic updates
 * @returns Object with aria attributes for alert
 */
export function useAlertA11y(
  severity: "error" | "warning" | "info" | "success" = "info",
  isLive: boolean = true
) {
  const roleMap = {
    error: "alert",
    warning: "alert",
    info: "status",
    success: "status",
  };

  return {
    role: roleMap[severity],
    ...(isLive && { "aria-live": "polite" }),
    "aria-atomic": true,
  };
}

/**
 * Create aria attributes for breadcrumbs
 * @returns Object with aria attributes for breadcrumb navigation
 */
export function useBreadcrumbA11y() {
  return {
    role: "navigation",
    "aria-label": "Breadcrumb",
  };
}

/**
 * Create aria attributes for search input
 * @param label - The search field label
 * @returns Object with aria attributes for search
 */
export function useSearchA11y(label: string = "Search") {
  return {
    "aria-label": label,
    role: "searchbox",
  };
}

/**
 * Create aria attributes for tables
 * @param caption - The table caption/title
 * @returns Object with aria attributes for table
 */
export function useTableA11y(caption: string) {
  return {
    role: "table",
    "aria-label": caption,
  };
}

/**
 * Create aria attributes for tabs
 * @param tabIndex - The index of the current tab
 * @param tabCount - Total number of tabs
 * @returns Object with aria attributes for tab
 */
export function useTabA11y(tabIndex: number, tabCount: number) {
  return {
    role: "tab",
    "aria-selected": tabIndex >= 0,
    "aria-posinset": (tabIndex + 1).toString(),
    "aria-setsize": tabCount.toString(),
  };
}

/**
 * Check if a color has sufficient contrast (WCAG AA)
 * This is a simplified check - for production, use a dedicated library
 * @param foreground - Foreground color in RGB format
 * @param background - Background color in RGB format
 * @returns true if contrast ratio is >= 4.5:1 (AA)
 */
export function hasMinimumContrast(
  foreground: { r: number; g: number; b: number },
  background: { r: number; g: number; b: number }
): boolean {
  const getLuminance = (color: { r: number; g: number; b: number }) => {
    const { r, g, b } = color;
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05) >= 4.5;
}

/**
 * Screen reader only content class
 * Use this class to hide content visually but keep it available to screen readers
 */
export const screenReaderOnlyClass = "sr-only";

/**
 * Utility to announce a message to screen readers
 * @param message - The message to announce
 * @param priority - The priority level ('polite' or 'assertive')
 */
export function announceToScreenReader(
  message: string,
  priority: "polite" | "assertive" = "polite"
) {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = screenReaderOnlyClass;
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Keyboard key constants for accessibility
 */
export const KEYBOARD_KEYS = {
  ENTER: "Enter",
  ESCAPE: "Escape",
  TAB: "Tab",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  SPACE: " ",
} as const;

/**
 * Hook helper for keyboard event handling
 * @param key - The key to listen for
 * @param callback - The callback function
 * @returns An object with keyboard event handlers
 */
export function useKeyboardHandler(
  key: string,
  callback: (event: React.KeyboardEvent) => void
) {
  return {
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === key) {
        callback(event);
      }
    },
  };
}

/**
 * Skip to main content link helper
 * Returns props for a skip link element
 */
export function useSkipLinkProps() {
  return {
    href: "#main-content",
    className: "sr-only focus:not-sr-only",
  };
}
