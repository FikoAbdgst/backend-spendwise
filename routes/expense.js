const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expenseController");
const { verifyToken } = require("../middleware/auth");

router.use(verifyToken);

router.route("/").post(expenseController.createExpense).get(expenseController.getExpenses);

router.route("/summary").get(expenseController.getExpenseSummary);

router
    .route("/:id")
    .get(expenseController.getExpense)
    .put(expenseController.updateExpense)
    .delete(expenseController.deleteExpense);

module.exports = router;
