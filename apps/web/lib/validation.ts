import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s-]{8,16}$/, "Enter a valid phone number.");
export const passwordSchema = z.string().min(8).max(128);
export const amountSchema = z.coerce.number().finite().positive().max(500000);
export const upiAddressSchema = z.string().regex(/^[\w.-]{2,80}@[\w.-]{2,40}$/);
