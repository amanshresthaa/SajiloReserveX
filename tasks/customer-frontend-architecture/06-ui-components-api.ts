/**
 * 6. UI Components & Logic
 * 
 * Component inventory with props contracts, responsibilities,
 * interaction logic, and accessibility notes for SajiloReserveX.
 */

import { type ReactNode } from "react";

// ============================================================================
// BUTTON COMPONENTS
// ============================================================================

/**
 * Primary Button Component
 * 
 * Responsibilities:
 * - Primary actions (submit forms, confirm actions)
 * - Loading state with spinner
 * - Disabled state
 * - Icon support (left/right)
 * 
 * Accessibility:
 * - aria-busy when loading
 * - aria-disabled when disabled
 * - Min 44px touch target
 * - Focus ring visible on :focus-visible
 * 
 * Based on: /components/ui/button.tsx (Shadcn)
 */
export interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  "aria-label"?: string;
}

/**
 * Usage example:
 * 
 * <Button 
 *   variant="primary" 
 *   size="lg" 
 *   loading={isSubmitting}
 *   iconLeft={<CheckIcon />}
 * >
 *   Confirm Booking
 * </Button>
 */

// ============================================================================
// FORM COMPONENTS
// ============================================================================

/**
 * Input Component
 * 
 * Responsibilities:
 * - Text input with label
 * - Error state with message
 * - Helper text
 * - Required indicator
 * 
 * Accessibility:
 * - Label associated with input (for/id)
 * - aria-describedby for helper text
 * - aria-invalid when error
 * - aria-required when required
 * - Font size ≥16px on mobile (prevents iOS zoom)
 * 
 * Based on: /components/ui/input.tsx (Shadcn)
 */
export interface InputProps {
  label: string;
  name: string;
  type?: "text" | "email" | "tel" | "password" | "url" | "search";
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "numeric" | "url" | "search";
  maxLength?: number;
  className?: string;
  "aria-label"?: string;
}

/**
 * Textarea Component
 * 
 * Similar to Input but for multi-line text
 * 
 * Additional props:
 * - rows?: number (default: 4)
 * - maxLength?: number
 * - Character counter (e.g., "450/500")
 */
export interface TextareaProps extends Omit<InputProps, "type" | "inputMode"> {
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
}

/**
 * Select Component (Dropdown)
 * 
 * Responsibilities:
 * - Dropdown selection
 * - Searchable (optional)
 * - Multi-select (optional)
 * - Custom option rendering
 * 
 * Accessibility:
 * - aria-expanded when open
 * - aria-activedescendant for focused option
 * - Keyboard navigation (↑↓ Enter Escape)
 * - aria-label for icon-only trigger
 * 
 * Based on: Radix UI Select or react-select
 */
export interface SelectProps {
  label: string;
  name: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
}

/**
 * Checkbox Component
 * 
 * Responsibilities:
 * - Boolean selection
 * - Label with generous hit area
 * - Indeterminate state (optional)
 * 
 * Accessibility:
 * - Label and checkbox share hit target (44px min)
 * - aria-checked (true/false/mixed)
 * - Focus ring on checkbox
 * - Keyboard support (Space to toggle)
 * 
 * Based on: /components/ui/checkbox.tsx (Shadcn)
 */
export interface CheckboxProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  indeterminate?: boolean;
  error?: string;
  className?: string;
  "aria-label"?: string;
}

// ============================================================================
// DATA DISPLAY COMPONENTS
// ============================================================================

/**
 * Card Component
 * 
 * Responsibilities:
 * - Container for grouped content
 * - Clickable variant (entire card is button)
 * - Header, body, footer sections
 * 
 * Accessibility:
 * - role="button" for clickable variant
 * - aria-label for clickable cards
 * - Keyboard support (Enter/Space if clickable)
 * 
 * Based on: /components/ui/card.tsx (Shadcn)
 */
export interface CardProps {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClick?: () => void;
  className?: string;
  "aria-label"?: string;
}

