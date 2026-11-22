const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");

// GET /api/admin/stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [totalOrders, totalUsers, totalProducts, paidOrders, recentOrders, lowStockProducts] =
      await Promise.all([
        Order.countDocuments(),
        User.countDocuments(),
        Product.countDocuments({ isActive: true }),
        Order.find({
          status: { $ne: "cancelled" },
          $or: [{ paymentStatus: "paid" }, { status: "delivered" }],
        }).select("totalPrice"),
        Order.find()
          .sort({ createdAt: -1 })
          .limit(8)
          .populate("user", "name email"),
        Product.find({
          isActive: true,
          variants: { $elemMatch: { stock: { $lte: 3 } } },
        }).select("name price variants category slug"),
      ]);

    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

    return res.status(200).json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        totalUsers,
        totalProducts,
        recentOrders,
        lowStockProducts,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/orders
exports.getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [orders, totalCount] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("user", "name email"),
      Order.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: orders.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
      orders,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/orders/:id/status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        msg: "Order not found",
      });
    }

    const previousStatus = order.status;

    // If changing to delivered
    if (status === "delivered") {
      order.deliveredAt = new Date();
      if (order.paymentMethod === "cod") {
        order.paymentStatus = "paid";
        order.paidAt = new Date();
      }
    }

    // If cancelled, restore variant stock
    if (status === "cancelled" && previousStatus !== "cancelled") {
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
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      msg: `Order status updated to ${status}`,
      order,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select("name email role createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err) {
    next(err);
  }
};
