import { z } from "zod";

export const userValidator = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2-3 character")
    .max(40, "Name must be at most 40 character"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  profilePic: z.union([z.string().url(), z.literal("")]).optional(),
});

export const loginValidator = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
