

import db from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// REGISTER
export const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role = "EMPLOYEE", company_id } = req.body;
    console.log("🔍 Backend register received:", { name, email, role, company_id });

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!company_id) {
      return res.status(400).json({
        success: false,
        message: "Business Unit is required",
      });
    }

    // Validate company_id exists
    const [companies] = await db.query(
      "SELECT company_id FROM companies WHERE company_id = ?",
      [company_id]
    );

    if (companies.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid Business Unit selected",
      });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Check password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // Check if email already exists
    const [existingUser] = await db.query(
      "SELECT email FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in database
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, role, company_id) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashedPassword, role, company_id]
    );
    console.log("💾 User saved to DB with role:", role, "company_id:", company_id, "ID:", result.insertId);

    // Create JWT token
    const token = jwt.sign(
      { id: result.insertId, role: role, company_id: company_id },
      process.env.JWT_KEY,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: result.insertId,
        name,
        email,
        role: role,
        company_id: company_id,
      },
    });
    console.log("✅ Sent response with role:", role, "company_id:", company_id);
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // 1. Check user exists and fetch is_first_login + status
    const [rows] = await db.query(
      "SELECT user_id, name, email, password, role, company_id, is_first_login, status FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const user = rows[0];

    // 2. Check if user is active
    if (user.status === "INACTIVE") {
      return res
        .status(403)
        .json({ success: false, message: "User account is inactive" });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    // 4. Generate JWT
    const token = jwt.sign(
      { id: user.user_id, role: user.role, company_id: user.company_id },
      process.env.JWT_KEY,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // 5. Send response with is_first_login flag
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
        is_first_login: user.is_first_login,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// CHANGE PASSWORD (Requires authentication)
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id; // From verifyUser middleware
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // 1. Validate inputs
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
      });
    }

    // 2. Fetch user and verify old password
    const [users] = await db.query(
      "SELECT user_id, password FROM users WHERE user_id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];
    const isOldPasswordMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isOldPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // 3. Hash new password and update database
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db.query(
      "UPDATE users SET password = ?, is_first_login = FALSE WHERE user_id = ?",
      [hashedNewPassword, userId]
    );

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// REGISTER HR (Admin only)
export const registerHR = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Check password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // Check if email already exists
    const [existingUser] = await db.query(
      "SELECT email FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create HR user in database
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, "HR"]
    );

    res.status(201).json({
      success: true,
      message: "HR registered successfully",
      user: {
        id: result.insertId,
        name,
        email,
        role: "HR",
      },
    });
  } catch (error) {
    console.error("REGISTER HR ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// REGISTER ADMIN (Admin only)
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Check password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // Check if email already exists
    const [existingUser] = await db.query(
      "SELECT email FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user in database
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, "COMPANY_ADMIN"]
    );

    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      user: {
        id: result.insertId,
        name,
        email,
        role: "COMPANY_ADMIN",
      },
    });
  } catch (error) {
    console.error("REGISTER ADMIN ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET ALL COMPANIES (Public - for registration page)
export const getCompaniesForRegistration = async (req, res) => {
  try {
    const [companies] = await db.query(
      "SELECT company_id, name FROM companies ORDER BY name ASC"
    );

    res.status(200).json({
      success: true,
      data: companies || [],
    });
  } catch (error) {
    console.error("GET COMPANIES ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

