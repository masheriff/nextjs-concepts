import z from "zod";

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  email: z.email("Invalid email format"),
  phone: z
    .string()
    .regex(/^\d{10,}$/, "Minimum 10 numbers required")
    .optional()
    .nullable(),
});