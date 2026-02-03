import express from "express";
import {
  punchInOut,
  getTodayAttendance,
  getAttendanceHistory,
  getAllAttendance,
  getAttendanceStats,
} from "../controllers/attendanceController.js";
import verifyUser from "../middlewares/verifyUser.js";
import verifyAdmin from "../middlewares/verifyAdmin.js";

const router = express.Router();

// Employee routes
router.post("/punch", verifyUser, punchInOut);
router.get("/today", verifyUser, getTodayAttendance);
router.get("/history", verifyUser, getAttendanceHistory);

// HR routes
router.get("/all", verifyAdmin, getAllAttendance);
router.get("/stats", verifyAdmin, getAttendanceStats);

export default router;
