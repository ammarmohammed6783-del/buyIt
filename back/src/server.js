const express = require("express");

const app = express();
const PORT = 3001;

// Middlewares
app.use(express.json());

// Routes
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Server is running!"
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});