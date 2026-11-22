const mongoose = require("mongoose");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Standard shipping fee: 50 EGP (5000 piasters)
// Free shipping threshold: 1000 EGP (100,000 piasters)
const SHIPPING_FEE = 5000;
const FREE_SHIPPING_THRESHOLD = 100000;

// POST /api/orders
exports.createOrder = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { shippingAddress, paymentMethod } = req.body;

    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        msg: "Your cart is empty. Add products before checking out.",
      });
    }

    // Verify stock availability for every line item
    for (const item of cart.items) {
      if (!item.product || !item.product.isActive) {
        return res.status(400).json({
          success: false,
          msg: `Product "${item.product?.name || "Unknown"}" is no longer available.`,
        });
      }

      const variant = item.product.variants.find((v) => v.size === item.size);
      if (!variant || variant.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          msg: `Not enough stock for "${item.product.name}" in size ${item.size}. Available: ${variant ? variant.stock : 0}`,
        });
      }
    }

    // Server-side price calculation
    let itemsTotal = 0;
    const orderItems = cart.items.map((item) => {
      const linePrice = item.product.price;
      itemsTotal += linePrice * item.quantity;

      return {
        product: item.product._id,
        name: item.product.name,
        image: item.product.images[0]?.url || "",
        size: item.size,
        quantity: item.quantity,
        price: linePrice,
      };
    });

    const shippingFee = itemsTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const totalPrice = itemsTotal + shippingFee;

    // Decrement stock and increment salesCount
    for (const item of cart.items) {
      await Product.updateOne(
        { _id: item.product._id, "variants.size": item.size },
        {
          $inc: {
            "variants.$.stock": -item.quantity,
            salesCount: item.quantity,
          },
        }
      );
    }

    // Create the order snapshot
    const order = await Order.create({
      user: userId,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      paymentStatus: "pending",
      status: "pending",
      itemsTotal,
      shippingFee,
      totalPrice,
    });

    // Clear user cart
    cart.items = [];
    await cart.save();

    return res.status(201).json({
      success: true,
      msg: "Order placed successfully",
      order,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders (My orders)
exports.getMyOrders = async (req, res, next) => {
  try {
    const userId = req.userId;
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id
exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        msg: "Invalid order ID",
      });
    }

    const order = await Order.findById(id).populate("user", "name email");
    if (!order) {
      return res.status(404).json({
        success: false,
        msg: "Order not found",
      });
    }

    // Only order owner or admin can view
    const isOwner = order.user._id.toString() === req.userId;
    const isAdmin = req.userRole === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        msg: "You do not have permission to view this order",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/orders/:id/cancel (Customer cancels pending order)
exports.cancelMyOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, msg: "Order not found" });
    }

    if (order.user.toString() !== userId && req.userRole !== "admin") {
      return res.status(403).json({ success: false, msg: "You do not have permission to cancel this order" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        msg: `Cannot cancel an order that is already ${order.status}`,
      });
    }

    // Restore stock
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product, "variants.size": item.size },
        {
          $inc: {
            "variants.$.stock": item.quantity,
            salesCount: -item.quantity,
          },
        }
      );
    }

    order.status = "cancelled";
    await order.save();

    return res.status(200).json({
      success: true,
      msg: "Order cancelled successfully",
      order,
    });
  } catch (err) {
    next(err);
  }
};

