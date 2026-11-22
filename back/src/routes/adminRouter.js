const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const restrictTo = require("../middleware/restrictTo");
const validate = require("../middleware/validate");
const { updateOrderStatusSchema } = require("../schemas/orderSchema");

// All admin routes require authentication and admin role
router.use(authMiddleware, restrictTo("admin"));

router.get("/stats", adminController.getDashboardStats);
router.get("/orders", adminController.getAllOrders);
router.patch("/orders/:id/status", validate(updateOrderStatusSchema), adminController.updateOrderStatus);
router.get("/users", adminController.getAllUsers);

module.exports = router;
