/**
 * Enhanced Card Component Variants
 *
 * Provides multiple card variants and states for different use cases:
 * - Elevated: Card with shadow (default)
 * - Outlined: Card with border
 * - Flat: Minimal card with background color only
 * - Action: Interactive card for clickable content
 *
 * States:
 * - Default: Normal state
 * - Loading: Shows skeleton loader
 * - Error: Shows error state with message
 * - Empty: Shows empty state with icon and message
 */

import React from "react";
import { AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ============================================
// Card Variants
// ============================================

export type CardVariant = "elevated" | "outlined" | "flat" | "action";
export type CardState = "default" | "hover" | "active" | "disabled";

interface CardVariantProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The visual variant of the card
   * - elevated: Card with shadow (default, recommended)
   * - outlined: Card with border
   * - flat: Minimal card with background only
   * - action: Interactive card for clickable elements
   */
  variant?: CardVariant;

  /**
   * The current state of the card
   */
  state?: CardState;

  /**
   * Show loading skeleton instead of content
   */
  isLoading?: boolean;

  /**
   * Error message to display
   * When set, shows error state
   */
  error?: string | null;

  /**
   * Show empty state
   */
  isEmpty?: boolean;

  /**
   * Icon for empty state
   */
  emptyIcon?: React.ReactNode;

  /**
   * Title for empty state
   */
  emptyTitle?: string;

  /**
   * Description for empty state
   */
  emptyDescription?: string;

  /**
   * Callback when retry button is clicked
   */
  onRetry?: () => void;

  /**
   * Action button for empty state
   */
  emptyAction?: {
    label: string;
    onClick: () => void;
  };

  /**
   * Whether to show focus styles
   */
  focusable?: boolean;
}

/**
 * Enhanced Card component with variants and states
 * Handles loading, error, and empty states automatically
 */
export const CardVariant = React.forwardRef<
  HTMLDivElement,
  CardVariantProps
