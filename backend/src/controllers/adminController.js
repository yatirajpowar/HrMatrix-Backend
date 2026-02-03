import db from "../config/db.js";
import bcrypt from "bcrypt";

// ================ USER MANAGEMENT ================

// GET ALL USERS
export const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT user_id, name, email, role, company_id, created_at FROM users"
    );

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: users,
      total: users.length,
    });
  } catch (error) {
    console.error("GET ALL USERS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET USER BY ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const [user] = await db.query(
      "SELECT user_id, name, email, role, created_at FROM users WHERE user_id = ?",
      [id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: user[0],
    });
  } catch (error) {
    console.error("GET USER BY ID ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// UPDATE USER
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, company_id } = req.body || {};

    if (!name || !email || !role || !company_id) {
      return res.status(400).json({
        success: false,
        message: "All fields (name, email, role, company_id) are required",
      });
    }

    // Check if user exists
    const [user] = await db.query(
      "SELECT user_id FROM users WHERE user_id = ?",
      [id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if email already exists (for other users)
    const [emailCheck] = await db.query(
      "SELECT user_id FROM users WHERE email = ? AND user_id != ?",
      [email, id]
    );

    if (emailCheck.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already in use",
      });
    }

    // Validate company_id exists
    const [companies] = await db.query(
      "SELECT company_id FROM companies WHERE company_id = ?",
      [company_id]
    );

    if (companies.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid Business Unit" });
    }

    // If role is HR, ensure there's no other HR for this company_id
    if (role === "HR") {
      const [hrCheck] = await db.query(
        "SELECT user_id FROM users WHERE role = 'HR' AND company_id = ? AND user_id != ?",
        [company_id, id]
      );
      if (hrCheck.length > 0) {
        return res.status(409).json({ success: false, message: "This Business Unit already has an HR user" });
      }
    }

    await db.query(
      "UPDATE users SET name = ?, email = ?, role = ?, company_id = ? WHERE user_id = ?",
      [name, email, role, company_id, id]
    );

    res.status(200).json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("UPDATE USER ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// DELETE USER
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const [user] = await db.query(
      "SELECT user_id FROM users WHERE user_id = ?",
      [id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent deleting super admin
    const [adminCheck] = await db.query(
      "SELECT role FROM users WHERE user_id = ?",
      [id]
    );

    if (adminCheck[0].role === "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Cannot delete SUPER_ADMIN user",
      });
    }

    await db.query("DELETE FROM users WHERE user_id = ?", [id]);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("DELETE USER ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// RESET USER PASSWORD (Admin only)
export const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    // Check if user exists
    const [user] = await db.query("SELECT user_id, role FROM users WHERE user_id = ?", [id]);
    if (user.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Prevent resetting super admin via this endpoint
    if (user[0].role === "SUPER_ADMIN") {
      return res.status(403).json({ success: false, message: "Cannot reset SUPER_ADMIN password" });
    }

    const hashed = await bcrypt.hash(password, 10);
    await db.query("UPDATE users SET password = ? WHERE user_id = ?", [hashed, id]);

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ================ STATISTICS ================

// GET DASHBOARD STATS
export const getDashboardStats = async (req, res) => {
  try {
    // Total Users
    const [totalUsers] = await db.query(
      "SELECT COUNT(*) as count FROM users"
    );

    // Users by Role
    const [usersByRole] = await db.query(
      "SELECT role, COUNT(*) as count FROM users GROUP BY role"
    );

    // Business units with employee counts
    const [businessUnits] = await db.query(
      `SELECT c.company_id, c.name,
        (SELECT COUNT(*) FROM users u WHERE u.company_id = c.company_id AND u.role = 'EMPLOYEE') as employee_count,
        (SELECT COUNT(*) FROM users u WHERE u.company_id = c.company_id AND u.role = 'HR') as hr_count
      FROM companies c
      ORDER BY c.name ASC`
    );

    res.status(200).json({
      success: true,
      message: "Dashboard stats retrieved successfully",
      data: {
        totalUsers: totalUsers[0].count,
        usersByRole: usersByRole,
        businessUnits: businessUnits,
      },
    });
  } catch (error) {
    console.error("GET STATS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ================ COMPANY MANAGEMENT ================

// GET ALL COMPANIES
export const getAllCompanies = async (req, res) => {
  try {
    const [companies] = await db.query(
      "SELECT * FROM companies"
    );

    res.status(200).json({
      success: true,
      message: "Companies retrieved successfully",
      data: companies,
      total: companies.length,
    });
  } catch (error) {
    console.error("GET COMPANIES ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// CREATE COMPANY
export const createCompany = async (req, res) => {
  try {
    const { name, email, address, default_leaves } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Company name is required",
      });
    }

    const [result] = await db.query(
      "INSERT INTO companies (name, email, address, default_leaves) VALUES (?, ?, ?, ?)",
      [name, email || null, address || null, default_leaves || 12]
    );

    res.status(201).json({
      success: true,
      message: "Company created successfully",
      data: {
        id: result.insertId,
        name,
        email,
      },
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Company email already exists",
      });
    }
    console.error("CREATE COMPANY ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// UPDATE COMPANY
export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, address, default_leaves } = req.body || {};

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Company name is required",
      });
    }

    await db.query(
      "UPDATE companies SET name = ?, email = ?, address = ?, default_leaves = ? WHERE company_id = ?",
      [name, email, address, default_leaves || 12, id]
    );

    res.status(200).json({
      success: true,
      message: "Company updated successfully",
    });
  } catch (error) {
    console.error("UPDATE COMPANY ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// DELETE COMPANY
export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query("DELETE FROM companies WHERE company_id = ?", [id]);

    res.status(200).json({
      success: true,
      message: "Company deleted successfully",
    });
  } catch (error) {
    console.error("DELETE COMPANY ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ================ REPORTS ================

// GET USER REPORT
export const getUserReport = async (req, res) => {
  try {
    const [report] = await db.query(
      `SELECT 
        role,
        COUNT(*) as total,
        DATE(created_at) as date
      FROM users
      GROUP BY role, DATE(created_at)
      ORDER BY DATE(created_at) DESC`
    );

    res.status(200).json({
      success: true,
      message: "User report retrieved successfully",
      data: report,
    });
  } catch (error) {
    console.error("GET REPORT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// CREATE USER INVITE (Admin only)
export const createUserInvite = async (req, res) => {
  try {
    const { name, email, role, company_id } = req.body;

    if (!name || !email || !role || !company_id) {
      return res.status(400).json({ success: false, message: "Name, email, role and company_id are required" });
    }

    // Validate company
    const [companies] = await db.query("SELECT company_id FROM companies WHERE company_id = ?", [company_id]);
    if (companies.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid Business Unit" });
    }

    // If role is HR, ensure only one HR per company
    if (role === "HR") {
      const [hrExists] = await db.query("SELECT user_id FROM users WHERE role = 'HR' AND company_id = ?", [company_id]);
      if (hrExists.length > 0) {
        return res.status(409).json({ success: false, message: "This Business Unit already has an HR user" });
      }
    }

    // Check if email already exists
    const [existing] = await db.query("SELECT user_id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    // Create a temporary random password (will be replaced when invite accepted)
    const tempPassword = Math.random().toString(36).slice(-12) + "A1!";
    const hashed = await bcrypt.hash(tempPassword, 10);

    // Insert user with role, company_id and temporary password
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, role, company_id) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashed, role, company_id]
    );

    const userId = result.insertId;

    // ensure invites table exists
    await db.query(
      `CREATE TABLE IF NOT EXISTS user_invites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    );

    // create invite token
    const token = require("crypto").randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

    await db.query(
      "INSERT INTO user_invites (user_id, token, expires_at) VALUES (?, ?, ?)",
      [userId, token, expiresAt]
    );

    // Return token (frontend/admin can email it)
    res.status(201).json({ success: true, message: "Invite created", data: { userId, token, expiresAt } });
  } catch (error) {
    console.error("CREATE USER INVITE ERROR:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET MONTHLY HIRING TREND
export const getMonthlyHiringTrend = async (req, res) => {
  try {
    console.log("🔄 Fetching monthly hiring trend...");
    
    // First, check users table
    try {
      const [usersCount] = await db.query("SELECT COUNT(*) as count FROM users WHERE role IN ('EMPLOYEE', 'HR')");
      console.log("📊 Users with EMPLOYEE or HR role:", usersCount[0]?.count);
    } catch (e) {
      console.error("Error counting users:", e.message);
    }

    // Get actual data - GROUP BY and SELECT must be consistent
    const [hires] = await db.query(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        DATE_FORMAT(created_at, '%b %Y') as monthLabel,
        COUNT(*) as total_hires,
        SUM(CASE WHEN role = 'EMPLOYEE' THEN 1 ELSE 0 END) as employee_hires,
        SUM(CASE WHEN role = 'HR' THEN 1 ELSE 0 END) as hr_hires
      FROM users
      WHERE role IN ('EMPLOYEE', 'HR')
      GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b %Y')
      ORDER BY DATE_FORMAT(created_at, '%Y-%m') ASC`
    );

    console.log("✅ MONTHLY HIRING TREND DATA:", hires);
    
    res.status(200).json({
      success: true,
      message: "Monthly hiring trend retrieved successfully",
      data: hires || [],
    });
  } catch (error) {
    console.error("🔴 GET MONTHLY HIRING TREND ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET EMPLOYEES BY DEPARTMENT (for charts)
export const getEmployeesByDepartment = async (req, res) => {
  try {
    const company_id = req.user?.company_id;

    // If no company_id in the request (e.g. user not assigned), return empty result
    if (!company_id) {
      return res.status(200).json({
        success: true,
        message: "No department data for unassigned business unit",
        data: [],
      });
    }

    const [data] = await db.query(
      `SELECT 
        COALESCE(department, 'Unassigned') as department,
        COUNT(*) as count
      FROM users
      WHERE role = 'EMPLOYEE' AND company_id = ?
      GROUP BY department
      ORDER BY count DESC`,
      [company_id]
    );

    res.status(200).json({
      success: true,
      message: "Employee department distribution retrieved successfully",
      data: data || [],
    });
  } catch (error) {
    console.error("GET EMPLOYEES BY DEPARTMENT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching employee department distribution",
    });
  }
};
