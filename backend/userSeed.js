// Import the createUser function
import UserModel from "./src/models/User.js";
import dotenv from "dotenv";

dotenv.config();

const userRegister = async () => {
  try {
    const result = await UserModel.createUser({
      name: "Admin",
      email: "admin@gmail.com",
      password: "admin",
      role: "SUPER_ADMIN",
    });

    console.log("Admin user created successfully, ID:", result.insertId);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      console.log("Admin user already exists");
    } else {
      console.log("Error creating admin user:", error.message);
    }
  } finally {
    process.exit();
  }
};

userRegister();
