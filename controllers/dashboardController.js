const Expense = require("../models/Expense");
const Income = require("../models/Income");

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = "month" } = req.query;

    const totalIncome = await Income.getTotal(userId, { period });
    const totalExpenses = await Expense.getTotal(userId, { period });

    const balance = totalIncome - totalExpenses;

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

exports.getRecentTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    let limit = 5;
    if (req.query.limit && !isNaN(parseInt(req.query.limit))) {
      limit = parseInt(req.query.limit);
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (limit <= 0) limit = 5;

    const recentExpenses = await Expense.getRecent(userId, limit);
    const recentIncomes = await Income.getRecent(userId, limit);

    const formattedExpenses = recentExpenses.map((expense) => ({
      id: expense.id,
      category: expense.category,
      amount: expense.amount,
      icon: expense.icon,
      date: expense.date,
      created_at: expense.created_at,
      type: "expense",
    }));

    const formattedIncomes = recentIncomes.map((income) => ({
      id: income.id,
      source: income.source,
      amount: income.amount,
      icon: income.icon,
      date: income.date,
      created_at: income.created_at,
      type: "income",
    }));

    const combinedTransactions = [...formattedExpenses, ...formattedIncomes]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);

    res.status(200).json({
      success: true,
      data: combinedTransactions,
    });
  } catch (error) {
    console.error("Error fetching recent transactions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent transactions",
      error: error.message,
    });
  }
};
