const mongoose = require('mongoose');
const { SIZES } = require('./Product');

const money = {
  type: Number,
  required: true,
  min: 0,
  validate: { validator: Number.isInteger, message: '{PATH} must be an integer (piasters)' },
};

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: { type: String },
    size: { type: String, enum: SIZES, required: true },
    quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
    price: money,
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    governorate: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: {
      type: [orderItemSchema],
      validate: { validator: (v) => v.length > 0, message: 'an order needs at least one item' },
    },
    shippingAddress: { type: shippingAddressSchema, required: true },

    paymentMethod: { type: String, enum: ['cod', 'card'], required: true },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentRef: { type: String },

    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },

    itemsTotal: money,
    shippingFee: money,
    totalPrice: money,

    paidAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentRef: 1 }, { sparse: true });

module.exports = mongoose.model('Order', orderSchema);
