import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  resetUserPassword,
  createUserInvite,
  getDashboardStats,
  getAllCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  getUserReport,
  getMonthlyHiringTrend,
  getEmployeesByDepartment,
} from "../controllers/adminController.js";
import verifyUser from "../middlewares/verifyUser.js";
import verifyAdmin from "../middlewares/verifyAdmin.js";

const router = express.Router();

// All routes require admin authentication
router.use(verifyUser, verifyAdmin);

// ================ USER MANAGEMENT ================
router.get("/users", getAllUsers);
router.post("/users", createUserInvite);
router.get("/users/:id", getUserById);
router.put("/users/:id", updateUser);
router.put("/users/:id/reset-password", resetUserPassword);
router.delete("/users/:id", deleteUser);

// ================ DASHBOARD STATS ================
router.get("/stats/dashboard", getDashboardStats);
router.get("/stats/monthly-hiring", getMonthlyHiringTrend);
router.get("/stats/employees-by-department", getEmployeesByDepartment);

// ================ COMPANY MANAGEMENT ================
router.get("/companies", getAllCompanies);
router.post("/companies", createCompany);
router.put("/companies/:id", updateCompany);
router.delete("/companies/:id", deleteCompany);

// ================ REPORTS ================
router.get("/reports/users", getUserReport);

export default router;
