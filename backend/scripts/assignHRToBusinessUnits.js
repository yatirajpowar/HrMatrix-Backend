import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const assignHRToBusinessUnits = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log("🔍 Checking HR users without company_id...");
    
    // Get HR users without company_id
    const [hrUsers] = await connection.query(
      "SELECT user_id, name, email FROM users WHERE role = 'HR' AND (company_id IS NULL OR company_id = 0)"
    );

    if (hrUsers.length === 0) {
      console.log("✅ All HR users have company_id assigned");
      return;
    }

    console.log(`Found ${hrUsers.length} HR users without company_id:`, hrUsers);

    // Get all companies
    const [companies] = await connection.query("SELECT company_id, name FROM companies");
    
    if (companies.length === 0) {
      console.log("⚠️  No companies found. Please create companies first.");
      return;
    }

    console.log(`📋 Available companies:`, companies);

    // Assign first HR user to first company, second to second, etc
    for (let i = 0; i < hrUsers.length; i++) {
      const hrUser = hrUsers[i];
      const company = companies[i % companies.length]; // Cycle through companies
      
      await connection.query(
        "UPDATE users SET company_id = ? WHERE user_id = ?",
        [company.company_id, hrUser.user_id]
      );
      
      console.log(`✅ Assigned ${hrUser.name} (ID: ${hrUser.user_id}) to ${company.name} (company_id: ${company.company_id})`);
    }

    console.log("✅ HR users assigned to business units successfully");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await connection.end();
  }
};

assignHRToBusinessUnits();
