"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { track } from "@/lib/analytics";
import { DEFAULT_RESTAURANT_ID, DEFAULT_VENUE } from "@/lib/venue";

// =============================================================================================
// ICONS (using lucide-react conventions for consistency with shadcn/ui)
// =============================================================================================
const Icon = {
  Calendar: (p: React.SVGProps<SVGSVGElement>) => (
    <svg
      {...p}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  ),
  Users: (p: React.SVGProps<SVGSVGElement>) => (
    <svg
      {...p}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="m18 8-3.49 3.5" />
    </svg>
  ),
  Clock: (p: React.SVGProps<SVGSVGElement>) => (
    <svg
      {...p}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  Utensils: (p: React.SVGProps<SVGSVGElement>) => (
    <svg
      {...p}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3z" />
    </svg>
  ),
  Chair: (p: React.SVGProps<SVGSVGElement>) => (
    <svg
      {...p}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6" />
      <path d="M18 12h-2V7a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v5H5" />
      <path d="M4 20h16" />
    </svg>
  ),
  Info: (p: React.SVGProps<SVGSVGElement>) => (
    <svg
      {...p}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  ),
  Check: (p: React.SVGProps<SVGSVGElement>) => (
    <svg
      {...p}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  CheckCircle: (p: React.SVGProps<SVGSVGElement>) => (
    <svg
      {...p}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  ),
  AlertCircle: (p: React.SVGProps<SVGSVGElement>) => (
    <svg
      {...p}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  ),
  ChevronLeft: (p: React.SVGProps<SVGSVGElement>) => (
    <svg
      {...p}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  ),
  ChevronDown: (p: React.SVGProps<SVGSVGElement>) => (
    <svg
      {...p}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  Pencil: (p: React.SVGProps<SVGSVGElement>) => (
    <svg
      {...p}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  ),
  Trash2: (p: React.SVGProps<SVGSVGElement>) => (
    <svg
      {...p}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  ),
  Spinner: (p: React.SVGProps<SVGSVGElement>) => (
    <svg
      {...p}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
};

// =============================================================================================
// UTILITIES
// =============================================================================================
const storageKeys = {
  contacts: "bookingflow-contacts",
};

type BookingType = "lunch" | "dinner" | "drinks";

const BOOKING_TYPE_LABELS: Record<BookingType, string> = {
  lunch: "Lunch",
  dinner: "Dinner",
  drinks: "Drinks & cocktails",
};

const U = {
  cn: (...inputs: Array<string | false | undefined | null>) => inputs.filter(Boolean).join(" "),
  isUKPhone(value: string) {
    return /^(?:\+44|44|0)7\d{9}$/.test(value.replace(/\s/g, ""));
  },
  isEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },
  formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Europe/London",
    });
  },
  normalizeTime(value: string) {
    if (!value) return "";
    const trimmed = value.trim();
    if (trimmed.length >= 5) return trimmed.slice(0, 5);
    return trimmed;
  },
  formatTime(time: string) {
    const normalized = U.normalizeTime(time);
    if (!normalized) return "";
    return new Date(`1970-01-01T${normalized}:00`).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/London",
    });
  },
  formatSummaryDate(date: string) {
    if (!date) return "";
    const parts = new Intl.DateTimeFormat("en-GB", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      timeZone: "Europe/London",
    }).formatToParts(new Date(`${date}T00:00:00Z`));
    const month = parts.find((part) => part.type === "month")?.value ?? "";
    const day = parts.find((part) => part.type === "day")?.value ?? "";
    const year = parts.find((part) => part.type === "year")?.value ?? "";
    return [month, day, year].filter(Boolean).join(" ").trim();
  },
  timeToMinutes(time: string) {
    const normalized = U.normalizeTime(time);
    if (!normalized) return 0;
    const [hours, minutes] = normalized.split(":").map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  },
  slotsForRange(start: string = "12:00", end: string = "22:00", step: number = 30) {
    const out: string[] = [];
    let cursor = new Date(`1970-01-01T${start}:00`);
    const endDt = new Date(`1970-01-01T${end}:00`);
    while (cursor < endDt) {
      out.push(cursor.toTimeString().slice(0, 5));
      cursor = new Date(cursor.getTime() + step * 60000);
    }
    return out;
  },
  serviceWindows(dateStr: string) {
    const day = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
    const isWeekend = day === 5 || day === 6;
    const isSunday = day === 0;

    const lunch: { start: string; end: string } = isWeekend
      ? { start: "11:30", end: "16:00" }
      : isSunday
        ? { start: "11:30", end: "15:30" }
        : { start: "12:00", end: "15:30" };

    const dinner: { start: string; end: string } = isWeekend
      ? { start: "18:00", end: "23:00" }
      : isSunday
        ? { start: "17:30", end: "21:30" }
        : { start: "17:30", end: "22:00" };

    const drinks: { start: string; end: string } = isWeekend
      ? { start: "15:00", end: "23:00" }
      : { start: "15:00", end: "22:30" };

    return { lunch, dinner, drinks };
  },
  slotsByService(dateStr: string) {
    const windows = U.serviceWindows(dateStr);
    return {
      lunch: U.slotsForRange(windows.lunch.start, windows.lunch.end),
      dinner: U.slotsForRange(windows.dinner.start, windows.dinner.end),
      drinks: U.slotsForRange(windows.drinks.start, windows.drinks.end),
    } satisfies Record<BookingType, string[]>;
  },
  bookingTypeFromTime(time: string, dateStr: string): BookingType {
    const windows = U.serviceWindows(dateStr);
    const minutes = U.timeToMinutes(time);
    const inRange = (window: { start: string; end: string }) => {
      const startMinutes = U.timeToMinutes(window.start);
      const endMinutes = U.timeToMinutes(window.end);
      return minutes >= startMinutes && minutes < endMinutes;
    };

    if (inRange(windows.lunch)) return "lunch";
    if (inRange(windows.dinner)) return "dinner";
    if (inRange(windows.drinks)) return "drinks";

    return minutes >= U.timeToMinutes(windows.dinner.start) ? "dinner" : "lunch";
  },
  formatForDateInput(value: Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  },
  formatBookingLabel(type: BookingType) {
    return BOOKING_TYPE_LABELS[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  },
};

