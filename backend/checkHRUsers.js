import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const checkAndAssignHRUsers = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log("🔍 Checking HR users...");

    // Get all HR users
    const [hrUsers] = await connection.query(
      "SELECT user_id, name, email, company_id FROM users WHERE role = 'HR'"
    );

    console.log(`Found ${hrUsers.length} HR users:`, hrUsers);

    // Get all companies
    const [companies] = await connection.query("SELECT company_id, name FROM companies");
    console.log(`Found ${companies.length} companies:`, companies);

    if (companies.length === 0) {
      console.log("⚠️  No companies found");
      return;
    }

    // Check if any HR user has company_id, if not assign them
    for (let i = 0; i < hrUsers.length; i++) {
      const hr = hrUsers[i];
      if (!hr.company_id || hr.company_id === null || hr.company_id === 0) {
        const company = companies[i % companies.length];
        await connection.query(
          "UPDATE users SET company_id = ? WHERE user_id = ?",
          [company.company_id, hr.user_id]
        );
        console.log(`✅ Assigned ${hr.name} (ID: ${hr.user_id}) to ${company.name} (company_id: ${company.company_id})`);
      } else {
        console.log(`ℹ️  ${hr.name} already assigned to company_id: ${hr.company_id}`);
      }
    }

    console.log("✅ HR user assignment complete");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await connection.end();
  }
};

checkAndAssignHRUsers();
