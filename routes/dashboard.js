const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { verifyToken } = require("../middleware/auth");

// Protect routes
router.use(verifyToken);

router.route("/").get(dashboardController.getDashboardData);

module.exports = router;
