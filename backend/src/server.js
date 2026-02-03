// server.js
import dotenv from "dotenv";
dotenv.config(); // <-- MUST run first

import app from "./app.js";
import db from "./config/db.js"; // now db will see env variables

db.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:", err.message);
  } else {
    console.log("Database connected successfully");
    connection.release();
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
