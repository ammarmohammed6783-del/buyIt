const mongoose = require("mongoose");
const Product = require("../models/Product");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const cartController = require("./cartController");

// GET /product
exports.getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      minPrice,
      maxPrice,
      sort = "newest",
    } = req.query;

    const query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === "price-asc") sortOption = { price: 1 };
    else if (sort === "price-desc") sortOption = { price: -1 };
    else if (sort === "popular" || sort === "top-selling") sortOption = { salesCount: -1 };
    else if (sort === "rating") sortOption = { rating: -1 };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [products, totalCount] = await Promise.all([
      Product.find(query).sort(sortOption).skip(skip).limit(limitNum),
      Product.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: products.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
      products,
    });
  } catch (err) {
    next(err);
  }
};

// GET /product/top-selling
exports.getTopSelling = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 8;
    const products = await Product.find({ isActive: true })
      .sort({ salesCount: -1, rating: -1, createdAt: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (err) {
    next(err);
  }
};

// GET /product/:id (supports ObjectId or slug)
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let product;

    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    }

    if (!product) {
      product = await Product.findOne({ slug: id });
    }

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        msg: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (err) {
    next(err);
  }
};

// POST /product (Admin only)
exports.createProduct = async (req, res, next) => {
  try {
    const product = new Product(req.body);
    await product.save();

    return res.status(201).json({
      success: true,
      msg: "Product created successfully",
      product,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /product/:id (Admin only)
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        msg: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      msg: "Product updated successfully",
      product,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /product/:id (Admin only)
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        msg: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      msg: "Product deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

// POST /product/review/:id
exports.createReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.userId;

    const [product, user] = await Promise.all([
      Product.findById(id),
      User.findById(userId),
    ]);

    if (!product) {
      return res.status(404).json({
        success: false,
        msg: "Product not found",
      });
    }

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === userId.toString()
    );

    if (alreadyReviewed) {
      alreadyReviewed.rating = rating;
      alreadyReviewed.comment = comment || alreadyReviewed.comment;
    } else {
      product.reviews.push({
        user: userId,
        name: user ? user.name : "Anonymous",
        rating: Number(rating),
        comment: comment || "",
      });
    }

    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();

    return res.status(201).json({
      success: true,
      msg: alreadyReviewed ? "Review updated" : "Review added successfully",
      rating: product.rating,
      numReviews: product.numReviews,
    });
  } catch (err) {
    next(err);
  }
};

// POST /product/addToCart (Delegates to cartController)
exports.addToCart = (req, res, next) => {
  return cartController.addCartItem(req, res, next);
};
