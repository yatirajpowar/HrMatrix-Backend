// // src/app.js
// import express from "express";
// import cors from "cors";
// import authRouter from './routes/auth.js'; // always include .js in ES modules
// // import db from './config/db.js'
// import userRouter from "./routes/user.js";


// const app = express();


// // Middleware
// app.use(cors());
// app.use(express.json());



// // Routes
// app.use('/api/auth', authRouter);
// app.use("/api/users", userRouter);



// // ✅ Export using ES module default export
// export default app;
import express from "express";
import cors from "cors";
import authRouter from './routes/auth.js';
import adminRouter from "./routes/admin.js";
import hrRouter from "./routes/hr.js";
import employeeRouter from "./routes/employee.js";
import attendanceRouter from "./routes/attendance.js";
import initializeDatabase from "./utils/initDb.js";

const app = express();

// Initialize database
initializeDatabase().catch(err => console.error("DB init error:", err));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/hr", hrRouter);
app.use("/api/employee", employeeRouter);
app.use("/api/attendance", attendanceRouter);

export default app;