// =============================================================================================
// SHADCN-LIKE COMPONENT MOCKS (for single-file portability)
// =============================================================================================
type ButtonVariant = "default" | "destructive" | "outline" | "ghost";
type ButtonSize = "default" | "sm" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      className={U.cn(
        "flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", type, ...props }, ref) => {
    const variants: Record<ButtonVariant, string> = {
      default: "bg-slate-900 text-white hover:bg-slate-700",
      destructive: "bg-red-500 text-white hover:bg-red-600",
      outline: "border border-slate-300 bg-transparent hover:bg-slate-100",
      ghost: "hover:bg-slate-100",
    };
    const sizes: Record<ButtonSize, string> = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
    };
    return (
      <button
        className={U.cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className,
        )}
        ref={ref}
        type={type ?? "button"}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={U.cn("rounded-xl border bg-white text-slate-900 shadow", className)} {...props} />
);
const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={U.cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
);
const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h3 className={U.cn("font-semibold leading-none tracking-tight", className)} {...props} />
);
const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={U.cn("text-sm text-slate-500", className)} {...props} />
);
const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={U.cn("p-6 pt-0", className)} {...props} />
);
const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={U.cn("flex items-center p-6 pt-0", className)} {...props} />
);

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      className={U.cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
      ref={ref}
      {...props}
    />
  ),
);
Label.displayName = "Label";

const Checkbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      type="checkbox"
      ref={ref}
      className={U.cn(
        "h-4 w-4 shrink-0 rounded-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Checkbox.displayName = "Checkbox";

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        className={U.cn(
          "h-10 w-full appearance-none rounded-md border border-slate-300 bg-transparent pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      <Icon.ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
    </div>
  ),
);
Select.displayName = "Select";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={U.cn(
        "flex min-h-[80px] w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

const AlertDialog: React.FC<{
  open: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
  onConfirm: () => void;
  title: string;
  description: string;
}> = ({ open, onOpenChange, onConfirm, title, description }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => onOpenChange(false)}>
      <div
        className="relative m-4 w-full max-w-md rounded-lg bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
        </div>
        <div className="flex justify-end gap-2 rounded-b-lg bg-slate-50 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================================
// STATE TYPES & HELPERS
// =============================================================================================
type SeatingOption = "any" | "indoor" | "outdoor";

type ApiBooking = {
  id: string;
  restaurant_id: string;
  table_id: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  reference: string;
  party_size: number;
  booking_type: BookingType;
  seating_preference: SeatingOption;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string | null;
  marketing_opt_in: boolean;
  loyalty_points_awarded: number;
  created_at: string;
  updated_at: string;
};

/* eslint-disable no-unused-vars */
type BookingEditHandler = (booking: ApiBooking) => void;
type BookingMutationHandler = (booking: ApiBooking) => Promise<void> | void;
/* eslint-enable no-unused-vars */

type BookingDetails = {
  bookingId: string | null;
  restaurantId: string;
  date: string;
  time: string;
  party: number;
  bookingType: BookingType;
  seating: SeatingOption;
  notes: string;
  name: string;
  email: string;
  phone: string;
  rememberDetails: boolean;
  agree: boolean;
  marketingOptIn: boolean;
};

type LastAction = "create" | "update" | "waitlist" | null;

type State = {
  step: 1 | 2 | 3 | 4;
  submitting: boolean;
  loading: boolean;
  error: string | null;
  editingId: string | null;
  lastAction: LastAction;
  waitlisted: boolean;
  bookings: ApiBooking[];
  details: BookingDetails;
  lastConfirmed: ApiBooking | null;
};

type Action =
  | { type: "SET_STEP"; step: State["step"] }
  | { type: "SET_FIELD"; key: keyof BookingDetails; value: BookingDetails[keyof BookingDetails] }
  | { type: "SET_SUBMITTING"; value: boolean }
  | { type: "SET_LOADING"; value: boolean }
  | { type: "SET_ERROR"; message: string | null }
  | { type: "SET_BOOKINGS"; bookings: ApiBooking[] }
  | {
      type: "SET_CONFIRMATION";
      payload: {
        bookings: ApiBooking[];
        booking: ApiBooking | null;
        lastAction: Exclude<LastAction, null>;
        waitlisted: boolean;
      };
    }
  | { type: "START_EDIT"; bookingId: string }
  | { type: "RESET_FORM" }
  | {
      type: "HYDRATE_CONTACTS";
      payload: Pick<BookingDetails, "name" | "email" | "phone"> & { rememberDetails?: boolean };
    };

const getInitialDetails = (): BookingDetails => ({
  bookingId: null,
  restaurantId: DEFAULT_RESTAURANT_ID,
  date: U.formatForDateInput(new Date()),
  time: "",
  party: 2,
  bookingType: "lunch",
  seating: "any",
  notes: "",
  name: "",
  email: "",
  phone: "",
  rememberDetails: false,
  agree: false,
  marketingOptIn: false,
});

const getInitialState = (): State => ({
  step: 1,
  submitting: false,
  loading: false,
  error: null,
  editingId: null,
  lastAction: null,
  waitlisted: false,
  bookings: [],
  details: getInitialDetails(),
  lastConfirmed: null,
});

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.step, error: null };
    case "SET_FIELD":
      return {
        ...state,
        error: null,
        details: {
          ...state.details,
          [action.key]: action.value,
        },
      };
    case "SET_SUBMITTING":
      return { ...state, submitting: action.value };
    case "SET_LOADING":
      return { ...state, loading: action.value };
    case "SET_ERROR":
      return { ...state, error: action.message };
    case "SET_BOOKINGS":
      return { ...state, bookings: action.bookings };
    case "SET_CONFIRMATION": {
      const { bookings, booking, lastAction, waitlisted } = action.payload;
      const updatedDetails = {
        ...state.details,
        bookingId: booking ? booking.id : null,
        restaurantId: booking ? booking.restaurant_id : state.details.restaurantId,
        date: booking ? booking.booking_date : state.details.date,
        time: booking ? U.normalizeTime(booking.start_time) : state.details.time,
        party: booking ? booking.party_size : state.details.party,
        bookingType: booking ? (booking.booking_type as BookingType) : state.details.bookingType,
        seating: booking ? booking.seating_preference : state.details.seating,
        notes: booking?.notes ?? state.details.notes,
        marketingOptIn: booking ? booking.marketing_opt_in : state.details.marketingOptIn,
      };

      return {
        ...state,
        step: 4,
        submitting: false,
        loading: false,
        editingId: null,
        bookings,
        lastAction,
        waitlisted,
        lastConfirmed: booking ?? state.lastConfirmed,
        details: updatedDetails,
        error: null,
      };
    }
    case "START_EDIT": {
      const booking = state.bookings.find((entry) => entry.id === action.bookingId);
      if (!booking) return state;
      return {
        ...state,
        step: 1,
        submitting: false,
        editingId: booking.id,
        lastAction: null,
        waitlisted: false,
        error: null,
        details: {
          ...state.details,
          bookingId: booking.id,
          restaurantId: booking.restaurant_id,
          date: booking.booking_date,
          time: U.normalizeTime(booking.start_time),
          party: booking.party_size,
          bookingType: booking.booking_type,
          seating: booking.seating_preference,
          notes: booking.notes ?? "",
          name: booking.customer_name,
          email: booking.customer_email,
          phone: booking.customer_phone,
          marketingOptIn: booking.marketing_opt_in,
        },
      };
    }
    case "RESET_FORM": {
      const base = getInitialDetails();
      const shouldRemember = state.details.rememberDetails;
      return {
        ...state,
        step: 1,
        submitting: false,
        loading: false,
        editingId: null,
        lastAction: null,
        waitlisted: false,
        error: null,
        details: {
          ...base,
          rememberDetails: shouldRemember,
          name: shouldRemember ? state.details.name : "",
          email: shouldRemember ? state.details.email : "",
          phone: shouldRemember ? state.details.phone : "",
        },
      };
    }
    case "HYDRATE_CONTACTS":
      return {
        ...state,
        details: {
          ...state.details,
          name: action.payload.name,
          email: action.payload.email,
          phone: action.payload.phone,
          rememberDetails: action.payload.rememberDetails ?? true,
        },
      };
    default:
      return state;
  }
};

// =============================================================================================
// FORM UI HELPERS
// =============================================================================================
const Field: React.FC<{
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ id, label, required, error, children, className }) => (
  <div className={U.cn("grid w-full items-center gap-1.5", className)}>
    <Label htmlFor={id} className="flex items-center">
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
    </Label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-sm text-red-600">
        <Icon.AlertCircle className="h-4 w-4" />
        {error}
      </p>
    )}
  </div>
);

