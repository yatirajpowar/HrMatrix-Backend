import express from "express";
import {
  getEmployeeProfile,
  updateEmployeeProfile,
  getEmployeeLeaves,
  applyForLeave,
  getEmployeeDashboard,
  getEmployeeEvents,
  getEmployeeSalarySlip,
} from "../controllers/employeeController.js";
import verifyUser from "../middlewares/verifyUser.js";

// Middleware to verify Employee role
const verifyEmployee = (req, res, next) => {
  if (req.user.role !== "EMPLOYEE") {
    return res.status(403).json({
      success: false,
      message: "Employee access required",
    });
  }
  next();
};

const router = express.Router();

// All routes require authentication and Employee role
router.use(verifyUser, verifyEmployee);

// ================ EMPLOYEE SELF-SERVICE ================
router.get("/profile", getEmployeeProfile);
router.put("/profile", updateEmployeeProfile);
router.get("/leaves", getEmployeeLeaves);
router.post("/leaves", applyForLeave);
router.get("/dashboard", getEmployeeDashboard);
router.get("/events", getEmployeeEvents);
router.get("/salary", getEmployeeSalarySlip);

export default router;
