import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const seedEmployees = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log("🌱 Seeding employees...");

    // Get all companies
    const [companies] = await connection.query("SELECT company_id, name FROM companies");

    if (companies.length === 0) {
      console.log("⚠️  No companies found. Creating sample companies...");
      
      // Create sample companies
      await connection.query(
        "INSERT INTO companies (name, email, address) VALUES (?, ?, ?)",
        ["Tech Solutions Inc", "tech@company.com", "123 Tech Street"]
      );
      
      await connection.query(
        "INSERT INTO companies (name, email, address) VALUES (?, ?, ?)",
        ["Marketing Pro Ltd", "marketing@company.com", "456 Marketing Ave"]
      );
      
      console.log("✅ Sample companies created");
      
      // Re-fetch companies
      const [newCompanies] = await connection.query("SELECT company_id, name FROM companies");
      companies.splice(0, companies.length, ...newCompanies);
    }

    console.log(`📋 Found ${companies.length} companies:`, companies);

    // Create sample employees for each company
    const employees = [
      { name: "John Smith", email: "john.smith@company.com", department: "Engineering", designation: "Senior Developer", phone: "9876543210" },
      { name: "Sarah Johnson", email: "sarah.johnson@company.com", department: "Engineering", designation: "QA Engineer", phone: "9876543211" },
      { name: "Mike Davis", email: "mike.davis@company.com", department: "Sales", designation: "Sales Executive", phone: "9876543212" },
      { name: "Emma Wilson", email: "emma.wilson@company.com", department: "HR", designation: "HR Specialist", phone: "9876543213" },
      { name: "James Brown", email: "james.brown@company.com", department: "Finance", designation: "Accountant", phone: "9876543214" },
    ];

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      
      // Create 3 employees per company
      for (let j = 0; j < 3; j++) {
        const empIndex = (i * 3 + j) % employees.length;
        const emp = { ...employees[empIndex] };
        emp.email = `${emp.name.toLowerCase().replace(" ", ".")}${i}${j}@${company.name.toLowerCase().replace(" ", "")}.com`;
        
        // Check if employee already exists
        const [existing] = await connection.query(
          "SELECT user_id FROM users WHERE email = ?",
          [emp.email]
        );

        if (existing.length === 0) {
          const hashedPassword = await bcrypt.hash("password123", 10);
          
          await connection.query(
            "INSERT INTO users (name, email, password, phone, department, designation, role, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [emp.name, emp.email, hashedPassword, emp.phone, emp.department, emp.designation, "EMPLOYEE", company.company_id]
          );
          
          console.log(`✅ Created employee: ${emp.name} (${emp.email}) in ${company.name}`);
        }
      }
    }

    console.log("✅ Employee seeding complete");
  } catch (error) {
    console.error("❌ Seeding error:", error.message);
  } finally {
    await connection.end();
  }
};

seedEmployees();
