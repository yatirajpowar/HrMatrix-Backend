import express from "express";
import { login, register, registerHR, registerAdmin, changePassword, getCompaniesForRegistration } from "../controllers/authController.js";
import verifyUser from "../middlewares/verifyUser.js";
import verifyAdmin from "../middlewares/verifyAdmin.js";

const router = express.Router();

// REGISTER (Public - Employee registration)
router.post("/register", register);

// GET COMPANIES FOR REGISTRATION (Public)
router.get("/companies", getCompaniesForRegistration);

// LOGIN
router.post("/login", login);

// TOKEN VERIFY (protected route)
router.get("/verify", verifyUser, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

// REGISTER HR (Admin only)
router.post("/register-hr", verifyUser, verifyAdmin, registerHR);

// REGISTER ADMIN (Admin only)
router.post("/register-admin", verifyUser, verifyAdmin, registerAdmin);

// CHANGE PASSWORD (JWT protected - on first login)
router.post("/change-password", verifyUser, changePassword);

export default router;
