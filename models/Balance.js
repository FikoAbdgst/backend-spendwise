// models/Balance.js
const db = require("../config/db");

class Balance {
    static async getByUserId(userId) {
        try {
            const [rows] = await db.execute("SELECT * FROM balances WHERE user_id = ?", [userId]);

            return rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    static async create(userId, amount = 0) {
        try {
            await db.execute("INSERT INTO balances (user_id, amount) VALUES (?, ?)", [userId, amount]);

            return { user_id: userId, amount };
        } catch (error) {
            throw error;
        }
    }

    static async update(userId, amount) {
        try {
            const [result] = await db.execute("UPDATE balances SET amount = ? WHERE user_id = ?", [
                amount,
                userId,
            ]);

            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async ensureExists(userId) {
        try {
            // Check if balance exists
            const balance = await this.getByUserId(userId);

            // If not, create it
            if (!balance) {
                return await this.create(userId, 0);
            }

            return balance;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Balance;
