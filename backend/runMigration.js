import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const runMigration = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log("🔄 Running migration to add user fields...");

    // Add columns one by one to handle existing databases
    try {
      await connection.query(`ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL AFTER password`);
      console.log("✅ Added phone column");
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME") {
        console.log("⚠️  Phone column already exists");
      } else {
        throw err;
      }
    }

    try {
      await connection.query(`ALTER TABLE users ADD COLUMN department VARCHAR(100) NULL`);
      console.log("✅ Added department column");
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME") {
        console.log("⚠️  Department column already exists");
      } else {
        throw err;
      }
    }

    try {
      await connection.query(`ALTER TABLE users ADD COLUMN designation VARCHAR(100) NULL`);
      console.log("✅ Added designation column");
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME") {
        console.log("⚠️  Designation column already exists");
      } else {
        throw err;
      }
    }

    console.log("✅ Migration complete");
  } catch (error) {
    console.error("❌ Migration error:", error.message);
  } finally {
    await connection.end();
  }
};

runMigration();
