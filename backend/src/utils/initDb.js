import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const initializeDatabase = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log("🔄 Running database migrations...");

    // Add phone column to users table if it doesn't exist
    try {
      await connection.query(`ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL AFTER password`);
      console.log("✅ Phone column added");
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME") {
        console.log("ℹ️  Phone column already exists");
      } else {
        console.log("ℹ️  Phone column check skipped");
      }
    }

    // Add department column to users table if it doesn't exist
    try {
      await connection.query(`ALTER TABLE users ADD COLUMN department VARCHAR(100) NULL`);
      console.log("✅ Department column added");
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME") {
        console.log("ℹ️  Department column already exists");
      } else {
        console.log("ℹ️  Department column check skipped");
      }
    }

    // Add designation column to users table if it doesn't exist
    try {
      await connection.query(`ALTER TABLE users ADD COLUMN designation VARCHAR(100) NULL`);
      console.log("✅ Designation column added");
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME") {
        console.log("ℹ️  Designation column already exists");
      } else {
        console.log("ℹ️  Designation column check skipped");
      }
    }

    // Create events table if it doesn't exist
    const createEventsTable = `
      CREATE TABLE IF NOT EXISTS events (
        event_id INT PRIMARY KEY AUTO_INCREMENT,
        company_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        event_date DATETIME NOT NULL,
        location VARCHAR(200),
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(company_id),
        FOREIGN KEY (created_by) REFERENCES users(user_id)
      );
    `;

    await connection.query(createEventsTable);
    console.log("✅ Events table created/verified");

    // Create attendance table if it doesn't exist
    const createAttendanceTable = `
      CREATE TABLE IF NOT EXISTS attendance (
        attendance_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        punch_in DATETIME NULL,
        punch_out DATETIME NULL,
        attendance_date DATE NOT NULL,
        status ENUM('PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE') DEFAULT 'ABSENT',
        notes VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_date (user_id, attendance_date)
      );
    `;

    await connection.query(createAttendanceTable);
    console.log("✅ Attendance table created/verified");

    console.log("✅ Database initialization complete");
  } catch (error) {
    console.error("❌ Database initialization error:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
};

export default initializeDatabase;
