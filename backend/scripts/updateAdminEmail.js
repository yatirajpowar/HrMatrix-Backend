import db from "../src/config/db.js";

const run = async () => {
  try {
    const oldEmail = 'admin2@example.com';
    const newEmail = 'admin2@gmail.com';
    const [result] = await db.query('UPDATE users SET email = ? WHERE email = ?', [newEmail, oldEmail]);
    console.log(`Updated rows: ${result.affectedRows}`);
    process.exit(0);
  } catch (err) {
    console.error('Error updating admin email:', err.message || err);
    process.exit(1);
  }
};

run();
