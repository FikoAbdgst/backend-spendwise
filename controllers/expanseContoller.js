const Income = require("../models/Income");

// Create a new income
exports.createIncome = async (req, res) => {
    try {
        const userId = req.user.id;
        const { icon, source, amount, date } = req.body;

        // Validate request
        if (!source || !amount || !date) {
            return res.status(400).json({ message: "Please provide source, amount, and date" });
        }

        // Create income
        const income = await Income.create(userId, { icon, source, amount, date });

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

// Update an income record
exports.updateIncome = async (req, res) => {
    try {
        const userId = req.user.id;
        const incomeId = req.params.id;
        const { icon, source, amount, date } = req.body;

        // Validate request
        if (!source || !amount || !date) {
            return res.status(400).json({ message: "Please provide source, amount, and date" });
        }

        // Check if income exists
        const existingIncome = await Income.findById(incomeId, userId);

        if (!existingIncome) {
            return res.status(404).json({
                success: false,
                message: "Income record not found",
            });
        }

        // Update income
        const updated = await Income.update(incomeId, userId, {
            icon,
            source,
            amount,
            date,
        });

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