const Step1: React.FC<{ state: State; dispatch: React.Dispatch<Action> }> = ({ state, dispatch }) => {
  const { date, time, party, bookingType, seating, notes } = state.details;

  const serviceSlots = useMemo(() => U.slotsByService(date), [date]);
  const diningSlots = useMemo(() => {
    const combined = [...serviceSlots.lunch, ...serviceSlots.dinner];
    return Array.from(new Set(combined));
  }, [serviceSlots]);
  const slots = useMemo(
    () => (bookingType === "drinks" ? serviceSlots.drinks : diningSlots),
    [bookingType, diningSlots, serviceSlots],
  );

  const slotTypeMap = useMemo(() => {
    const map = new Map<string, BookingType>();
    serviceSlots.lunch.forEach((slot) => map.set(slot, "lunch"));
    serviceSlots.dinner.forEach((slot) => map.set(slot, "dinner"));
    serviceSlots.drinks.forEach((slot) => {
      if (!map.has(slot)) {
        map.set(slot, "drinks");
      }
    });
    return map;
  }, [serviceSlots]);

  useEffect(() => {
    if (!slots.length) {
      if (time) {
        dispatch({ type: "SET_FIELD", key: "time", value: "" });
      }
      return;
    }

    const alignBookingType = (slot: string | undefined) => {
      if (!slot) return;
      const inferred = slotTypeMap.get(slot);
      if (inferred && inferred !== bookingType) {
        dispatch({ type: "SET_FIELD", key: "bookingType", value: inferred });
      }
    };

    if (!time || !slots.includes(time)) {
      const nextSlot = slots[0];
      alignBookingType(nextSlot);
      if (time !== nextSlot) {
        dispatch({ type: "SET_FIELD", key: "time", value: nextSlot });
      }
      return;
    }

    if (bookingType !== "drinks") {
      alignBookingType(time);
    }
  }, [bookingType, dispatch, slotTypeMap, slots, time]);

  const handleSlotSelect = (slot: string) => {
    if (!slot) return;
    const inferred = slotTypeMap.get(slot);
    if (inferred && inferred !== bookingType) {
      dispatch({ type: "SET_FIELD", key: "bookingType", value: inferred });
    }
    if (slot !== time) {
      dispatch({ type: "SET_FIELD", key: "time", value: slot });
      track("select_time", { time: slot });
    }
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextDate = event.target.value;
    dispatch({ type: "SET_FIELD", key: "date", value: nextDate });
    if (nextDate) {
      track("select_date", { date: nextDate });
    }
  };

  const handlePartyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextParty = Number(event.target.value);
    dispatch({ type: "SET_FIELD", key: "party", value: nextParty });
    track("select_party", { party: nextParty });
  };

  const handleToggleDrinks = (checked: boolean) => {
    if (checked) {
      if (bookingType !== "drinks") {
        dispatch({ type: "SET_FIELD", key: "bookingType", value: "drinks" });
      }
      const drinkSlots = serviceSlots.drinks;
      if (drinkSlots.length) {
        const preferred = drinkSlots.includes(time) ? time : drinkSlots[0];
        if (preferred && time !== preferred) {
          dispatch({ type: "SET_FIELD", key: "time", value: preferred });
          track("select_time", { time: preferred });
        }
      }
      return;
    }

    const candidates = diningSlots.length ? diningSlots : serviceSlots.drinks;
    const fallbackSlot = candidates.includes(time) ? time : candidates[0] ?? "";
    if (fallbackSlot) {
      const inferred = U.bookingTypeFromTime(fallbackSlot, date);
      if (bookingType !== inferred) {
        dispatch({ type: "SET_FIELD", key: "bookingType", value: inferred });
      }
      if (time !== fallbackSlot) {
        dispatch({ type: "SET_FIELD", key: "time", value: fallbackSlot });
        track("select_time", { time: fallbackSlot });
      }
    } else if (bookingType !== "lunch") {
      dispatch({ type: "SET_FIELD", key: "bookingType", value: "lunch" });
    }
  };

  const canContinue = Boolean(date && time && party > 0);

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">{state.editingId ? "Modify Booking" : "Reserve a Table"}</CardTitle>
        <CardDescription>Select your preferred date, time, and party size.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="date" label="Date" required>
            <Input
              type="date"
              id="date"
              value={date}
              min={U.formatForDateInput(new Date())}
              onChange={handleDateChange}
            />
          </Field>
          <Field id="party" label="Guests" required>
            <Select
              id="party"
              value={party}
              onChange={handlePartyChange}
            >
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {index + 1} {index === 0 ? "person" : "people"}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div>
          <Label className="mb-2.5 flex items-center gap-2">
            <Icon.Clock className="h-4 w-4" /> Time
          </Label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {slots.length === 0 && <span className="text-sm text-slate-500">No availability for this selection.</span>}
            {slots.map((slot) => (
              <Button
                key={slot}
                variant={time === slot ? "default" : "outline"}
                onClick={() => handleSlotSelect(slot)}
              >
                {U.formatTime(slot)}
              </Button>
            ))}
          </div>
        </div>
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-slate-900">
            Additional options
            <Icon.ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
          </summary>
          <div className="mt-4 space-y-6">
            <Field id="drinks" label="Service">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="drinks"
                  checked={bookingType === "drinks"}
                  onChange={(event) => handleToggleDrinks(event.target.checked)}
                />
                <span className="text-sm text-slate-700">This reservation is for drinks only</span>
              </div>
              <p className="text-xs text-slate-500">Leave unchecked and we’ll categorise your booking as lunch or dinner based on the time you choose.</p>
            </Field>
            <Field id="seating" label="Seating preference">
              <div className="flex flex-wrap gap-2">
                {["any", "indoor", "outdoor"].map((option) => (
                  <Button
                    key={option}
                    variant={seating === option ? "default" : "outline"}
                    size="sm"
                    onClick={() => dispatch({ type: "SET_FIELD", key: "seating", value: option })}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Button>
                ))}
              </div>
            </Field>
            <Field id="notes" label="Notes (optional)">
              <Textarea
                id="notes"
                value={notes}
                onChange={(event) => dispatch({ type: "SET_FIELD", key: "notes", value: event.target.value })}
                placeholder="e.g., birthday celebration, dietary requirements"
              />
            </Field>
          </div>
        </details>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={() => dispatch({ type: "SET_STEP", step: 2 })} disabled={!canContinue}>
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
};

