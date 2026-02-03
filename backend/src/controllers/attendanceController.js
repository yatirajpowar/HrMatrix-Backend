import db from "../config/db.js";

// Punch in/out for employee
export const punchInOut = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const today = new Date().toISOString().split("T")[0];

    // Check if attendance record exists for today
    const [existing] = await db.query(
      "SELECT * FROM attendance WHERE user_id = ? AND attendance_date = ?",
      [userId, today]
    );

    if (existing.length === 0) {
      // Create punch in record
      await db.query(
        "INSERT INTO attendance (user_id, punch_in, attendance_date, status) VALUES (?, NOW(), ?, 'PRESENT')",
        [userId, today]
      );
      const [record] = await db.query(
        "SELECT * FROM attendance WHERE user_id = ? AND attendance_date = ?",
        [userId, today]
      );
      return res.json({
        success: true,
        message: "Punch in successful",
        data: record[0]
      });
    } else if (!existing[0].punch_out) {
      // Update with punch out
      await db.query(
        "UPDATE attendance SET punch_out = NOW() WHERE user_id = ? AND attendance_date = ?",
        [userId, today]
      );
      const [record] = await db.query(
        "SELECT * FROM attendance WHERE user_id = ? AND attendance_date = ?",
        [userId, today]
      );
      return res.json({
        success: true,
        message: "Punch out successful",
        data: record[0]
      });
    } else {
      return res.json({
        success: true,
        message: "Already punched out",
        data: existing[0]
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in punch operation",
      error: error.message
    });
  }
};

// Get today's attendance
export const getTodayAttendance = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const today = new Date().toISOString().split("T")[0];

    const [records] = await db.query(
      "SELECT * FROM attendance WHERE user_id = ? AND attendance_date = ?",
      [userId, today]
    );

    res.json({
      success: true,
      data: records.length > 0 ? records[0] : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching attendance",
      error: error.message
    });
  }
};

// Get attendance history for employee
export const getAttendanceHistory = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { month, year } = req.query;

    let query = "SELECT * FROM attendance WHERE user_id = ?";
    let params = [userId];

    if (month && year) {
      query += " AND MONTH(attendance_date) = ? AND YEAR(attendance_date) = ?";
      params.push(parseInt(month), parseInt(year));
    }

    query += " ORDER BY attendance_date DESC";

    const [records] = await db.query(query, params);

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching attendance history",
      error: error.message
    });
  }
};

// HR: Get all employee attendance
export const getAllAttendance = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { userId, month, year } = req.query;

    let query = `
      SELECT a.*, u.name, u.email 
      FROM attendance a 
      JOIN users u ON a.user_id = u.user_id 
      WHERE u.company_id = ?
    `;
    let params = [companyId];

    if (userId) {
      query += " AND a.user_id = ?";
      params.push(userId);
    }

    if (month && year) {
      query += " AND MONTH(a.attendance_date) = ? AND YEAR(a.attendance_date) = ?";
      params.push(parseInt(month), parseInt(year));
    }

    query += " ORDER BY a.attendance_date DESC";

    const [records] = await db.query(query, params);

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching attendance",
      error: error.message
    });
  }
};

// HR: Get attendance stats for employee
export const getAttendanceStats = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    // Get all employees in company with their attendance stats
    const query = `
      SELECT 
        u.user_id, u.name, 
        COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status = 'ABSENT' THEN 1 END) as absent_days,
        COUNT(CASE WHEN a.status = 'HALF_DAY' THEN 1 END) as half_days,
        COUNT(CASE WHEN a.status = 'ON_LEAVE' THEN 1 END) as leave_days
      FROM users u
      LEFT JOIN attendance a ON u.user_id = a.user_id
      WHERE u.company_id = ? AND u.role = 'EMPLOYEE'
      GROUP BY u.user_id, u.name
      ORDER BY u.name
    `;

    const [stats] = await db.query(query, [companyId]);

    res.json({
      success: true,
      data: stats || []
    });
  } catch (error) {
    console.error("Attendance stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching attendance stats",
      error: error.message
    });
  }
};
