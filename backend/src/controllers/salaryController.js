import db from "../config/db.js";

// GET SALARY SLIP DATA FOR EMPLOYEE
export const getSalarySlipData = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const company_id = req.user?.company_id;
    const role = req.user?.role;
    const user_id = req.user?.user_id;

    // Verify authorization: EMPLOYEE can only view their own, HR/ADMIN can view employees from their BU
    if (role === "EMPLOYEE" && user_id != employeeId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Can only view your own salary slip",
      });
    }

    if ((role === "HR" || role === "COMPANY_ADMIN") && company_id) {
      const [emp] = await db.query(
        "SELECT user_id FROM users WHERE user_id = ? AND company_id = ?",
        [employeeId, company_id]
      );

      if (emp.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: Employee not in your business unit",
        });
      }
    }

    // Fetch employee details
    const [employee] = await db.query(
      "SELECT * FROM users WHERE user_id = ?",
      [employeeId]
    );

    if (employee.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const emp = employee[0];

    // Sample salary slip data (can be extended with leave deductions, etc.)
    const basicSalary = 50000; // Default, can be stored in DB
    const dearness = basicSalary * 0.10; // 10% of basic
    const houseAllowance = basicSalary * 0.20; // 20% of basic
    const otherAllowance = basicSalary * 0.05; // 5% of basic
    const grossSalary = basicSalary + dearness + houseAllowance + otherAllowance;

    // Deductions
    const incomeTax = grossSalary * 0.08; // 8%
    const pf = basicSalary * 0.12; // 12% of basic
    const esi = basicSalary * 0.0325; // 3.25% of basic
    const insurance = 500; // Fixed
    const totalDeductions = incomeTax + pf + esi + insurance;

    const netSalary = grossSalary - totalDeductions;

    res.json({
      success: true,
      data: {
        employee: {
          name: emp.name,
          email: emp.email,
          department: emp.department || "N/A",
          designation: emp.designation || "N/A",
          phone: emp.phone || "N/A",
        },
        salary: {
          basicSalary,
          allowances: {
            dearness,
            houseAllowance,
            otherAllowance,
          },
          grossSalary,
          deductions: {
            incomeTax,
            pf,
            esi,
            insurance,
          },
          totalDeductions,
          netSalary,
        },
        month: new Date().toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
      },
    });
  } catch (error) {
    console.error("Error fetching salary slip:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching salary slip data",
    });
  }
};
