import db from "../config/db.js";

// ================ EMPLOYEE SELF-SERVICE ================

// GET EMPLOYEE PROFILE
export const getEmployeeProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [employee] = await db.query(
      "SELECT user_id, name, email, phone, department, designation, role, created_at FROM users WHERE user_id = ? AND role = ?",
      [userId, "EMPLOYEE"]
    );

    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: employee[0],
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// UPDATE EMPLOYEE PROFILE
export const updateEmployeeProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { name, email, phone, department, designation } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    await db.query(
      "UPDATE users SET name = ?, email = ?, phone = ?, department = ?, designation = ?, updated_at = NOW() WHERE user_id = ?",
      [name, email, phone || null, department || null, designation || null, userId]
    );

    const [updated] = await db.query(
      "SELECT user_id, name, email, phone, department, designation, role, created_at FROM users WHERE user_id = ?",
      [userId]
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updated[0],
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET EMPLOYEE'S OWN LEAVES
export const getEmployeeLeaves = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [leaves] = await db.query(
      `SELECT 
        leave_id,
        user_id,
        start_date,
        end_date,
        reason,
        status,
        created_at,
        updated_at
      FROM leaves
      WHERE user_id = ?
      ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      message: "Leave requests retrieved successfully",
      data: leaves || [],
      total: (leaves || []).length,
    });
  } catch (error) {
    console.error("GET EMPLOYEE LEAVES ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// APPLY FOR LEAVE
export const applyForLeave = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { start_date, end_date, reason } = req.body || {};

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    // Validate date format and logic
    const start = new Date(start_date);
    const end = new Date(end_date);

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: "Start date must be before end date",
      });
    }

    if (start < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Cannot apply for leave in the past",
      });
    }

    await db.query(
      "INSERT INTO leaves (user_id, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, ?)",
      [userId, start_date, end_date, reason || null, "PENDING"]
    );

    res.status(201).json({
      success: true,
      message: "Leave request submitted successfully",
    });
  } catch (error) {
    console.error("APPLY LEAVE ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET EMPLOYEE DASHBOARD
export const getEmployeeDashboard = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Total leaves applied
    const [totalLeavesData] = await db.query(
      "SELECT COUNT(*) as count FROM leaves WHERE user_id = ?",
      [userId]
    );

    // Pending leaves
    const [pendingLeavesData] = await db.query(
      "SELECT COUNT(*) as count FROM leaves WHERE user_id = ? AND status = ?",
      [userId, "PENDING"]
    );

    // Approved leaves
    const [approvedLeavesData] = await db.query(
      "SELECT COUNT(*) as count FROM leaves WHERE user_id = ? AND status = ?",
      [userId, "APPROVED"]
    );

    // Rejected leaves
    const [rejectedLeavesData] = await db.query(
      "SELECT COUNT(*) as count FROM leaves WHERE user_id = ? AND status = ?",
      [userId, "REJECTED"]
    );

    // Recent leave requests
    const [recentLeaves] = await db.query(
      `SELECT 
        leave_id,
        start_date,
        end_date,
        reason,
        status,
        created_at
      FROM leaves
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 5`,
      [userId]
    );

    res.status(200).json({
      success: true,
      message: "Employee dashboard retrieved successfully",
      data: {
        totalLeaves: totalLeavesData[0]?.count || 0,
        pendingLeaves: pendingLeavesData[0]?.count || 0,
        approvedLeaves: approvedLeavesData[0]?.count || 0,
        rejectedLeaves: rejectedLeavesData[0]?.count || 0,
        recentLeaves: recentLeaves || [],
      },
    });
  } catch (error) {
    console.error("GET EMPLOYEE DASHBOARD ERROR:", error.message);
    res.status(500).json({
      success: true,
      message: "Employee dashboard",
      data: {
        totalLeaves: 0,
        pendingLeaves: 0,
        approvedLeaves: 0,
        rejectedLeaves: 0,
        recentLeaves: [],
      },
    });
  }
};

// GET COMPANY EVENTS
export const getEmployeeEvents = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const [events] = await db.query(
      `SELECT 
        e.event_id,
        e.title,
        e.description,
        e.event_date,
        e.location,
        u.name as created_by,
        e.created_at
      FROM events e
      JOIN users u ON e.created_by = u.user_id
      WHERE e.company_id = ?
      ORDER BY e.event_date DESC`,
      [companyId]
    );

    res.status(200).json({
      success: true,
      message: "Events retrieved successfully",
      data: events || [],
    });
  } catch (error) {
    console.error("GET EMPLOYEE EVENTS ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching events",
    });
  }
};

// GET EMPLOYEE SALARY SLIP
export const getEmployeeSalarySlip = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Fetch employee details
    const [employee] = await db.query(
      "SELECT * FROM users WHERE user_id = ? AND role = ?",
      [userId, "EMPLOYEE"]
    );

    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const emp = employee[0];

    // Sample salary slip data (can be extended with leave deductions, etc.)
    const basicSalary = 50000; // Default, can be stored in DB
    const dearness = basicSalary * 0.10; // 10% of basic
    const houseAllowance = basicSalary * 0.20; // 20% of basic
    const otherAllowance = basicSalary * 0.05; // 5% of basic
    const grossSalary = basicSalary + dearness + houseAllowance + otherAllowance;

    // Deductions
    const incomeTax = grossSalary * 0.08; // 8%
    const pf = basicSalary * 0.12; // 12% of basic
    const esi = basicSalary * 0.0325; // 3.25% of basic
    const insurance = 500; // Fixed
    const totalDeductions = incomeTax + pf + esi + insurance;

    const netSalary = grossSalary - totalDeductions;

    res.json({
      success: true,
      data: {
        employee: {
          name: emp.name,
          email: emp.email,
          department: emp.department || "N/A",
          designation: emp.designation || "N/A",
          phone: emp.phone || "N/A",
        },
        salary: {
          basicSalary,
          allowances: {
            dearness,
            houseAllowance,
            otherAllowance,
          },
          grossSalary,
          deductions: {
            incomeTax,
            pf,
            esi,
            insurance,
          },
          totalDeductions,
          netSalary,
        },
        month: new Date().toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
      },
    });
  } catch (error) {
    console.error("Error fetching employee salary slip:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching salary slip data",
    });
  }
};
