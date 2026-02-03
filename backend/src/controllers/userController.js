import db from "../config/db.js";
import bcrypt from "bcrypt";

// REGISTER USER (ADMIN)
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role || "employee"]
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    console.error("CREATE USER ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
