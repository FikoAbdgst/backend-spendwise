// routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const router = express.Router();

// Password validation function
const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { full_name, email, password, confirmPassword } = req.body;

    // Validate input
    if (!full_name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Semua field harus diisi",
      });
    }

    // Validate password and confirmPassword match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password dan konfirmasi password tidak cocok",
      });
    }

    // Validate password strength
    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password harus minimal 8 karakter dan mengandung huruf besar, huruf kecil, dan angka",
      });
    }

    // Check if user already exists
    const [existingUsers] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email sudah terdaftar",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const [result] = await db.query(
      "INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)",
      [full_name, email, hashedPassword]
    );

    // Create initial balance record
    if (result.insertId) {
      await db.query("INSERT INTO balances (user_id, amount) VALUES (?, ?)", [result.insertId, 0]);
    }

    res.status(201).json({
      success: true,
      message: "Registrasi berhasil",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat registrasi",
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email dan password harus diisi",
      });
    }

    // Find user
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Email belum terdaftar",
      });
    }

    const user = users[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({
        success: false,
        message: "Password kurang tepat",
      });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    // Return user data and token
    const userData = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
    };

    res.status(200).json({
      success: true,
      message: "Login berhasil",
      token,
      user: userData,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat login",
    });
  }
});

// Get user profile
router.get("/profile", require("../middleware/auth").verifyToken, async (req, res) => {
  try {
    const [users] = await db.query("SELECT id, full_name, email, created_at FROM users WHERE id = ?", [
      req.user.id,
    ]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: users[0],
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving user profile",
    });
  }
});

// Update user profile
router.put("/update-profile", require("../middleware/auth").verifyToken, async (req, res) => {
  try {
    const { full_name, email } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!full_name || !email) {
      return res.status(400).json({
        success: false,
        message: "Nama lengkap dan email harus diisi",
      });
    }

    // Check if email already exists for another user
    if (email !== req.user.email) {
      const [existingUsers] = await db.query("SELECT * FROM users WHERE email = ? AND id != ?", [
        email,
        userId,
      ]);

      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Email sudah digunakan oleh pengguna lain",
        });
      }
    }

    // Update user data
    await db.query("UPDATE users SET full_name = ?, email = ? WHERE id = ?", [
      full_name,
      email,
      userId,
    ]);

    // Get updated user data
    const [updatedUsers] = await db.query(
      "SELECT id, full_name, email, created_at FROM users WHERE id = ?",
      [userId]
    );

    res.status(200).json({
      success: true,
      message: "Profil berhasil diperbarui",
      user: updatedUsers[0],
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat memperbarui profil",
    });
  }
});

// Update user password
router.put("/update-password", require("../middleware/auth").verifyToken, async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).json({
        success: false,
        message: "Semua field password harus diisi",
      });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: "Password baru dan konfirmasi password tidak cocok",
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password baru harus minimal 6 karakter",
      });
    }

    // Get current user data
    const [users] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan",
      });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(current_password, users[0].password);
    if (!validPassword) {
      return res.status(400).json({
        success: false,
        message: "Password saat ini tidak tepat",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    // Update password
    await db.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);

    res.status(200).json({
      success: true,
      message: "Password berhasil diperbarui",
    });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat memperbarui password",
    });
  }
});

module.exports = router;