const Step2: React.FC<{ state: State; dispatch: React.Dispatch<Action> }> = ({ state, dispatch }) => {
  const { name, email, phone, agree, rememberDetails, marketingOptIn } = state.details;
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const nameOk = name.trim().length >= 2;
  const emailOk = U.isEmail(email);
  const phoneOk = U.isUKPhone(phone);
  const canContinue = nameOk && emailOk && phoneOk && agree;
  const showAgreementError = attemptedSubmit && !agree;

  const handleContinue = () => {
    setAttemptedSubmit(true);
    if (!canContinue) return;
    track("details_submit", {
      marketing_opt_in: marketingOptIn ? 1 : 0,
      terms_checked: agree ? 1 : 0,
    });
    dispatch({ type: "SET_STEP", step: 3 });
  };

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">Your Details</CardTitle>
        <CardDescription>We use these details to confirm and manage your booking.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field id="name" label="Full name" required error={name && !nameOk ? "Please enter at least two characters." : ""}>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(event) => dispatch({ type: "SET_FIELD", key: "name", value: event.target.value })}
            placeholder="Jane Smith"
            autoComplete="name"
          />
        </Field>
        <Field id="email" label="Email address" required error={email && !emailOk ? "Please enter a valid email." : ""}>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => dispatch({ type: "SET_FIELD", key: "email", value: event.target.value })}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>
        <Field
          id="phone"
          label="UK phone number"
          required
          error={phone && !phoneOk ? "Please enter a valid UK mobile number (e.g., 07123 456789)." : ""}
        >
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(event) => dispatch({ type: "SET_FIELD", key: "phone", value: event.target.value })}
            placeholder="07123 456789"
            autoComplete="tel"
          />
        </Field>
        <div className="flex items-start gap-2 pt-2">
          <Checkbox
            id="remember"
            checked={rememberDetails}
            onChange={(event) =>
              dispatch({ type: "SET_FIELD", key: "rememberDetails", value: event.target.checked })
            }
          />
          <div className="space-y-1">
            <Label htmlFor="remember" className="text-sm font-normal">
              Remember my contact details on this device
            </Label>
            <p className="text-xs text-slate-500">
              We store your contact information locally (never on our servers) so future bookings are quicker.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Checkbox
            id="agree"
            checked={agree}
            onChange={(event) => dispatch({ type: "SET_FIELD", key: "agree", value: event.target.checked })}
          />
          <div className="space-y-1">
            <Label htmlFor="agree" className="text-sm font-normal">
              I agree to the {" "}
              <Link href="/terms/togo" target="_blank" rel="noopener noreferrer" className="underline">
                ToGo Terms
              </Link>{" "}
              and {" "}
              <Link href="/terms/venue" target="_blank" rel="noopener noreferrer" className="underline">
                Venue Terms
              </Link>
              .
            </Label>
            <p className="text-xs text-slate-500">
              Both documents open in a new tab so you do not lose progress.
            </p>
            {showAgreementError && (
              <p className="text-xs text-red-600">Please accept the terms to continue.</p>
            )}
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Checkbox
            id="marketing"
            checked={marketingOptIn}
            onChange={(event) =>
              dispatch({ type: "SET_FIELD", key: "marketingOptIn", value: event.target.checked })
            }
          />
          <div className="space-y-1">
            <Label htmlFor="marketing" className="text-sm font-normal">
              Send me ToGo news and offers (optional)
            </Label>
            <p className="text-xs text-slate-500">We only share occasional updates and you can opt out anytime.</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="outline" onClick={() => dispatch({ type: "SET_STEP", step: 1 })}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={!canContinue}>
          Review booking
        </Button>
      </CardFooter>
    </Card>
  );
};

