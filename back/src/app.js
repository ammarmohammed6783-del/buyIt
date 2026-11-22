const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const rateLimit = require("express-rate-limit");

const apiRouter = require("./routes/index");
const { stripeWebhook } = require("./controllers/paymentController");
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

// Stripe Webhook needs the raw Buffer to verify cryptographic signatures
app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

// Middlewares: Support both Client & Admin origins
const allowedOrigins = [
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : ["http://localhost:3000"]),
  ...(process.env.ADMIN_URL ? process.env.ADMIN_URL.split(",") : ["http://localhost:5173"]),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev, or origin match
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// Serve static uploads (for local file fallback)
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

// Rate limiting for auth routes to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    msg: "Too many authentication attempts. Please try again after 15 minutes.",
  },
});

app.use("/api/auth/signin", authLimiter);
app.use("/api/auth/signup", authLimiter);
app.use("/auth/signin", authLimiter);
app.use("/auth/signup", authLimiter);

// Main API Router (matches frontend: /api/products, /api/auth, /api/cart, etc.)
app.use("/api", apiRouter);

// Direct mounts for backward compatibility
app.use("/", apiRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date() });
});

// JSON 404 Catch-All for unknown API endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    msg: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use(errorMiddleware);

module.exports = app;
