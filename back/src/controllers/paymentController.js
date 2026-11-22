const Order = require("../models/Order");

let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
}

// POST /api/payment/create-checkout-session
exports.createCheckoutSession = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const userId = req.userId;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        msg: "Order not found",
      });
    }

    if (order.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        msg: "You do not own this order",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        msg: "This order has already been paid",
      });
    }

    if (!stripe) {
      return res.status(503).json({
        success: false,
        msg: "Stripe payments are not configured. Please set STRIPE_SECRET_KEY in .env.",
      });
    }

    const clientOrigin = process.env.CLIENT_URL
      ? process.env.CLIENT_URL.split(",")[0]
      : "http://localhost:3000";

    const lineItems = order.items.map((item) => ({
      price_data: {
        currency: "egp",
        product_data: {
          name: `${item.name} (${item.size})`,
          images: item.image ? [item.image] : [],
        },
        unit_amount: item.price, // piasters
      },
      quantity: item.quantity,
    }));

    if (order.shippingFee > 0) {
      lineItems.push({
        price_data: {
          currency: "egp",
          product_data: {
            name: "Shipping Fee",
          },
          unit_amount: order.shippingFee,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${clientOrigin}/checkout/success?orderId=${order._id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientOrigin}/checkout?orderId=${order._id}`,
      metadata: {
        orderId: order._id.toString(),
      },
    });

    order.paymentRef = session.id;
    await order.save();

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      sessionUrl: session.url,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/payment/webhook
exports.stripeWebhook = async (req, res, next) => {
  try {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).send("Webhook secret not configured");
    }

    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: "paid",
          paidAt: new Date(),
          paymentRef: session.payment_intent || session.id,
        });
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
};
