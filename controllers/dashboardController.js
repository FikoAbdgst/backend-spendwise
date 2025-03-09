const Expense = require("../models/Expense");
const Income = require("../models/Income");

exports.getDashboardData = async (req, res) => {
    try {
        const userId = req.user.id;
        const { period = "month" } = req.query;

        // Get total income and expenses
        const totalIncome = await Income.getTotal(userId, { period });
        const totalExpenses = await Expense.getTotal(userId, { period });

        // Calculate balance
        const balance = totalIncome - totalExpenses;

        // Get category summaries
        const expenseCategories = await Expense.getCategorySummary(userId, period);
        const incomeSources = await Income.getSourceSummary(userId, period);

        res.status(200).json({
            success: true,
            data: {
                totalIncome,
                totalExpenses,
                balance,
                expenseCategories,
                incomeSources,
            },
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard data",
            error: error.message,
        });
    }
};

exports.getRecentTransactions = async (userId, limit = 5) => {
    try {
        const recentIncomes = await Income.findAll({
            where: { user_id: userId },
            attributes: [
                "id",
                "source",
                "amount",
                "icon",
                "date",
                "created_at",
                [sequelize.literal("'income'"), "type"],
            ],
            order: [["date", "DESC"]],
            limit,
        });

        const recentExpenses = await Expense.findAll({
            where: { user_id: userId },
            attributes: [
                "id",
                "category",
                "icon",
                "amount",
                "date",
                "created_at",
                [sequelize.literal("'expense'"), "type"],
            ],
            order: [["date", "DESC"]],
            limit,
        });

        return [...recentIncomes, ...recentExpenses]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    } catch (error) {
        console.error("Error in getRecentTransactions:", error);
        return [];
    }
};
