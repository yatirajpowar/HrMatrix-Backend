import express from "express";
import {
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  createEmployee,
  deleteEmployee,
  getAllLeaveRequests,
  getPendingLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  getEmployeeLeaves,
  getHRDashboardStats,
  getLeaveReport,
  getEmployeeAttendanceReport,
} from "../controllers/hrController.js";
import {
  getAllEvents,
  createEvent,
  deleteEvent,
} from "../controllers/eventController.js";
import {
  getSalarySlipData,
} from "../controllers/salaryController.js";
import {
  getEmployeesByDepartment,
} from "../controllers/adminController.js";
import verifyUser from "../middlewares/verifyUser.js";

// Middleware to verify HR role
const verifyHR = (req, res, next) => {
  if (req.user.role !== "HR") {
    return res.status(403).json({
      success: false,
      message: "HR access required",
    });
  }
  next();
};

const router = express.Router();

// All routes require authentication and HR role
router.use(verifyUser, verifyHR);

// ================ EMPLOYEE MANAGEMENT ================
router.get("/employees", getAllEmployees);
router.post("/employees", createEmployee);
router.get("/employees/:id", getEmployeeById);
router.put("/employees/:id", updateEmployee);
router.delete("/employees/:id", deleteEmployee);

// ================ LEAVE MANAGEMENT ================
router.get("/leaves", getAllLeaveRequests);
router.put("/leaves/:id/approve", approveLeaveRequest);
router.put("/leaves/:id/reject", rejectLeaveRequest);
router.get("/leaves/pending", getPendingLeaveRequests);
router.get("/leaves/employee/:employeeId", getEmployeeLeaves);

// ================ EVENTS ================
router.get("/events", getAllEvents);
router.post("/events", createEvent);
router.delete("/events/:id", deleteEvent);

// ================ SALARY SLIP ================
router.get("/salary-slip/:employeeId", getSalarySlipData);

// ================ DASHBOARD STATS ================
router.get("/stats/dashboard", getHRDashboardStats);
router.get("/stats/employees-by-department", getEmployeesByDepartment);

// ================ REPORTS ================
router.get("/reports/leaves", getLeaveReport);
router.get("/reports/attendance", getEmployeeAttendanceReport);

export default router;

