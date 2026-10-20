const { z } = require("zod");

const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(254)
  .transform((email) => email.toLowerCase());

const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: emailSchema,
    password: z.string().min(8).max(128),
  })
  .strict();

const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1).max(128),
  })
  .strict();

module.exports = {
  registerSchema,
  loginSchema,
};