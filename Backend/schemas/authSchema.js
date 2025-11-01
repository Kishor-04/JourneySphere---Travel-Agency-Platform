const { z } = require("zod");

exports.signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"]
});

exports.loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
