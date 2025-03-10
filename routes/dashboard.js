const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { verifyToken } = require("../middleware/auth");

// Protect routes
router.use(verifyToken);

router.route("/").get(dashboardController.getDashboardData);
router.route("/transactions/recent").get(dashboardController.getRecentTransactions);

module.exports = router;
