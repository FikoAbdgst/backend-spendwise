const Income = require("../models/Income");

// Create a new income
exports.createIncome = async (req, res) => {
    try {
        const userId = req.user.id;
        let { icon, source, amount, date } = req.body;

        // Validate request
        if (!source || amount === undefined || !date) {
            return res.status(400).json({
                success: false,
                message: "Please provide source, amount, and date"
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

        // Create income with validated amount
        const income = await Income.create(userId, {
            icon,
            source,
            amount,
            date
        });

        res.status(201).json({
            success: true,
            data: income,
        });
    } catch (error) {
        console.error("Error creating income:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create income",
            error: error.message,
        });
    }
};
// Get all income records for a user
exports.getIncomes = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get filter parameters from query
        const { startDate, endDate, source } = req.query;

        // Fetch income records
        const incomes = await Income.findByUserId(userId, { startDate, endDate, source });

        res.status(200).json({
            success: true,
            count: incomes.length,
            data: incomes,
        });
    } catch (error) {
        console.error("Error fetching income records:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch income records",
            error: error.message,
        });
    }
};

// Get a single income record
exports.getIncome = async (req, res) => {
    try {
        const userId = req.user.id;
        const incomeId = req.params.id;

        // Find income
        const income = await Income.findById(incomeId, userId);

        if (!income) {
            return res.status(404).json({
                success: false,
                message: "Income record not found",
            });
        }

        res.status(200).json({
            success: true,
            data: income,
        });
    } catch (error) {
        console.error("Error fetching income record:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch income record",
            error: error.message,
        });
    }
};

exports.updateIncome = async (req, res) => {
    try {
        const userId = req.user.id;
        const incomeId = req.params.id;
        let { icon, source, amount, date } = req.body;

        // Check if income exists
        const existingIncome = await Income.findById(incomeId, userId);

        if (!existingIncome) {
            return res.status(404).json({
                success: false,
                message: "Income record not found",
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
            icon: icon || existingIncome.icon,
            source: source || existingIncome.source,
            amount: amount !== undefined ? amount : existingIncome.amount,
            date: date || existingIncome.date,
        };

        // Update income
        const updated = await Income.update(incomeId, userId, updateData);

        if (!updated) {
            return res.status(400).json({
                success: false,
                message: "Failed to update income record",
            });
        }

        // Get updated income
        const updatedIncome = await Income.findById(incomeId, userId);

        res.status(200).json({
            success: true,
            data: updatedIncome,
        });
    } catch (error) {
        console.error("Error updating income record:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update income record",
            error: error.message,
        });
    }
};

// Delete an income record
exports.deleteIncome = async (req, res) => {
    try {
        const userId = req.user.id;
        const incomeId = req.params.id;

        // Check if income exists
        const income = await Income.findById(incomeId, userId);

        if (!income) {
            return res.status(404).json({
                success: false,
                message: "Income record not found",
            });
        }

        // Delete income
        const deleted = await Income.delete(incomeId, userId);

        if (!deleted) {
            return res.status(400).json({
                success: false,
                message: "Failed to delete income record",
            });
        }

        res.status(200).json({
            success: true,
            message: "Income record deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting income record:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete income record",
            error: error.message,
        });
    }
};

// Get income summary
exports.getIncomeSummary = async (req, res) => {
    try {
        const userId = req.user.id;
        const { period = "month", startDate, endDate } = req.query;

        // Get total income
        const totalIncome = await Income.getTotal(userId, { startDate, endDate });

        // Get source breakdown
        const sourceBreakdown = await Income.getSourceSummary(userId, period);

        res.status(200).json({
            success: true,
            data: {
                totalIncome,
                sourceBreakdown,
            },
        });
    } catch (error) {
        console.error("Error getting income summary:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get income summary",
            error: error.message,
        });
    }
};
