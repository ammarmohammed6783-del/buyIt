const mongoose = require('mongoose');

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const CATEGORIES = ['casual', 'formal', 'gym', 'party'];

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
  { _id: false }
);

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, trim: true, maxlength: 2000, default: '' },

    // Price in piasters (integer: 450.50 EGP = 45050)
    price: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'price must be an integer (piasters)' },
    },

    images: { type: [imageSchema], default: [] },
    category: { type: String, enum: CATEGORIES, required: true },
    variants: { type: [variantSchema], default: [] },

    reviews: { type: [reviewSchema], default: [] },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 },
    salesCount: { type: Number, default: 0, min: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ salesCount: -1 });

productSchema.virtual('totalStock').get(function () {
  return this.variants.reduce((sum, v) => sum + v.stock, 0);
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

function slugify(text) {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'product'
  );
}

productSchema.pre('validate', async function () {
  if (this.slug) return;
  const base = slugify(this.name);
  let slug = base;
  let n = 1;
  while (await this.constructor.exists({ slug })) {
    slug = `${base}-${++n}`;
  }
  this.slug = slug;
});

const Product = mongoose.model('Product', productSchema);
Product.SIZES = SIZES;
Product.CATEGORIES = CATEGORIES;

module.exports = Product;
