const { z } = require("zod");

const createOrderSchema = z.object({
  body: z.object({
    shippingAddress: z.object({
      fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
      phone: z.string().trim().min(8, "Valid phone number is required"),
      street: z.string().trim().min(3, "Street address is required"),
      city: z.string().trim().min(2, "City is required"),
      governorate: z.string().trim().min(2, "Governorate is required"),
    }),
    paymentMethod: z.enum(["cod", "card"], {
      errorMap: () => ({ message: "Payment method must be 'cod' or 'card'" }),
    }),
  }),
});

const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"], {
      errorMap: () => ({ message: "Invalid order status" }),
    }),
  }),
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
};
