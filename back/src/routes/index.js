const express = require("express");
const router = express.Router();

const authRouter = require("./authRouter");
const productRouter = require("./productRouter");
const cartRouter = require("./cartRouter");
const orderRouter = require("./orderRouter");
const adminRouter = require("./adminRouter");
const paymentRouter = require("./paymentRouter");
const uploadRouter = require("./uploadRouter");

router.use("/auth", authRouter);
router.use("/products", productRouter);
router.use("/product", productRouter); // Support both singular and plural
router.use("/cart", cartRouter);
router.use("/orders", orderRouter);
router.use("/order", orderRouter);
router.use("/admin", adminRouter);
router.use("/payment", paymentRouter);
router.use("/upload", uploadRouter);

module.exports = router;
