const mongoose = require('mongoose');
const { SIZES } = require('./Product');

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    size: { type: String, enum: SIZES, required: true },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
      validate: { validator: Number.isInteger, message: 'quantity must be an integer' },
    },
  },
  { timestamps: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);
