const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { createOrderSchema } = require("../schemas/orderSchema");

router.post("/", authMiddleware, validate(createOrderSchema), orderController.createOrder);
router.get("/", authMiddleware, orderController.getMyOrders);
router.get("/:id", authMiddleware, orderController.getOrderById);
router.patch("/:id/cancel", authMiddleware, orderController.cancelMyOrder);

module.exports = router;