>(
  (
    {
      variant = "elevated",
      state = "default",
      isLoading = false,
      error = null,
      isEmpty = false,
      emptyIcon,
      emptyTitle,
      emptyDescription,
      onRetry,
      emptyAction,
      focusable = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // Handle different states
    if (isLoading) {
      return (
        <CardSkeleton variant={variant} />
      );
    }

    if (error) {
      return (
        <CardError variant={variant} error={error} onRetry={onRetry} />
      );
    }

    if (isEmpty) {
      return (
        <CardEmpty
          variant={variant}
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      );
    }

    // Variant styles
    const variantStyles: Record<CardVariant, string> = {
      elevated:
        "bg-card border border-card-border shadow-md hover-elevate transition-all",
      outlined:
        "bg-background border-2 border-card-border hover-elevate transition-all",
      flat: "bg-card border-0 transition-all",
      action:
        "bg-card border border-card-border cursor-pointer hover-elevate-2 transition-all active-elevate-2",
    };

    // State styles
    const stateStyles: Record<CardState, string> = {
      default: "",
      hover: "shadow-lg",
      active: "shadow-md",
      disabled: "opacity-50 cursor-not-allowed pointer-events-none",
    };

    // Focus styles (if focusable)
    const focusStyles = focusable
      ? "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      : "";

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg",
          variantStyles[variant],
          stateStyles[state],
          focusStyles,
          className
        )}
        {...(focusable && { tabIndex: 0 })}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardVariant.displayName = "CardVariant";

// ============================================
// Card Skeleton (Loading State)
// ============================================

interface CardSkeletonProps {
  variant?: CardVariant;
  lines?: number;
  showHeader?: boolean;
}

/**
 * Skeleton loader for card content
 * Used while content is loading
 */
export function CardSkeleton({
  variant = "elevated",
  lines = 3,
  showHeader = true,
}: CardSkeletonProps) {
  const variantStyles: Record<CardVariant, string> = {
    elevated: "bg-card border border-card-border shadow-md",
    outlined: "bg-background border-2 border-card-border",
    flat: "bg-card border-0",
    action: "bg-card border border-card-border",
  };

  return (
    <div className={cn("rounded-lg p-4 space-y-4", variantStyles[variant])}>
      {showHeader && <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-4 bg-muted rounded animate-pulse",
              i === lines - 1 && "w-2/3"
            )}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// Card Error State
// ============================================

interface CardErrorProps {
  variant?: CardVariant;
  error: string;
  onRetry?: () => void;
  title?: string;
  showIcon?: boolean;
}

/**
 * Error state card
 * Shows error message with optional retry button
 */
export function CardError({
  variant = "elevated",
  error,
  onRetry,
  title = "Error",
  showIcon = true,
}: CardErrorProps) {
  const variantStyles: Record<CardVariant, string> = {
    elevated: "bg-status-critical-50 border border-status-critical-500 shadow-md",
    outlined: "bg-background border-2 border-status-critical-500",
    flat: "bg-status-critical-50 border-0",
    action: "bg-status-critical-50 border border-status-critical-500",
  };

  return (
    <div
      className={cn("rounded-lg p-4", variantStyles[variant])}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {showIcon && (
          <AlertCircle className="h-5 w-5 text-status-critical-500 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-status-critical-900">
            {title}
          </h3>
          <p className="text-sm text-status-critical-800 mt-1 break-words">
            {error}
          </p>
          {onRetry && (
            <Button
              size="sm"
              onClick={onRetry}
              className="mt-3"
              variant="outline"
            >
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Card Empty State
// ============================================

interface CardEmptyProps {
  variant?: CardVariant;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  showIcon?: boolean;
}

/**
 * Empty state card
 * Shows when there's no content to display
 */
export function CardEmpty({
  variant = "elevated",
  icon = <Info className="h-12 w-12 text-muted-foreground" />,
  title = "No Data",
  description = "There's nothing to show here yet",
  action,
  showIcon = true,
}: CardEmptyProps) {
  const variantStyles: Record<CardVariant, string> = {
    elevated: "bg-card border border-card-border shadow-md",
    outlined: "bg-background border-2 border-card-border",
    flat: "bg-card border-0",
    action: "bg-card border border-card-border",
  };

  return (
    <div
      className={cn(
        "rounded-lg flex flex-col items-center justify-center p-12 text-center",
        variantStyles[variant]
      )}
    >
      {showIcon && (
        <div className="text-muted-foreground mb-4">{icon}</div>
      )}
      {title && <h3 className="font-semibold text-sm mb-2">{title}</h3>}
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}

// ============================================
// Specialized Card Variants
// ============================================

/**
 * Alert Card - For displaying important notifications
 */
interface AlertCardProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "info" | "warning" | "critical" | "success";
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const AlertCard = React.forwardRef<HTMLDivElement, AlertCardProps>(
  ({ type = "info", title, description, action, className, ...props }, ref) => {
    const colorMap = {
      info: {
        bg: "bg-info-50",
        border: "border-info-500",
        icon: "text-info-500",
        title: "text-info-900",
      },
      warning: {
        bg: "bg-warning-50",
        border: "border-warning-500",
        icon: "text-warning-500",
        title: "text-warning-900",
      },
      critical: {
        bg: "bg-critical-50",
        border: "border-critical-500",
        icon: "text-critical-500",
        title: "text-critical-900",
      },
      success: {
        bg: "bg-success-50",
        border: "border-success-500",
        icon: "text-success-500",
        title: "text-success-900",
      },
    };

    const colors = colorMap[type];

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border p-4",
          colors.bg,
          colors.border,
          className
        )}
        role="alert"
        {...props}
      >
        <div className="flex gap-3">
          <div className="flex-1">
            {title && (
              <h4 className={cn("font-semibold text-sm", colors.title)}>
                {title}
              </h4>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      </div>
    );
  }
);

AlertCard.displayName = "AlertCard";

/**
 * Stat Card - For displaying metrics/statistics
 */
interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
  };
  icon?: React.ReactNode;
  subtext?: string;
}

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, value, change, icon, subtext, className, ...props }, ref) => {
    return (
      <Card ref={ref} className={cn("p-4", className)} {...props}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtext && (
              <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
            )}
          </div>
          {icon && (
            <div className="flex-shrink-0 ml-2 text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
        {change && (
          <div
            className={cn(
              "text-xs font-medium mt-3",
              change.type === "increase"
                ? "text-success-600"
                : "text-critical-600"
            )}
          >
            {change.type === "increase" ? "↑" : "↓"} {Math.abs(change.value)}%
          </div>
        )}
      </Card>
    );
  }
);

StatCard.displayName = "StatCard";
