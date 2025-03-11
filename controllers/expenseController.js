const Expense = require("../models/Expense");

// Create a new expense
exports.createExpense = async (req, res) => {
    try {
        const userId = req.user.id;
        let { icon, category, amount, date } = req.body;

        // Validate request
        if (!category || amount === undefined || !date) {
            return res.status(400).json({
                success: false,
                message: "Please provide category, amount, and date"
            });
        }

        // Convert amount to a proper number (if it's a string with formatting)
        if (typeof amount === 'string') {
            // Remove any non-numeric characters except decimal point
            amount = amount.replace(/[^\d.-]/g, '');
        }

        // Parse to float and ensure it's a valid number
        amount = parseFloat(amount);

        if (isNaN(amount)) {
            return res.status(400).json({
                success: false,
                message: "Amount must be a valid number"
            });
        }

        // Check if amount is within reasonable range for your database
        // Most likely your DB column is a DECIMAL type with limited precision
        if (amount < 0 || amount > 999999999) {  // Adjust max value based on your DB schema
            return res.status(400).json({
                success: false,
                message: "Amount is out of valid range"
            });
        }

        // Create expense with validated amount
        const expense = await Expense.create(userId, {
            icon,
            category,
            amount,
            date
        });

        res.status(201).json({
            success: true,
            data: expense,
        });
    } catch (error) {
        console.error("Error creating expense:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create expense",
            error: error.message,
        });
    }
};

// Get all expenses for a user
exports.getExpenses = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get filter parameters from query
        const { startDate, endDate, category } = req.query;

        // Fetch expenses
        const expenses = await Expense.findByUserId(userId, { startDate, endDate, category });

        res.status(200).json({
            success: true,
            count: expenses.length,
            data: expenses,
        });
    } catch (error) {
        console.error("Error fetching expenses:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch expenses",
            error: error.message,
        });
    }
};

// Get a single expense
exports.getExpense = async (req, res) => {
    try {
        const userId = req.user.id;
        const expenseId = req.params.id;

        // Find expense
        const expense = await Expense.findById(expenseId, userId);

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found",
            });
        }

        res.status(200).json({
            success: true,
            data: expense,
        });
    } catch (error) {
        console.error("Error fetching expense:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch expense",
            error: error.message,
        });
    }
};

// Update an expense
exports.updateExpense = async (req, res) => {
    try {
        const userId = req.user.id;
        const expenseId = req.params.id;
        let { icon, category, amount, date } = req.body;

        // Check if Expense exists
        const existingExpense = await Expense.findById(expenseId, userId);

        if (!existingExpense) {
            return res.status(404).json({
                success: false,
                message: "Expense record not found",
            });
        }

        // Validate and process amount if provided
        if (amount !== undefined) {
            // Convert amount to a proper number if it's a string
            if (typeof amount === 'string') {
                // Remove any non-numeric characters except decimal point
                amount = amount.replace(/[^\d.-]/g, '');
            }

            // Parse to float and ensure it's a valid number
            amount = parseFloat(amount);

            if (isNaN(amount)) {
                return res.status(400).json({
                    success: false,
                    message: "Amount must be a valid number"
                });
            }

            // Check if amount is within reasonable range
            if (amount < 0 || amount > 999999999) {  // Adjust based on your DB schema
                return res.status(400).json({
                    success: false,
                    message: "Amount is out of valid range"
                });
            }
        }

        // Create update data with existing values as fallbacks
        const updateData = {
            icon: icon || existingExpense.icon,
            category: category || existingExpense.category,
            amount: amount !== undefined ? amount : existingExpense.amount,
            date: date || existingExpense.date,
        };

        // Update Expense
        const updated = await Expense.update(expenseId, userId, updateData);

        if (!updated) {
            return res.status(400).json({
                success: false,
                message: "Failed to update Expense record",
            });
        }

        // Get updated Expense
        const updatedExpense = await Expense.findById(expenseId, userId);

        res.status(200).json({
            success: true,
            data: updatedExpense,
        });
    } catch (error) {
        console.error("Error updating Expense record:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update Expense record",
            error: error.message,
        });
    }
};

// Delete an expense
exports.deleteExpense = async (req, res) => {
    try {
        const userId = req.user.id;
        const expenseId = req.params.id;

        // Check if expense exists
        const expense = await Expense.findById(expenseId, userId);

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found",
            });
        }

        // Delete expense
        const deleted = await Expense.delete(expenseId, userId);

        if (!deleted) {
            return res.status(400).json({
                success: false,
                message: "Failed to delete expense",
            });
        }

        res.status(200).json({
            success: true,
            message: "Expense deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting expense:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete expense",
            error: error.message,
        });
    }
};

// Get expense summary
exports.getExpenseSummary = async (req, res) => {
    try {
        const userId = req.user.id;
        const { period = "month", startDate, endDate } = req.query;

        // Get total expenses
        const totalExpenses = await Expense.getTotal(userId, { startDate, endDate });

        // Get category breakdown
        const categoryBreakdown = await Expense.getCategorySummary(userId, period);

        res.status(200).json({
            success: true,
            data: {
                totalExpenses,
                categoryBreakdown,
            },
        });
    } catch (error) {
        console.error("Error getting expense summary:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get expense summary",
            error: error.message,
        });
    }
};
