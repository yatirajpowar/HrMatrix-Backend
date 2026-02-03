// src/models/User.js
import db from "../config/db.js";
import bcrypt from "bcrypt";

const createUser = async ({ name, email, password, role = "employee" }) => {
  try {
    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // insert user into MySQL
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role]
    );

    return result;
  } catch (error) {
    throw error;
  }
};


export default {
  createUser
};
