const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");
const balanceRoutes = require("./routes/balance");
const expenseRoutes = require("./routes/expense");
const incomeRoutes = require("./routes/income");
const dashboardRoutes = require("./routes/dashboard");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/balance", balanceRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Default route
app.get("/", (req, res) => {
    res.json({ message: "Welcome to the Spenwise API" });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "Something went wrong on the server",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
});

// HAPUS app.listen() untuk deployment Vercel
// Baris di bawah ini akan digunakan saat development lokal saja
if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export app untuk Vercel
module.exports = app;