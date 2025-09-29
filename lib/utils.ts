import { clsx, type ClassValue } from "clsx"
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

