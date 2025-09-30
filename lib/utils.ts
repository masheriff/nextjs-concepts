import { clsx, type ClassValue } from "clsx"
import { formatDistanceToNow } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface DatabaseError extends Error {
  code?: string;             // Postgres error code, e.g., "23505"
  constraint?: string;       // Constraint name, e.g., "customers_email_unique"
  cause?: {
    message: string;         // Full Postgres error message
    code?: string;           // Nested code
    constraint?: string;     // Nested constraint name
  };
}


export function isDatabaseError(error: unknown): error is DatabaseError {
  return (
    typeof error === "object" &&
    error !== null &&
    ("code" in error || "cause" in (error as any))
  );
}

export function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatRelativeTime(date: Date | string): string {
  try {
    const utcDate = new Date(date);
    const kolkataDate = toZonedTime(utcDate, "Asia/Kolkata");
    return formatDistanceToNow(kolkataDate, { addSuffix: true });
  } catch {
    return "—";
  }
}




