const express = require("express");
const router = express.Router();
const incomeController = require("../controllers/incomeController");
const { verifyToken } = require("../middleware/auth");

// Protect all routes
router.use(verifyToken);

router.route("/").post(incomeController.createIncome).get(incomeController.getIncomes);

router.route("/summary").get(incomeController.getIncomeSummary);

router
    .route("/:id")
    .get(incomeController.getIncome)
    .put(incomeController.updateIncome)
    .delete(incomeController.deleteIncome);

module.exports = router;
