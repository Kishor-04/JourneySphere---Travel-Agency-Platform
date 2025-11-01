const { z } = require("zod");

exports.createBookingSchema = z.object({
  packageId: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  travellers: z.number().int().min(1),
  startDate: z.string().refine(s => {
    const d = new Date(s);
    if (isNaN(d)) return false;
    // allow today or future
    const today = new Date(); today.setHours(0,0,0,0);
    d.setHours(0,0,0,0);
    return d.getTime() >= today.getTime();
  }, { message: 'Start date must be today or later' })
});
