import z from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  description: z
    .string()
    .max(1000, "Description is too long")
    .optional()
    .nullable(),
  price: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Price must be a positive number",
    })
    .transform((val) => parseFloat(val).toFixed(2)),
});