/**
 * Table Component
 * 
 * Responsibilities:
 * - Tabular data display
 * - Sortable columns (optional)
 * - Row selection (optional)
 * - Row actions (edit, delete, etc.)
 * 
 * Accessibility:
 * - <table> semantic HTML
 * - <thead>, <tbody>, <tfoot>
 * - <th scope="col"> for headers
 * - aria-sort for sortable columns
 * - aria-label for icon-only actions
 * - Caption for table description
 * 
 * Based on: HTML <table> + Shadcn Table (future)
 */
export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  width?: string | number;
}

export interface TableProps<T> {
  columns: Array<TableColumn<T>>;
  data: T[];
  caption?: string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyState?: ReactNode;
  className?: string;
}

/**
 * Badge Component (Status Chip)
 * 
 * Responsibilities:
 * - Display status/tags
 * - Color-coded variants
 * - Icon support
 * 
 * Accessibility:
 * - Sufficient contrast (WCAG AA)
 * - Not color-only (use text + icon)
 * - aria-label if icon-only
 * 
 * Based on: /components/ui/badge.tsx (Shadcn)
 */
export interface BadgeProps {
  variant?: "default" | "success" | "warning" | "destructive" | "secondary";
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

// ============================================================================
// DIALOG COMPONENTS
// ============================================================================

/**
 * Modal/Dialog Component
 * 
 * Responsibilities:
 * - Modal overlay with content
 * - Close on overlay click (optional)
 * - Close on Escape key
 * - Trap focus inside modal
 * - Return focus on close
 * 
 * Accessibility:
 * - role="dialog"
 * - aria-modal="true"
 * - aria-labelledby for title
 * - aria-describedby for description
 * - Focus trap (tab cycles within dialog)
 * - Focus on first interactive element on open
 * - Return focus to trigger on close
 * - Prevent body scroll when open
 * - Overlay color: rgba(0,0,0,0.5)
 * 
 * Based on: /components/ui/dialog.tsx (Shadcn/Radix)
 */
export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnOverlayClick?: boolean;
  className?: string;
}

/**
 * Alert Dialog (Confirmation)
 * 
 * Similar to Dialog but for destructive/confirmation actions
 * 
 * Additional props:
 * - variant: "warning" | "destructive"
 * - onConfirm: () => void
 * - onCancel: () => void
 * - confirmLabel: string (default: "Confirm")
 * - cancelLabel: string (default: "Cancel")
 * 
 * Based on: /components/ui/alert-dialog.tsx (Shadcn/Radix)
 */
export interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  variant?: "warning" | "destructive";
  onConfirm: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

// ============================================================================
// FEEDBACK COMPONENTS
// ============================================================================

/**
 * Toast Notification
 * 
 * Responsibilities:
 * - Temporary feedback messages
 * - Auto-dismiss after duration
 * - Manual dismiss (close button)
 * - Stack multiple toasts
 * 
 * Accessibility:
 * - role="status" or role="alert"
 * - aria-live="polite" or "assertive"
 * - Not focusable (unless action button)
 * - Screen reader announces message
 * 
 * Based on: react-hot-toast (already installed)
 */