const ReviewRow: React.FC<{
  label: string;
  value: string;
  onEdit?: () => void;
}> = ({ label, value, onEdit }) => (
  <div className="flex items-center justify-between py-3">
    <span className="text-sm text-slate-600">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-slate-900">{value}</span>
      {onEdit && (
        <Button variant="ghost" size="sm" className="h-auto p-1 text-xs" onClick={onEdit}>
          Edit
        </Button>
      )}
    </div>
  </div>
);

const ConfirmationSummaryView: React.FC<{
  booking: ApiBooking | null;
  details: BookingDetails;
  waitlisted: boolean;
  lastAction: LastAction;
  onCancelAmend: () => void;
  onViewUpdate: () => void;
  onClose: () => void;
}> = ({ booking, details, waitlisted, lastAction, onCancelAmend, onViewUpdate, onClose }) => {
  const summaryDate = details.date ? U.formatSummaryDate(details.date) : "TBC";
  const summaryTime = details.time ? U.formatTime(details.time) : "TBC";
  const partyText = `${details.party} ${details.party === 1 ? "guest" : "guests"}`;
  const reference = booking?.reference ?? (waitlisted ? "WAITLIST" : "Pending");
  const guestName = booking?.customer_name ?? details.name;
  const heading = waitlisted
    ? "You're on the waiting list"
    : lastAction === "update"
      ? "Booking updated"
      : "Booking confirmed";

  const description = waitlisted
    ? `We’ll notify ${details.email} if a table opens near ${summaryTime} on ${summaryDate}.`
    : `A confirmation email has been sent to ${details.email}.`;

  const iconClassName = waitlisted ? "text-amber-500" : "text-green-500";
  const HeadingIcon = waitlisted ? Icon.Info : Icon.CheckCircle;

  const handleClose = () => {
    onClose();
  };

  const venue = DEFAULT_VENUE;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-center">
          <HeadingIcon className={`mx-auto h-12 w-12 ${iconClassName}`} />
          <CardTitle className="mt-3 text-3xl font-bold">{heading}</CardTitle>
          <CardDescription className="mt-1 text-base text-slate-600">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <dl className="grid gap-4 text-sm">
            <div>
              <dt className="text-slate-600">Booking reference</dt>
              <dd className="text-base font-semibold text-slate-900">{reference}</dd>
            </div>
            <div>
              <dt className="text-slate-600">Guest</dt>
              <dd className="text-base font-medium text-slate-900">{guestName || "Guest"}</dd>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-slate-600">Date</dt>
                <dd className="text-base font-medium text-slate-900">{summaryDate}</dd>
              </div>
              <div>
                <dt className="text-slate-600">Time</dt>
                <dd className="text-base font-medium text-slate-900">{summaryTime}</dd>
              </div>
            </div>
            <div>
              <dt className="text-slate-600">Party</dt>
              <dd className="text-base font-medium text-slate-900">{partyText}</dd>
            </div>
            <div>
              <dt className="text-slate-600">Venue</dt>
              <dd className="text-base font-medium text-slate-900">
                <p>{venue.name}</p>
                <p className="text-sm text-slate-600">{venue.address}</p>
              </dd>
            </div>
            {details.marketingOptIn && (
              <div>
                <dt className="text-slate-600">Marketing updates</dt>
                <dd className="text-base text-slate-900">Opted in</dd>
              </div>
            )}
            {details.notes && (
              <div>
                <dt className="text-slate-600">Notes</dt>
                <dd className="text-base text-slate-900">{details.notes}</dd>
              </div>
            )}
          </dl>
          <div className="flex flex-wrap gap-3">
            <Button onClick={onCancelAmend} variant="default">
              Cancel / Amend
            </Button>
            <Button variant="outline" onClick={onViewUpdate}>
              View / Update (login)
            </Button>
            <Button variant="ghost" onClick={handleClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Venue policy</CardTitle>
          <CardDescription>{venue.name} · {venue.phone} · {venue.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-700">{venue.policy}</p>
          <div className="text-sm text-slate-600">
            <p>Need help? Call us on {venue.phone} or email {venue.email}.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ConfirmationStep: React.FC<{
  state: State;
  dispatch: React.Dispatch<Action>;
  onEdit: BookingEditHandler;
  onCancel: BookingMutationHandler;
  onLookup: () => Promise<void> | void;
  onNewBooking: () => void;
  forceManageView?: boolean;
}> = ({ state, dispatch, onEdit, onCancel, onLookup, onNewBooking, forceManageView = false }) => {
  const router = useRouter();
  const hasSummary = Boolean(state.lastConfirmed || state.lastAction);
  const initialMode = forceManageView || !hasSummary ? "manage" : "summary";
  const [mode, setMode] = useState<"summary" | "manage">(initialMode);

  useEffect(() => {
    if (forceManageView || !hasSummary) {
      setMode("manage");
    }
  }, [forceManageView, hasSummary]);

  const handleCancelAmend = async () => {
    setMode("manage");
    if (!state.bookings.length) {
      await onLookup();
    }
  };

  const handleViewUpdate = () => {
    router.push("/signin?redirect=/my-bookings");
  };

  const handleClose = () => {
    router.push("/thank-you");
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      {mode === "summary" ? (
        <ConfirmationSummaryView
          booking={state.lastConfirmed}
          details={state.details}
          waitlisted={state.waitlisted}
          lastAction={state.lastAction}
          onCancelAmend={handleCancelAmend}
          onViewUpdate={handleViewUpdate}
          onClose={handleClose}
        />
      ) : (
        <ManageBookings
          state={state}
          dispatch={dispatch}
          onEdit={onEdit}
          onCancel={onCancel}
          onLookup={onLookup}
          onNewBooking={onNewBooking}
          onBack={hasSummary ? () => setMode("summary") : undefined}
        />
      )}
    </div>
  );
};

const Step3: React.FC<{ state: State; dispatch: React.Dispatch<Action>; onConfirm: () => void | Promise<void> }> = ({ state, dispatch, onConfirm }) => {
  const details = state.details;

  useEffect(() => {
    if (details.date && details.time) {
      track("confirm_open", {
        date: details.date,
        time: details.time,
        party: details.party,
      });
    } else {
      track("confirm_open");
    }
  }, [details.date, details.time, details.party]);

  const summaryValue = details.date && details.time
    ? `${details.party} at ${U.formatTime(details.time)} on ${U.formatSummaryDate(details.date)}`
    : `${details.party} guest${details.party === 1 ? "" : "s"}`;

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">Confirm your reservation</CardTitle>
        <CardDescription>Please review your booking before confirming.</CardDescription>
      </CardHeader>
      <CardContent>
        {state.error && (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}
        <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 px-4">
          <ReviewRow
            label="Summary"
            value={summaryValue}
            onEdit={() => dispatch({ type: "SET_STEP", step: 1 })}
          />
          <ReviewRow
            label="Party size"
            value={`${details.party} ${details.party === 1 ? "guest" : "guests"}`}
            onEdit={() => dispatch({ type: "SET_STEP", step: 1 })}
          />
          <ReviewRow label="Full name" value={details.name} onEdit={() => dispatch({ type: "SET_STEP", step: 2 })} />
          <ReviewRow label="Email" value={details.email} onEdit={() => dispatch({ type: "SET_STEP", step: 2 })} />
          <ReviewRow label="Phone" value={details.phone} onEdit={() => dispatch({ type: "SET_STEP", step: 2 })} />
          <ReviewRow
            label="Booking type"
            value={U.formatBookingLabel(details.bookingType)}
            onEdit={() => dispatch({ type: "SET_STEP", step: 1 })}
          />
          <ReviewRow
            label="Marketing updates"
            value={details.marketingOptIn ? "Subscribed" : "Not subscribed"}
            onEdit={() => dispatch({ type: "SET_STEP", step: 2 })}
          />
          {details.notes && (
            <ReviewRow label="Notes" value={details.notes} onEdit={() => dispatch({ type: "SET_STEP", step: 1 })} />
          )}
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="outline" onClick={() => dispatch({ type: "SET_STEP", step: 2 })}>
          Back
        </Button>
        <Button onClick={onConfirm} disabled={state.submitting}>
          {state.submitting ? (
            <>
              <Icon.Spinner className="mr-2 h-4 w-4 animate-spin" /> Processing...
            </>
          ) : (
            "Confirm booking"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

function ManageBookings({
  state,
  dispatch,
  onEdit,
  onCancel,
  onLookup,
  onNewBooking,
  onBack,
}: {
  state: State;
  dispatch: React.Dispatch<Action>;
  onEdit: BookingEditHandler;
  onCancel: BookingMutationHandler;
  onLookup: () => Promise<void> | void;
  onNewBooking: () => void;
  onBack?: () => void;
}) {
  const { bookings, lastConfirmed, lastAction, waitlisted, details, error, loading } = state;
  const [bookingToCancel, setBookingToCancel] = useState<ApiBooking | null>(null);

  const heading = lastAction === "update"
    ? "Booking updated"
    : lastAction === "waitlist"
    ? "You're on the waiting list"
    : "Reservation confirmed";

  const HeadingIcon = waitlisted ? Icon.Info : Icon.CheckCircle;
  const iconClassName = waitlisted ? "text-amber-500" : "text-green-500";
  const confirmationEmail = lastConfirmed?.customer_email ?? details.email;

  const description = waitlisted
    ? `We'll notify ${confirmationEmail} if a table opens near ${U.formatTime(details.time)} on ${U.formatDate(details.date)}.`
    : `A confirmation has been sent to ${confirmationEmail}.`;

  const emailValue = details.email?.trim() ?? "";
  const phoneValue = details.phone?.trim() ?? "";
  const canLookup = Boolean(emailValue && phoneValue);

  const handleLookupSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onLookup();
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    await onCancel(bookingToCancel);
    setBookingToCancel(null);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div className="text-center">
        <HeadingIcon className={`mx-auto h-12 w-12 ${iconClassName}`} />
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{heading}</h1>
        {confirmationEmail && (
          <p className="mt-2 text-slate-600">{description}</p>
        )}
        {onBack && (
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={onBack} disabled={loading}>
              Back to confirmation
            </Button>
          </div>
        )}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your bookings</CardTitle>
          <CardDescription>Look up, modify, or cancel upcoming reservations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleLookupSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="manage-email">Email</Label>
                <Input
                  id="manage-email"
                  type="email"
                  value={details.email}
                  onChange={(event) => dispatch({ type: "SET_FIELD", key: "email", value: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="manage-phone">Phone</Label>
                <Input
                  id="manage-phone"
                  type="tel"
                  value={details.phone}
                  onChange={(event) => dispatch({ type: "SET_FIELD", key: "phone", value: event.target.value })}
                  required
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={!canLookup || loading}>
                {loading ? (
                  <>
                    <Icon.Spinner className="mr-2 h-4 w-4 animate-spin" /> Fetching
                  </>
                ) : (
                  "Find my bookings"
                )}
              </Button>
            </div>
          </form>

          {bookings.length > 0 ? (
            <ul className="divide-y divide-slate-200">
              {bookings.map((booking) => (
                <li
                  key={booking.id}
                  className="flex flex-col items-start justify-between gap-3 py-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-semibold">
                      {U.formatDate(booking.booking_date)} at {U.formatTime(booking.start_time)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {booking.party_size} {booking.party_size === 1 ? "guest" : "guests"} · {U.formatBookingLabel(booking.booking_type)} · {booking.customer_name}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Ref: {booking.reference}</p>
                  </div>
                  <div className="flex gap-2 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(booking)}
                      disabled={loading}
                    >
                      <Icon.Pencil className="mr-2 h-4 w-4" /> Modify
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setBookingToCancel(booking)}
                      disabled={loading}
                    >
                      <Icon.Trash2 className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-4 text-center text-slate-500">You have no active bookings.</p>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <Button onClick={onNewBooking} disabled={loading}>
            Make a new booking
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog
        open={Boolean(bookingToCancel)}
        onOpenChange={(open) => {
          if (!open) setBookingToCancel(null);
        }}
        onConfirm={handleConfirmCancel}
        title="Cancel this booking?"
        description="This action cannot be undone. The reservation will be released immediately."
      />
    </div>
  );
}

// =============================================================================================
// MAIN COMPONENT
// =============================================================================================
function BookingFlowContent() {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);
  const { rememberDetails, name, email, phone } = state.details;
  const searchParams = useSearchParams();
  const manageInitRef = useRef(false);

  const handleLookupBookings = useCallback(
    async (overrides?: { email?: string; phone?: string; restaurantId?: string }) => {
      const emailValue = (overrides?.email ?? state.details.email ?? "").trim();
      const phoneValue = (overrides?.phone ?? state.details.phone ?? "").trim();
      const restaurantIdValue =
        overrides?.restaurantId ?? state.details.restaurantId ?? DEFAULT_RESTAURANT_ID;

      if (!emailValue || !phoneValue) {
        dispatch({ type: "SET_ERROR", message: "Provide your email and phone number to manage reservations." });
        return;
      }

      dispatch({ type: "SET_FIELD", key: "email", value: emailValue });
      dispatch({ type: "SET_FIELD", key: "phone", value: phoneValue });
      dispatch({ type: "SET_FIELD", key: "restaurantId", value: restaurantIdValue });

      dispatch({ type: "SET_LOADING", value: true });
      dispatch({ type: "SET_ERROR", message: null });

      try {
        const params = new URLSearchParams({
          email: emailValue,
          phone: phoneValue,
          restaurantId: restaurantIdValue,
        });

        const response = await fetch(`/api/bookings?${params.toString()}`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(typeof data?.error === "string" ? data.error : "Unable to load bookings");
        }

        dispatch({ type: "SET_BOOKINGS", bookings: data.bookings ?? [] });
        dispatch({ type: "SET_STEP", step: 4 });
      } catch (error: any) {
        dispatch({ type: "SET_ERROR", message: error?.message ?? "Unable to load bookings" });
      } finally {
        dispatch({ type: "SET_LOADING", value: false });
      }
    },
    [state.details.email, state.details.phone, state.details.restaurantId],
  );

  // Load remembered contact details
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(storageKeys.contacts);
      if (stored) {
        const parsed = JSON.parse(stored) as { name: string; email: string; phone: string };
        if (parsed.name || parsed.email || parsed.phone) {
          dispatch({ type: "HYDRATE_CONTACTS", payload: { ...parsed, rememberDetails: true } });
        }
      }
    } catch (error) {
      console.error("Failed to load contact details", error);
    }
  }, []);

  // Persist remembered contacts with explicit consent
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (rememberDetails) {
        window.localStorage.setItem(storageKeys.contacts, JSON.stringify({ name, email, phone }));
      } else {
        window.localStorage.removeItem(storageKeys.contacts);
      }
    } catch (error) {
      console.error("Failed to persist contact details", error);
    }
  }, [rememberDetails, name, email, phone]);

  useEffect(() => {
    const view = searchParams.get("view");
    if (view !== "manage" || manageInitRef.current) {
      return;
    }

    manageInitRef.current = true;

    const emailParam = searchParams.get("email") ?? "";
    const phoneParam = searchParams.get("phone") ?? "";
    const restaurantParam =
      searchParams.get("restaurantId") ?? state.details.restaurantId ?? DEFAULT_RESTAURANT_ID;

    if (emailParam) {
      dispatch({ type: "SET_FIELD", key: "email", value: emailParam });
    }
    if (phoneParam) {
      dispatch({ type: "SET_FIELD", key: "phone", value: phoneParam });
    }
    if (restaurantParam) {
      dispatch({ type: "SET_FIELD", key: "restaurantId", value: restaurantParam });
    }

    if (emailParam && phoneParam) {
      void handleLookupBookings({
        email: emailParam,
        phone: phoneParam,
        restaurantId: restaurantParam,
      });
    } else {
      dispatch({ type: "SET_STEP", step: 4 });
      dispatch({
        type: "SET_ERROR",
        message: "Enter your email and phone number to manage reservations.",
      });
    }
  }, [handleLookupBookings, searchParams, state.details.restaurantId]);

  const handleConfirm = async () => {
    const normalizedTime = U.normalizeTime(state.details.time);

    if (!normalizedTime) {
      dispatch({ type: "SET_ERROR", message: "Please select a time for your reservation." });
      return;
    }

    dispatch({ type: "SET_ERROR", message: null });
    dispatch({ type: "SET_SUBMITTING", value: true });

    const restaurantId = state.details.restaurantId || DEFAULT_RESTAURANT_ID;
    const payload = {
      restaurantId,
      date: state.details.date,
      time: normalizedTime,
      party: state.details.party,
      bookingType:
        state.details.bookingType === "drinks"
          ? "drinks"
          : U.bookingTypeFromTime(normalizedTime, state.details.date),
      seating: state.details.seating,
      notes: state.details.notes ? state.details.notes : undefined,
      name: state.details.name.trim(),
      email: state.details.email.trim(),
      phone: state.details.phone.trim(),
      marketingOptIn: state.details.marketingOptIn,
    };

    const isUpdate = Boolean(state.editingId);
    const endpoint = isUpdate ? `/api/bookings/${state.editingId}` : "/api/bookings";
    const method = isUpdate ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 202) {
        track("booking_created", {
          waitlisted: 1,
          party: state.details.party,
          start_time: normalizedTime,
        });
        dispatch({
          type: "SET_CONFIRMATION",
          payload: {
            bookings: data.bookings ?? [],
            booking: null,
            lastAction: "waitlist",
            waitlisted: true,
          },
        });
        return;
      }

      if (!response.ok) {
        const message = typeof data?.error === "string" ? data.error : "Unable to process booking";
        dispatch({ type: "SET_ERROR", message });
        dispatch({ type: "SET_SUBMITTING", value: false });
        return;
      }

      dispatch({
        type: "SET_CONFIRMATION",
        payload: {
          bookings: data.bookings ?? [],
          booking: data.booking ?? null,
          lastAction: isUpdate ? "update" : "create",
          waitlisted: Boolean(data.waitlisted),
        },
      });

      if (data?.booking) {
        track("booking_created", {
          waitlisted: data.waitlisted ? 1 : 0,
          party: data.booking.party_size,
          start_time: data.booking.start_time,
          reference: data.booking.reference,
        });
      }
    } catch (error: any) {
      dispatch({
        type: "SET_ERROR",
        message: error?.message ?? "Unable to process booking",
      });
      dispatch({ type: "SET_SUBMITTING", value: false });
    }
  };

  const handleEditBooking = (booking: ApiBooking) => {
    dispatch({ type: "SET_ERROR", message: null });
    dispatch({ type: "START_EDIT", bookingId: booking.id });
  };

  const handleNewBooking = () => {
    dispatch({ type: "SET_ERROR", message: null });
    dispatch({ type: "RESET_FORM" });
  };

  const handleCancelBooking = async (booking: ApiBooking) => {
    if (!state.details.email || !state.details.phone) {
      dispatch({ type: "SET_ERROR", message: "Provide your email and phone number to manage reservations." });
      return;
    }

    dispatch({ type: "SET_LOADING", value: true });
    dispatch({ type: "SET_ERROR", message: null });

    const restaurantId = state.details.restaurantId || DEFAULT_RESTAURANT_ID;

    try {
      const params = new URLSearchParams({
        email: state.details.email.trim(),
        phone: state.details.phone.trim(),
        restaurantId,
      });

      const response = await fetch(`/api/bookings/${booking.id}?${params.toString()}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Unable to cancel booking");
      }

      dispatch({ type: "SET_BOOKINGS", bookings: data.bookings ?? [] });
    } catch (error: any) {
      dispatch({ type: "SET_ERROR", message: error?.message ?? "Unable to cancel booking" });
    } finally {
      dispatch({ type: "SET_LOADING", value: false });
    }
  };

  const renderStep = () => {
    switch (state.step) {
      case 1:
        return <Step1 state={state} dispatch={dispatch} />;
      case 2:
        return <Step2 state={state} dispatch={dispatch} />;
      case 3:
        return <Step3 state={state} dispatch={dispatch} onConfirm={handleConfirm} />;
      case 4:
        return (
          <ConfirmationStep
            state={state}
            dispatch={dispatch}
            onEdit={handleEditBooking}
            onCancel={handleCancelBooking}
            onLookup={handleLookupBookings}
            onNewBooking={handleNewBooking}
            forceManageView={searchParams.get("view") === "manage"}
          />
        );
      default:
        return null;
    }
  };

  return <main className="min-h-screen w-full bg-slate-50 px-4 py-12 font-sans text-slate-800 sm:py-20">{renderStep()}</main>;
}

export default function BookingFlowPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-12">
        <div className="space-y-3 text-center text-slate-600">
          <Icon.Spinner className="mx-auto h-8 w-8 animate-spin" />
          <p>Loading reservation flow…</p>
        </div>
      </main>
    }>
      <BookingFlowContent />
    </Suspense>
  );
}
