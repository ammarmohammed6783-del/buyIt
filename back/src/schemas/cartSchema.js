const { z } = require("zod");
const { SIZES } = require("../models/Product");

const addToCartSchema = z.object({
  body: z.object({
    productId: z.string().min(1, "Product ID is required"),
    size: z.enum(SIZES, {
      errorMap: () => ({ message: `Size must be one of: ${SIZES.join(", ")}` }),
    }),
    quantity: z.number().int().min(1, "Quantity must be at least 1").max(10, "Maximum quantity is 10").optional().default(1),
  }),
});

const updateCartSchemaItem = z.object({
  body: z.object({
    quantity: z.number().int().min(1, "Quantity must be at least 1").max(10, "Maximum quantity is 10").optional(),
    size: z.enum(SIZES).optional(),
  }),
});

module.exports = {
  addToCartSchema,
  updateCartSchemaItem,
};
