// routes/balance.js
const express = require('express');
const { verifyToken } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// Get user's financial summary
router.get('/summary', verifyToken, async (req, res) => {
    try {
        // Get user's balance
        const [balances] = await db.query(
            'SELECT amount FROM balances WHERE user_id = ?',
            [req.user.id]
        );

        // Calculate total income
        const [incomeResult] = await db.query(
            'SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = "income"',
            [req.user.id]
        );

        // Calculate total expenses
        const [expenseResult] = await db.query(
            'SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND type = "expense"',
            [req.user.id]
        );

        const balance = balances.length > 0 ? balances[0].amount : 0;
        const totalIncome = incomeResult[0].total || 0;
        const totalExpenses = expenseResult[0].total || 0;

        res.status(200).json({
            success: true,
            data: {
                balance,
                totalIncome,
                totalExpenses
            }
        });
    } catch (error) {
        console.error('Get summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving financial summary'
        });
    }
});

// Get recent transactions
router.get('/recent-transactions', verifyToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const [transactions] = await db.query(
            `SELECT 
        id, type, name, amount, date, icon, created_at
      FROM 
        transactions
      WHERE 
        user_id = ?
      ORDER BY 
        date DESC, created_at DESC
      LIMIT ?`,
            [req.user.id, limit]
        );

        res.status(200).json({
            success: true,
            data: transactions
        });
    } catch (error) {
        console.error('Get recent transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving recent transactions'
        });
    }
});

// Get monthly balance data for charts
router.get('/monthly-balance', verifyToken, async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();

        // Get monthly income
        const [incomeByMonth] = await db.query(
            `SELECT 
        MONTH(date) as month, 
        SUM(amount) as total
      FROM 
        transactions
      WHERE 
        user_id = ? 
        AND type = 'income'
        AND YEAR(date) = ?
      GROUP BY 
        MONTH(date)
      ORDER BY 
        month`,
            [req.user.id, currentYear]
        );

        // Get monthly expenses
        const [expensesByMonth] = await db.query(
            `SELECT 
        MONTH(date) as month, 
        SUM(amount) as total
      FROM 
        transactions
      WHERE 
        user_id = ? 
        AND type = 'expense'
        AND YEAR(date) = ?
      GROUP BY 
        MONTH(date)
      ORDER BY 
        month`,
            [req.user.id, currentYear]
        );

        // Format data for frontend chart
        const months = Array.from({ length: 12 }, (_, i) => i + 1);
        const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        const data = months.map(month => {
            const income = incomeByMonth.find(item => item.month === month);
            const expense = expensesByMonth.find(item => item.month === month);

            return {
                name: monthNames[month - 1],
                income: income ? income.total : 0,
                expense: expense ? expense.total : 0,
                balance: (income ? income.total : 0) - (expense ? expense.total : 0)
            };
        });

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Get monthly balance error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving monthly balance data'
        });
    }
});

// Add a new transaction (income or expense)
router.post('/transaction', verifyToken, async (req, res) => {
    try {
        const { type, name, amount, date, icon } = req.body;

        // Validate input
        if (!type || !name || !amount || !date) {
            return res.status(400).json({
                success: false,
                message: 'Semua field harus diisi'
            });
        }

        // Validate transaction type
        if (type !== 'income' && type !== 'expense') {
            return res.status(400).json({
                success: false,
                message: 'Tipe transaksi tidak valid'
            });
        }

        // Begin transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Insert transaction
            const [result] = await connection.query(
                `INSERT INTO transactions 
          (user_id, type, name, amount, date, icon) 
         VALUES 
          (?, ?, ?, ?, ?, ?)`,
                [req.user.id, type, name, amount, date, icon]
            );

            // Update balance
            const balanceChange = type === 'income' ? amount : -amount;

            await connection.query(
                `UPDATE balances 
         SET amount = amount + ? 
         WHERE user_id = ?`,
                [balanceChange, req.user.id]
            );

            await connection.commit();

            res.status(201).json({
                success: true,
                message: 'Transaksi berhasil ditambahkan',
                data: {
                    id: result.insertId,
                    type,
                    name,
                    amount,
                    date,
                    icon
                }
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Add transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding transaction'
        });
    }
});

// Delete a transaction
router.delete('/transaction/:id', verifyToken, async (req, res) => {
    try {
        const transactionId = req.params.id;

        // Begin transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Get transaction details first to adjust balance
            const [transactions] = await connection.query(
                'SELECT type, amount FROM transactions WHERE id = ? AND user_id = ?',
                [transactionId, req.user.id]
            );

            if (transactions.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
            }

            const transaction = transactions[0];

            // Delete the transaction
            const [result] = await connection.query(
                'DELETE FROM transactions WHERE id = ? AND user_id = ?',
                [transactionId, req.user.id]
            );

            if (result.affectedRows === 0) {
                await connection.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Transaction not found or you are not authorized'
                });
            }

            // Update balance
            const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;

            await connection.query(
                'UPDATE balances SET amount = amount + ? WHERE user_id = ?',
                [balanceChange, req.user.id]
            );

            await connection.commit();

            res.status(200).json({
                success: true,
                message: 'Transaction deleted successfully'
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting transaction'
        });
    }
});

module.exports = router;