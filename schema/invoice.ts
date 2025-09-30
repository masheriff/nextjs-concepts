// schema/invoice.ts
import { z } from "zod";

// Invoice item schema for form
export const invoiceItemSchema = z.object({
  productId: z.number().int().refine(val => val > 0, { message: "Product is required" }),
  productName: z.string(), // for display purposes
  quantity: z.number().min(1, "Quantity must be at least 1"),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
});

// Main invoice form schema
export const invoiceFormSchema = z.object({
    customerId: z.number().int().refine(val => val > 0, { message: "Customer is required" }),

  status: z.enum(["pending", "paid", "cancelled"]).default("pending"),
  items: z
    .array(invoiceItemSchema)
    .min(1, "At least one item is required"),
});

// For API validation (without computed fields)
export const invoiceSchema = invoiceFormSchema;

// Types
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;
export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;