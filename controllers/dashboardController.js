const Expense = require("../models/Expense");
const Income = require("../models/Income");
const db = require("../config/db");

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

exports.getMonthlyData = async (req, res) => {
  try {
    const userId = req.user.id;

    const today = new Date();
    const monthsData = [];
    const monthsBack = 6;
    for (let i = monthsBack; i >= 0; i--) {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);

      const startDate = startOfMonth.toISOString().split("T")[0];
      const endDate = endOfMonth.toISOString().split("T")[0];

      const [incomeResults] = await db.execute(
        `SELECT COALESCE(SUM(amount), 0) as total FROM income 
         WHERE user_id = ? AND date BETWEEN ? AND ?`,
        [userId, startDate, endDate]
      );

      const [expenseResults] = await db.execute(
        `SELECT COALESCE(SUM(amount), 0) as total FROM expenses 
         WHERE user_id = ? AND date BETWEEN ? AND ?`,
        [userId, startDate, endDate]
      );

      const income = incomeResults[0].total || 0;
      const expenses = expenseResults[0].total || 0;
      const balance = income - expenses;

      monthsData.push({
        month: startOfMonth,
        income,
        expenses,
        balance,
      });
    }

    res.status(200).json({
      success: true,
      data: monthsData,
    });
  } catch (error) {
    console.error("Error fetching monthly data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch monthly data",
      error: error.message,
    });
  }
};

exports.getWeeklyData = async (req, res) => {
  try {
    const userId = req.user.id;

    const today = new Date();
    const weeksData = [];

    for (let i = 3; i >= 0; i--) {
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() - ((today.getDay() + 1) % 7) - i * 7);

      const startOfWeek = new Date(endOfWeek);
      startOfWeek.setDate(endOfWeek.getDate() - 6);

      const startDate = startOfWeek.toISOString().split("T")[0];
      const endDate = endOfWeek.toISOString().split("T")[0];

      const [incomeResults] = await db.execute(
        `SELECT COALESCE(SUM(amount), 0) as total FROM income 
         WHERE user_id = ? AND date BETWEEN ? AND ?`,
        [userId, startDate, endDate]
      );

      const [expenseResults] = await db.execute(
        `SELECT COALESCE(SUM(amount), 0) as total FROM expenses 
         WHERE user_id = ? AND date BETWEEN ? AND ?`,
        [userId, startDate, endDate]
      );

      const income = incomeResults[0].total || 0;
      const expenses = expenseResults[0].total || 0;
      const balance = income - expenses;

      weeksData.push({
        week: i + 1,
        startDate: startOfWeek,
        endDate: endOfWeek,
        income,
        expenses,
        balance,
      });
    }

    res.status(200).json({
      success: true,
      data: weeksData,
    });
  } catch (error) {
    console.error("Error fetching weekly data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch weekly data",
      error: error.message,
    });
  }
};

exports.getDailyData = async (req, res) => {
  try {
    const userId = req.user.id;

    const today = new Date();
    const dailyData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      const formattedDate = date.toISOString().split("T")[0];

      const [incomeResults] = await db.execute(
        `SELECT COALESCE(SUM(amount), 0) as total FROM income 
         WHERE user_id = ? AND date = ?`,
        [userId, formattedDate]
      );

      const [expenseResults] = await db.execute(
        `SELECT COALESCE(SUM(amount), 0) as total FROM expenses 
         WHERE user_id = ? AND date = ?`,
        [userId, formattedDate]
      );

      const income = incomeResults[0].total || 0;
      const expenses = expenseResults[0].total || 0;
      const balance = income - expenses;

      dailyData.push({
        date,
        income,
        expenses,
        balance,
      });
    }

    res.status(200).json({
      success: true,
      data: dailyData,
    });
  } catch (error) {
    console.error("Error fetching daily data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch daily data",
      error: error.message,
    });
  }
};
