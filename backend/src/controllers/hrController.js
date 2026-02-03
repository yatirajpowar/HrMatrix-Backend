import db from "../config/db.js";
import bcrypt from "bcrypt";

// ================ EMPLOYEE MANAGEMENT ================

// GET ALL EMPLOYEES (filtered by HR's company_id)
export const getAllEmployees = async (req, res) => {
  try {
    const company_id = req.user?.company_id;

    let query = `SELECT u.user_id, u.name, u.email, u.phone, u.department, u.designation, u.role, u.company_id, u.created_at, c.name as business_unit
                 FROM users u
                 LEFT JOIN companies c ON u.company_id = c.company_id
                 WHERE u.role = ?`;
    let params = ["EMPLOYEE"];

    // If HR has a company_id, filter by it. Otherwise return all employees
    if (company_id) {
      query += ` AND u.company_id = ?`;
      params.push(company_id);
    }

    query += ` ORDER BY u.name ASC`;

    const [employees] = await db.query(query, params);

    res.status(200).json({
      success: true,
      message: "Employees retrieved successfully",
      data: employees,
      total: employees.length,
    });
  } catch (error) {
    console.error("GET EMPLOYEES ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET EMPLOYEE BY ID
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const [employee] = await db.query(
      "SELECT user_id, name, email, role, created_at FROM users WHERE user_id = ? AND role = ?",
      [id, "EMPLOYEE"]
    );

    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Employee retrieved successfully",
      data: employee[0],
    });
  } catch (error) {
    console.error("GET EMPLOYEE ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// UPDATE EMPLOYEE (by HR) - update all fields
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, department, designation } = req.body || {};
    const company_id = req.user?.company_id;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    // Verify employee belongs to HR's company
    const [emp] = await db.query(
      "SELECT user_id FROM users WHERE user_id = ? AND company_id = ? AND role = ?",
      [id, company_id, "EMPLOYEE"]
    );

    if (emp.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Employee not in your business unit",
      });
    }

    await db.query(
      "UPDATE users SET name = ?, email = ?, phone = ?, department = ?, designation = ? WHERE user_id = ?",
      [name, email, phone || null, department || null, designation || null, id]
    );

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
    });
  } catch (error) {
    console.error("UPDATE EMPLOYEE ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// CREATE EMPLOYEE (by HR)
export const createEmployee = async (req, res) => {
  try {
    const { name, email, password, phone, department, designation } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [existing] = await db.query(
      "SELECT user_id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    await db.query(
      "INSERT INTO users (name, email, password, role, phone, department, designation, is_first_login, status) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, 'ACTIVE')",
      [name, email, hashedPassword, "EMPLOYEE", phone || null, department || null, designation || null]
    );

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
    });
  } catch (error) {
    console.error("CREATE EMPLOYEE ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// DELETE EMPLOYEE (by HR)
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user?.company_id;

    const [employee] = await db.query(
      "SELECT user_id FROM users WHERE user_id = ? AND company_id = ? AND role = ?",
      [id, company_id, "EMPLOYEE"]
    );

    if (employee.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Employee not in your business unit",
      });
    }

    await db.query("DELETE FROM users WHERE user_id = ?", [id]);

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    console.error("DELETE EMPLOYEE ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ================ LEAVE MANAGEMENT ================

// GET ALL LEAVE REQUESTS
export const getAllLeaveRequests = async (req, res) => {
  try {
    const [leaves] = await db.query(
      `SELECT 
        l.leave_id,
        l.user_id,
        u.name as employee_name,
        u.email as employee_email,
        l.start_date,
        l.end_date,
        l.reason,
        l.status,
        l.created_at
      FROM leaves l
      LEFT JOIN users u ON l.user_id = u.user_id
      ORDER BY l.created_at DESC`
    );

    res.status(200).json({
      success: true,
      message: "Leave requests retrieved successfully",
      data: leaves || [],
      total: (leaves || []).length,
    });
  } catch (error) {
    console.error("GET LEAVE REQUESTS ERROR:", error.message);
    // If leaves table doesn't exist, return empty array
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(200).json({
        success: true,
        message: "No leaves data available",
        data: [],
        total: 0,
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET PENDING LEAVE REQUESTS
export const getPendingLeaveRequests = async (req, res) => {
  try {
    const [leaves] = await db.query(
      `SELECT 
        l.leave_id,
        l.user_id,
        u.name as employee_name,
        u.email as employee_email,
        l.start_date,
        l.end_date,
        l.reason,
        l.status,
        l.created_at
      FROM leaves l
      LEFT JOIN users u ON l.user_id = u.user_id
      WHERE l.status = 'PENDING'
      ORDER BY l.created_at DESC`
    );

    res.status(200).json({
      success: true,
      message: "Pending leave requests retrieved successfully",
      data: leaves || [],
      total: (leaves || []).length,
    });
  } catch (error) {
    console.error("GET PENDING LEAVES ERROR:", error.message);
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(200).json({
        success: true,
        message: "No pending leaves available",
        data: [],
        total: 0,
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// APPROVE LEAVE REQUEST
export const approveLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const [leave] = await db.query(
      "SELECT leave_id FROM leaves WHERE leave_id = ?",
      [id]
    );

    if (leave.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    await db.query(
      "UPDATE leaves SET status = ? WHERE leave_id = ?",
      ["APPROVED", id]
    );

    res.status(200).json({
      success: true,
      message: "Leave request approved successfully",
    });
  } catch (error) {
    console.error("APPROVE LEAVE ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// REJECT LEAVE REQUEST
export const rejectLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const [leave] = await db.query(
      "SELECT leave_id FROM leaves WHERE leave_id = ?",
      [id]
    );

    if (leave.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    await db.query(
      "UPDATE leaves SET status = ? WHERE leave_id = ?",
      ["REJECTED", id]
    );

    res.status(200).json({
      success: true,
      message: "Leave request rejected successfully",
    });
  } catch (error) {
    console.error("REJECT LEAVE ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET EMPLOYEE LEAVES
export const getEmployeeLeaves = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const [leaves] = await db.query(
      `SELECT 
        leave_id,
        user_id,
        start_date,
        end_date,
        reason,
        status,
        created_at
      FROM leaves
      WHERE user_id = ?
      ORDER BY created_at DESC`,
      [employeeId]
    );

    res.status(200).json({
      success: true,
      message: "Employee leaves retrieved successfully",
      data: leaves,
      total: leaves.length,
    });
  } catch (error) {
    console.error("GET EMPLOYEE LEAVES ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ================ HR DASHBOARD STATS ================

// GET HR DASHBOARD STATS
export const getHRDashboardStats = async (req, res) => {
  try {
    // Total Employees
    const [totalEmployees] = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE role = ?",
      ["EMPLOYEE"]
    );

    // Pending Leave Requests (safe fallback)
    let pendingLeaveCount = 0;
    try {
      const [pendingLeaves] = await db.query(
        "SELECT COUNT(*) as count FROM leaves WHERE status = ?",
        ["PENDING"]
      );
      pendingLeaveCount = pendingLeaves[0]?.count || 0;
    } catch (err) {
      console.log("Leaves table not available");
      pendingLeaveCount = 0;
    }

    // Approved Leaves (this month)
    let approvedLeaveCount = 0;
    try {
      const [approvedLeaves] = await db.query(
        "SELECT COUNT(*) as count FROM leaves WHERE status = ? AND MONTH(created_at) = MONTH(NOW())",
        ["APPROVED"]
      );
      approvedLeaveCount = approvedLeaves[0]?.count || 0;
    } catch (err) {
      console.log("Leaves table not available");
      approvedLeaveCount = 0;
    }

    // Leave Status Distribution (safe fallback)
    let leaveDistribution = [];
    try {
      const [distribution] = await db.query(
        "SELECT status, COUNT(*) as count FROM leaves GROUP BY status"
      );
      leaveDistribution = distribution || [];
    } catch (err) {
      console.log("Leaves table not available");
      leaveDistribution = [];
    }

    // Recent Leave Requests (safe fallback)
    let recentLeaves = [];
    try {
      const [recent] = await db.query(
        `SELECT 
          l.leave_id,
          u.name as employee_name,
          l.status,
          l.start_date,
          l.end_date,
          l.created_at
        FROM leaves l
        LEFT JOIN users u ON l.user_id = u.user_id
        ORDER BY l.created_at DESC
        LIMIT 5`
      );
      recentLeaves = recent || [];
    } catch (err) {
      console.log("Leaves table not available");
      recentLeaves = [];
    }

    res.status(200).json({
      success: true,
      message: "HR dashboard stats retrieved successfully",
      data: {
        totalEmployees: totalEmployees[0]?.count || 0,
        pendingLeaves: pendingLeaveCount,
        approvedLeaves: approvedLeaveCount,
        leaveDistribution: leaveDistribution,
        recentLeaves: recentLeaves,
      },
    });
  } catch (error) {
    console.error("GET HR STATS ERROR:", error.message);
    res.status(200).json({
      success: true,
      message: "HR dashboard stats",
      data: {
        totalEmployees: 0,
        pendingLeaves: 0,
        approvedLeaves: 0,
        leaveDistribution: [],
        recentLeaves: [],
      },
    });
  }
};

// ================ REPORTS ================

// GET LEAVE REPORT
export const getLeaveReport = async (req, res) => {
  try {
    const [report] = await db.query(
      `SELECT 
        u.user_id,
        u.name as employee_name,
        COUNT(*) as total_leaves,
        SUM(CASE WHEN l.status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN l.status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN l.status = 'PENDING' THEN 1 ELSE 0 END) as pending
      FROM leaves l
      JOIN users u ON l.user_id = u.user_id
      GROUP BY u.user_id
      ORDER BY u.name`
    );

    res.status(200).json({
      success: true,
      message: "Leave report retrieved successfully",
      data: report,
    });
  } catch (error) {
    console.error("GET LEAVE REPORT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET EMPLOYEE ATTENDANCE REPORT
export const getEmployeeAttendanceReport = async (req, res) => {
  try {
    const [report] = await db.query(
      `SELECT 
        u.name as employee_name,
        u.email,
        COUNT(DISTINCT DATE(u.created_at)) as working_days,
        (SELECT COUNT(*) FROM leaves WHERE user_id = u.user_id AND status = 'APPROVED') as total_leaves
      FROM users u
      WHERE u.role = ?
      GROUP BY u.user_id
      ORDER BY u.name`,
      ["EMPLOYEE"]
    );

    res.status(200).json({
      success: true,
      message: "Attendance report retrieved successfully",
      data: report,
    });
  } catch (error) {
    console.error("GET ATTENDANCE REPORT ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