export interface ToastProps {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number; // milliseconds (default: 4000)
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Alert Banner (Inline)
 * 
 * Responsibilities:
 * - Persistent inline messages (errors, warnings, info)
 * - Dismissible (optional)
 * - Icon + text
 * 
 * Accessibility:
 * - role="alert" for errors
 * - role="status" for info
 * - Sufficient contrast
 * - Icon is decorative (aria-hidden)
 * 
 * Based on: /components/ui/alert.tsx (Shadcn)
 */
export interface AlertProps {
  variant: "success" | "error" | "info" | "warning";
  title?: string;
  children: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Skeleton (Loading Placeholder)
 * 
 * Responsibilities:
 * - Placeholder for loading content
 * - Matches dimensions of final content
 * - Shimmer animation
 * 
 * Accessibility:
 * - aria-busy="true" on container
 * - aria-label="Loading" on container
 * 
 * Based on: /components/ui/skeleton.tsx (Shadcn)
 */
export interface SkeletonProps {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  className?: string;
}

// ============================================================================
// NAVIGATION COMPONENTS
// ============================================================================

/**
 * Pagination Component
 * 
 * Responsibilities:
 * - Page navigation for lists
 * - Previous/Next buttons
 * - Page number display/input
 * - Items per page selector (optional)
 * 
 * Accessibility:
 * - <nav aria-label="Pagination">
 * - Previous button disabled on first page (aria-disabled)
 * - Next button disabled on last page
 * - Current page indicator (aria-current="page")
 * - Keyboard support (arrow keys)
 * 
 * Based on: /components/dashboard/Pagination.tsx
 */
export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
  className?: string;
}

/**
 * Breadcrumb Component
 * 
 * Responsibilities:
 * - Show current location in hierarchy
 * - Links to parent pages
 * - Current page (not linked)
 * 
 * Accessibility:
 * - <nav aria-label="Breadcrumb">
 * - <ol> for semantic list
 * - Current page: aria-current="page"
 * - Separators are decorative (aria-hidden)
 * - schema.org BreadcrumbList markup
 */
export interface BreadcrumbItem {
  label: string;
  href?: string; // Undefined for current page
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  className?: string;
}

// ============================================================================
// BOOKING-SPECIFIC COMPONENTS
// ============================================================================

/**
 * Calendar (Date Picker)
 * 
 * Responsibilities:
 * - Date selection
 * - Disabled dates (past, fully booked)
 * - Multi-month view (optional)
 * - Range selection (optional)
 * 
 * Accessibility:
 * - Keyboard navigation (arrow keys)
 * - role="dialog" or role="grid"
 * - aria-label for month/year
 * - aria-disabled for disabled dates
 * - Focus management (Enter to select)
 * 
 * Based on: /components/ui/calendar.tsx (Shadcn/react-day-picker)
 */
export interface CalendarProps {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  minDate?: Date;
  maxDate?: Date;
  defaultMonth?: Date;
  className?: string;
}

/**
 * Time Slot Selector
 * 
 * Responsibilities:
 * - Grid of time slot buttons
 * - Availability indicators (available, few left, unavailable)
 * - Selection state
 * 
 * Accessibility:
 * - Each slot is a button
 * - aria-label includes time and availability
 * - Disabled slots: aria-disabled="true"
 * - Selected slot: aria-pressed="true"
 * - Keyboard navigation (arrow keys)
 */
export interface TimeSlot {
  time: string; // HH:MM
  available: boolean;
  slotsRemaining?: number;
}

export interface TimeSlotSelectorProps {
  slots: TimeSlot[];
  selected: string | undefined;
  onSelect: (time: string) => void;
  timezone: string;
  className?: string;
}

/**
 * Booking Summary Card
 * 
 * Responsibilities:
 * - Display booking details for review
 * - Edit links for each section
 * - Highlight key info (date, time, guests)
 * 
 * Accessibility:
 * - Semantic HTML (<dl> for key-value pairs)
 * - Edit links have descriptive labels ("Edit date and time")
 * - Icon-only edit buttons have aria-label
 */
export interface BookingSummaryProps {
  restaurantName: string;
  date: string; // Formatted date
  time: string; // Formatted time
  guests: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  specialRequests?: string;
  onEditPlan?: () => void;
  onEditDetails?: () => void;
  className?: string;
}

/**
 * Restaurant Card
 * 
 * Responsibilities:
 * - Display restaurant info (name, timezone, capacity)
 * - CTA to booking flow
 * - Clickable card or button CTA
 * 
 * Accessibility:
 * - Card has heading (<h3>)
 * - CTA button has descriptive label ("Book [Restaurant Name]")
 * - Entire card focusable if clickable
 * - Keyboard support (Enter/Space if card is clickable)
 * 
 * Based on: RestaurantCard in /app/page.tsx
 */
export interface RestaurantCardProps {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  capacity: number | null;
  onBook?: (slug: string) => void;
  className?: string;
}

// ============================================================================
// DASHBOARD COMPONENTS
// ============================================================================

/**
 * Bookings Table
 * 
 * Responsibilities:
 * - Display user's bookings in table format
 * - Status filter (all, upcoming, past)
 * - Pagination
 * - Row actions (edit, cancel, rebook)
 * - Empty state, loading state, error state
 * 
 * Accessibility:
 * - <table> semantic HTML
 * - Caption: "Your restaurant reservations"
 * - Filter buttons: role="tablist" (if styled as tabs)
 * - Action buttons: descriptive labels ("Cancel booking at [Restaurant]")
 * 
 * Based on: /components/dashboard/BookingsTable.tsx
 */
export interface BookingsTableProps {
  bookings: Array<any>; // BookingDTO[]
  page: number;
  pageSize: number;
  total: number;
  statusFilter: "all" | "upcoming" | "past";
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  onStatusFilterChange: (status: "all" | "upcoming" | "past") => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onEdit: (booking: any) => void;
  onCancel: (booking: any) => void;
  className?: string;
}

/**
 * Status Filter Group (Button Group)
 * 
 * Responsibilities:
 * - Filter bookings by status
 * - Visual indicator of active filter
 * - Count badges (optional)
 * 
 * Accessibility:
 * - role="tablist" or "group"
 * - aria-pressed for active button
 * - aria-label for group ("Filter bookings by status")
 * - Keyboard navigation (arrow keys)
 * 
 * Based on: /components/dashboard/StatusFilterGroup.tsx
 */
export interface StatusFilterGroupProps {
  value: "all" | "upcoming" | "past";
  onChange: (value: "all" | "upcoming" | "past") => void;
  counts?: { all: number; upcoming: number; past: number };
  className?: string;
}

// ============================================================================
// EMPTY STATES
// ============================================================================

/**
 * Empty State Component
 * 
 * Responsibilities:
 * - Communicate no data scenario
 * - Provide helpful next action
 * - Illustration/icon (optional)
 * 
 * Accessibility:
 * - Heading describes state
 * - Body provides context
 * - CTA is actionable button/link
 * - Icon is decorative (aria-hidden)
 * 
 * Based on: /components/dashboard/EmptyState.tsx
 */
export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

// ============================================================================
// ERROR STATES
// ============================================================================

/**
 * Error State Component
 * 
 * Similar to Empty State but for errors
 * 
 * Additional props:
 * - error: Error object
 * - onRetry: () => void
 */
export interface ErrorStateProps {
  error: Error | string;
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

// ============================================================================
// KEYBOARD SUPPORT SUMMARY
// ============================================================================

/**
 * Keyboard Support Requirements (WCAG 2.2 AA)
 * 
 * All interactive elements must support keyboard:
 * 
 * - Tab: Navigate to next interactive element
 * - Shift+Tab: Navigate to previous
 * - Enter: Activate button/link
 * - Space: Activate button, toggle checkbox
 * - Escape: Close modal/dialog, cancel action
 * - Arrow keys: Navigate within components (menu, tabs, calendar)
 * - Home/End: Jump to start/end of list
 * 
 * Modal-specific:
 * - Tab/Shift+Tab: Cycle within modal (focus trap)
 * - Escape: Close modal
 * - Focus returns to trigger element on close
 * 
 * Table-specific:
 * - Arrow keys: Navigate cells (optional, depends on design)
 * - Enter: Activate row action
 * 
 * Calendar-specific:
 * - Arrow keys: Navigate dates
 * - Page Up/Down: Previous/next month
 * - Enter/Space: Select date
 * - Escape: Close calendar
 */

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Component interfaces exported above
};
