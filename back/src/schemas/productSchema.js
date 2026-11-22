const { z } = require("zod");
const { SIZES, CATEGORIES } = require("../models/Product");

const variantSchema = z.object({
  size: z.enum(SIZES, {
    errorMap: () => ({ message: `Size must be one of: ${SIZES.join(", ")}` }),
  }),
  stock: z.number().int().min(0, "Stock cannot be negative"),
});

const imageSchema = z.object({
  url: z.string().url("Valid image URL is required"),
  publicId: z.string().optional(),
});

const createProductSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Product name must be at least 2 characters").max(120),
    description: z.string().trim().max(2000).optional().default(""),
    price: z.number().int().min(0, "Price must be a positive integer in piasters"),
    category: z.enum(CATEGORIES, {
      errorMap: () => ({ message: `Category must be one of: ${CATEGORIES.join(", ")}` }),
    }),
    images: z.array(imageSchema).optional().default([]),
    variants: z.array(variantSchema).optional().default([]),
    isActive: z.boolean().optional().default(true),
  }),
});

const updateProductSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120).optional(),
    description: z.string().trim().max(2000).optional(),
    price: z.number().int().min(0).optional(),
    category: z.enum(CATEGORIES).optional(),
    images: z.array(imageSchema).optional(),
    variants: z.array(variantSchema).optional(),
    isActive: z.boolean().optional(),
  }),
});

const reviewSchema = z.object({
  body: z.object({
    rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
    comment: z.string().trim().max(1000).optional().default(""),
  }),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  reviewSchema,
};
