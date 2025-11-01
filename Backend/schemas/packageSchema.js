const { z } = require("zod");

exports.createPackageSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  location: z.string().min(2),
  days: z.number().int().positive(),
  price: z.number().nonnegative(),
  imageUrl: z.string().url().optional().or(z.literal(''))
});
