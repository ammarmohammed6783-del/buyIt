const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRouter = require("./routes/authRouter")
const errorMiddleware = require("./middleware/errorMiddleware")

const app = express();

// Middlewares
app.use(cors());
app.use(cookieParser());
app.use(express.json());

// Routes
app.use("/auth", authRouter)

app.use(errorMiddleware)

module.exports = app;
