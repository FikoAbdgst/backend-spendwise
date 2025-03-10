const db = require("../config/db");

class Expense {
  static async create(userId, expenseData) {
    const { icon, category, amount, date } = expenseData;

    try {
      const [result] = await db.execute(
        "INSERT INTO expenses (user_id, icon, category, amount, date) VALUES (?, ?, ?, ?, ?)",
        [userId, icon, category, amount, date]
      );

      return { id: result.insertId, userId, ...expenseData };
    } catch (error) {
      throw error;
    }
  }

  static async findByUserId(userId, filters = {}) {
    let query = "SELECT * FROM expenses WHERE user_id = ?";
    const queryParams = [userId];

    // Handle date filtering
    if (filters.startDate && filters.endDate) {
      query += " AND date BETWEEN ? AND ?";
      queryParams.push(filters.startDate, filters.endDate);
    } else if (filters.startDate) {
      query += " AND date >= ?";
      queryParams.push(filters.startDate);
    } else if (filters.endDate) {
      query += " AND date <= ?";
      queryParams.push(filters.endDate);
    }

    // Handle category filtering
    if (filters.category) {
      query += " AND category = ?";
      queryParams.push(filters.category);
    }

    // Add ordering
    query += " ORDER BY date DESC";

    try {
      const [rows] = await db.execute(query, queryParams);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id, userId) {
    try {
      const [rows] = await db.execute("SELECT * FROM expenses WHERE id = ? AND user_id = ?", [
        id,
        userId,
      ]);

      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async update(id, userId, updateData) {
    const { icon, category, amount, date } = updateData;

    try {
      const [result] = await db.execute(
        "UPDATE expenses SET icon = ?, category = ?, amount = ?, date = ? WHERE id = ? AND user_id = ?",
        [icon, category, amount, date, id, userId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id, userId) {
    try {
      const [result] = await db.execute("DELETE FROM expenses WHERE id = ? AND user_id = ?", [
        id,
        userId,
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async getRecent(userId, limit) {
    try {
      limit = Number(limit);
      if (isNaN(limit) || limit <= 0) limit = 5;

      const query = `
      SELECT id, category, amount, icon, date, created_at 
      FROM expenses 
      WHERE user_id = ? 
      ORDER BY date DESC 
      LIMIT ${limit}`;

      const [rows] = await db.execute(query, [userId]);

      return rows;
    } catch (error) {
      console.error("Error in getRecent of Expense model:", error);
      throw error;
    }
  }

  static async getTotal(userId, filters = {}) {
    let query = "SELECT SUM(amount) as total FROM expenses WHERE user_id = ?";
    const queryParams = [userId];

    // Handle date filtering
    if (filters.startDate && filters.endDate) {
      query += " AND date BETWEEN ? AND ?";
      queryParams.push(filters.startDate, filters.endDate);
    } else if (filters.startDate) {
      query += " AND date >= ?";
      queryParams.push(filters.startDate);
    } else if (filters.endDate) {
      query += " AND date <= ?";
      queryParams.push(filters.endDate);
    }

    try {
      const [rows] = await db.execute(query, queryParams);
      return rows[0].total || 0;
    } catch (error) {
      throw error;
    }
  }

  static async getCategorySummary(userId, period = "month") {
    let dateFilter;

    // Create date filter based on period (month, year, etc.)
    if (period === "month") {
      dateFilter = "AND YEAR(date) = YEAR(CURRENT_DATE) AND MONTH(date) = MONTH(CURRENT_DATE)";
    } else if (period === "year") {
      dateFilter = "AND YEAR(date) = YEAR(CURRENT_DATE)";
    } else {
      dateFilter = "";
    }

    try {
      const [rows] = await db.execute(
        `SELECT category, SUM(amount) as total 
         FROM expenses 
         WHERE user_id = ? ${dateFilter}
         GROUP BY category 
         ORDER BY total DESC`,
        [userId]
      );

      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Expense;
