require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const authRoutes = require("./routes/authRoutes");
const aiRoutes = require("./routes/aiRoutes");
const goalRoutes = require("./routes/goalRoutes");
const taskRoutes = require("./routes/taskRoutes");
const progressRoutes = require("./routes/progressRoutes");
const profileRoutes = require("./routes/profileRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const adminRoutes = require("./routes/adminRoutes");
const configurePassport = require("./config/passportConfig");
const { errorHandler } = require("./middleware/errorMiddleware");
const { poolPromise } = require("./database/connection");

const requiredEnv = [
  "SESSION_SECRET",
  "DB_USER",
  "DB_PASSWORD",
  "DB_SERVER",
  "DB_NAME",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_API_KEY",
];

const missingEnv = requiredEnv.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
  console.error("Missing required environment variables:", missingEnv.join(", "));
  process.exit(1);
}

const PORT = process.env.PORT;
const SESSION_SECRET = process.env.SESSION_SECRET;

const app = express();

configurePassport(passport);

// Middleware setup
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  }
  ),
);
app.use(passport.initialize());
app.use(passport.session());

// Mount route modules for auth-related endpoints.
app.use("/", authRoutes);

// Mount API route modules
app.use("/api/goals", goalRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api", profileRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);

// Global error handler keeps failures consistent.
app.use(errorHandler);

async function startServer() {
  try {
    await poolPromise; // Ensure the shared DB pool is online before listening.
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  // Local development: start the HTTP server directly.
  startServer();
} else {
  // Serverless (Vercel): initialize DB pool and export the app.
  poolPromise.catch(err => console.error("DB pool initialization failed:", err));
  module.exports = app;
}