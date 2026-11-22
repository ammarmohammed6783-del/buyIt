const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Helper to calculate total price & items count safely on server
const formatCartResponse = (cart) => {
  let itemsTotal = 0;
  let itemsCount = 0;

  const formattedItems = cart.items.map((item) => {
    const price = item.product ? item.product.price : 0;
    const lineTotal = price * item.quantity;
    itemsTotal += lineTotal;
    itemsCount += item.quantity;

    return {
      _id: item._id,
      product: item.product,
      size: item.size,
      quantity: item.quantity,
      lineTotal,
    };
  });

  return {
    _id: cart._id,
    user: cart.user,
    items: formattedItems,
    itemsTotal,
    itemsCount,
    updatedAt: cart.updatedAt,
  };
};

// GET /cart
exports.getAllCartItems = async (req, res, next) => {
  try {
    const userId = req.userId;

    let cart = await Cart.findOne({ user: userId }).populate({
      path: "items.product",
      select: "name price images category variants slug isActive",
    });

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    return res.status(200).json({
      success: true,
      cart: formatCartResponse(cart),
    });
  } catch (err) {
    next(err);
  }
};

// POST /cart/addToCart
exports.addCartItem = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { productId, size, quantity = 1 } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        msg: "Invalid product ID",
      });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        msg: "Product not found or unavailable",
      });
    }

    const variant = product.variants.find((v) => v.size === size);
    if (!variant || variant.stock <= 0) {
      return res.status(400).json({
        success: false,
        msg: `Size ${size} is out of stock`,
      });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.size === size
    );

    if (existingItemIndex > -1) {
      const currentQty = cart.items[existingItemIndex].quantity;
      const newQty = Math.min(10, currentQty + quantity);

      if (newQty > variant.stock) {
        return res.status(400).json({
          success: false,
          msg: `Cannot add more. Only ${variant.stock} available in stock.`,
        });
      }

      cart.items[existingItemIndex].quantity = newQty;
    } else {
      if (quantity > variant.stock) {
        return res.status(400).json({
          success: false,
          msg: `Cannot add ${quantity} items. Only ${variant.stock} available.`,
        });
      }

      cart.items.push({
        product: productId,
        size,
        quantity: Math.min(10, Math.max(1, quantity)),
      });
    }

    await cart.save();

    await cart.populate({
      path: "items.product",
      select: "name price images category variants slug isActive",
    });

    return res.status(200).json({
      success: true,
      msg: "Item added to cart",
      cart: formatCartResponse(cart),
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /cart/:id (supports item._id or productId)
exports.updateCartItem = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { quantity, size } = req.body;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        msg: "Cart not found",
      });
    }

    const item = cart.items.find(
      (i) => i._id.toString() === id || i.product.toString() === id
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        msg: "Item not found in cart",
      });
    }

    if (quantity !== undefined) {
      if (quantity <= 0) {
        cart.items = cart.items.filter(
          (i) => i._id.toString() !== item._id.toString()
        );
      } else {
        const product = await Product.findById(item.product);
        const targetSize = size || item.size;
        const variant = product?.variants.find((v) => v.size === targetSize);

        if (variant && quantity > variant.stock) {
          return res.status(400).json({
            success: false,
            msg: `Only ${variant.stock} items available in stock.`,
          });
        }

        item.quantity = Math.min(10, quantity);
        if (size) item.size = size;
      }
    } else if (size) {
      item.size = size;
    }

    await cart.save();

    await cart.populate({
      path: "items.product",
      select: "name price images category variants slug isActive",
    });

    return res.status(200).json({
      success: true,
      msg: "Cart updated",
      cart: formatCartResponse(cart),
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /cart/:id (supports item._id or productId)
exports.deleteCartItem = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        msg: "Cart not found",
      });
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item._id.toString() !== id && item.product.toString() !== id
    );

    if (cart.items.length === initialLength) {
      return res.status(404).json({
        success: false,
        msg: "Item not found in cart",
      });
    }

    await cart.save();

    await cart.populate({
      path: "items.product",
      select: "name price images category variants slug isActive",
    });

    return res.status(200).json({
      success: true,
      msg: "Item removed from cart",
      cart: formatCartResponse(cart),
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /cart (Clear entire cart)
exports.clearCart = async (req, res, next) => {
  try {
    const userId = req.userId;
    const cart = await Cart.findOne({ user: userId });

    if (cart) {
      cart.items = [];
      await cart.save();
    }

    return res.status(200).json({
      success: true,
      msg: "Cart cleared successfully",
      cart: cart ? formatCartResponse(cart) : { items: [], itemsTotal: 0, itemsCount: 0 },
    });
  } catch (err) {
    next(err);
  }
};

