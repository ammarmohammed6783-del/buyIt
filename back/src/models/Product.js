import mongoose from 'mongoose';

// One source of truth for sizes. Cart and Order import this too.
export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
export const CATEGORIES = ['casual', 'formal', 'gym', 'party'];

const variantSchema = new mongoose.Schema(
  {
    size: { type: String, enum: SIZES, required: true },
    stock: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'stock must be an integer' },
    },
  },
  { _id: false } // variants are identified by size, no need for their own ids
);

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String }, // the image host's id, needed later to delete the image
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, unique: true, lowercase: true }, // auto-generated below
    description: { type: String, trim: true, maxlength: 2000, default: '' },

    // Money is an INTEGER in piasters: 450.50 EGP is stored as 45050
    price: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'price must be an integer (piasters)' },
    },

    images: { type: [imageSchema], default: [] },
    category: { type: String, enum: CATEGORIES, required: true },
    variants: { type: [variantSchema], default: [] },

    // Admin can hide a product without deleting it (old orders still point to it)
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ---- Indexes (the "table of contents" that makes queries fast) ----
productSchema.index({ name: 'text', description: 'text' }); // search box
productSchema.index({ category: 1, price: 1 });             // filter by category + sort by price

// ---- Virtual: total stock across all sizes (not stored, calculated when read) ----
productSchema.virtual('totalStock').get(function () {
  return this.variants.reduce((sum, v) => sum + v.stock, 0);
});
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// ---- Slug: "Black Gym Hoodie" → "black-gym-hoodie" (adds -2, -3 if it already exists) ----
function slugify(text) {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'product' // fallback if the name has no latin letters
  );
}

productSchema.pre('validate', async function () {
  if (this.slug) return; // never change a slug after creation: it would break old links
  const base = slugify(this.name);
  let slug = base;
  let n = 1;
  while (await this.constructor.exists({ slug })) {
    slug = `${base}-${++n}`;
  }
  this.slug = slug;
});

export default mongoose.model('Product', productSchema);