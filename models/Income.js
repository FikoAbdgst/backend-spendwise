const db = require("../config/db");

class Income {
  static async create(userId, incomeData) {
    const { icon, source, amount, date } = incomeData;

    try {
      const [result] = await db.execute(
        "INSERT INTO income (user_id, icon, source, amount, date) VALUES (?, ?, ?, ?, ?)",
        [userId, icon, source, amount, date]
      );

      return { id: result.insertId, userId, ...incomeData };
    } catch (error) {
      throw error;
    }
  }

  static async getRecent(userId, limit) {
    try {
      limit = Number(limit);
      if (isNaN(limit) || limit <= 0) limit = 5;

      const query = `
      SELECT id, source, amount, icon, date, created_at 
      FROM income 
      WHERE user_id = ? 
      ORDER BY date DESC 
      LIMIT ${limit}`;

      const [rows] = await db.execute(query, [userId]);

      return rows;
    } catch (error) {
      console.error("Error in getRecent of Income model:", error);
      throw error;
    }
  }

  static async findByUserId(userId, filters = {}) {
    let query = "SELECT * FROM income WHERE user_id = ?";
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

    // Handle source filtering
    if (filters.source) {
      query += " AND source = ?";
      queryParams.push(filters.source);
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
      const [rows] = await db.execute("SELECT * FROM income WHERE id = ? AND user_id = ?", [
        id,
        userId,
      ]);

      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async update(id, userId, updateData) {
    const { icon, source, amount, date } = updateData;

    try {
      const [result] = await db.execute(
        "UPDATE income SET icon = ?, source = ?, amount = ?, date = ? WHERE id = ? AND user_id = ?",
        [icon, source, amount, date, id, userId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id, userId) {
    try {
      const [result] = await db.execute("DELETE FROM income WHERE id = ? AND user_id = ?", [
        id,
        userId,
      ]);

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async getTotal(userId, filters = {}) {
    let query = "SELECT SUM(amount) as total FROM income WHERE user_id = ?";
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

  static async getSourceSummary(userId, period = "month") {
    let dateFilter;

    // Create date filter based on period
    if (period === "month") {
      dateFilter = "AND YEAR(date) = YEAR(CURRENT_DATE) AND MONTH(date) = MONTH(CURRENT_DATE)";
    } else if (period === "year") {
      dateFilter = "AND YEAR(date) = YEAR(CURRENT_DATE)";
    } else {
      dateFilter = "";
    }

    try {
      const [rows] = await db.execute(
        `SELECT source, SUM(amount) as total 
         FROM income 
         WHERE user_id = ? ${dateFilter}
         GROUP BY source 
         ORDER BY total DESC`,
        [userId]
      );

      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Income;
