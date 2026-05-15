require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const authRoutes = require("./routes/authRoutes");
const configurePassport = require("./config/passportConfig");
const { errorHandler } = require("./middleware/errorMiddleware");
const { poolPromise } = require("./database/connection");

const requiredEnv = [
  "PORT",
  "SESSION_SECRET",
  "DB_USER",
  "DB_PASSWORD",
  "DB_SERVER",
  "DB_NAME",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
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
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  }),
);
app.use(passport.initialize());
app.use(passport.session());

// Mount route modules for auth-related endpoints.
app.use("/", authRoutes);

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

startServer();
