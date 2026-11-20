import mongoose from 'mongoose';
import { SIZES } from './Product.js';

// The cart stores NO prices and NO names, only "which product, which size, how many".
// The server looks up the real price every time. This is the "never trust the client" rule.
const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    size: { type: String, enum: SIZES, required: true },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 10, // sanity limit per line
      validate: { validator: Number.isInteger, message: 'quantity must be an integer' },
    },
  },
  { _id: false } // an item is identified by product + size
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one cart per user, enforced by the database
    },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Cart', cartSchema);