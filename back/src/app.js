const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

// Middlewares
app.use(cors());
app.use(cookieParser());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Server is running!",
  });
});

module.exports = app;
