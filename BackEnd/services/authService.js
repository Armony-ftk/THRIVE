const { sql, poolPromise } = require("../database/connection");
const { hashPassword, comparePassword } = require("../utils/passwordUtils");

// Services contain all business logic and direct database access.
// Controllers call services, and services stay independent from Express-specific APIs.

async function getUserByUsername(username) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("username", sql.VarChar(255), username)
    .query("SELECT * FROM Users WHERE name = @username");

  return result.recordset[0] || null;
}

async function getUserByEmail(email) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("email", sql.VarChar(255), email)
    .query("SELECT * FROM Users WHERE email = @email");

  return result.recordset[0] || null;
}

async function getUserById(id) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("id", sql.Int, id)
    .query("SELECT * FROM Users WHERE id = @id");

  return result.recordset[0] || null;
}

async function createLocalUser({ username, email, password }) {
  const existingUsername = await getUserByUsername(username);
  if (existingUsername) {
    const err = new Error("Username already exists");
    err.code = "USERNAME_TAKEN";
    throw err;
  }

  const existingEmail = await getUserByEmail(email);
  if (existingEmail) {
    const err = new Error("Email already exists");
    err.code = "EMAIL_TAKEN";
    throw err;
  }

  const passwordHash = await hashPassword(password);
  const pool = await poolPromise;

  const result = await pool
    .request()
    .input("username", sql.VarChar(255), username)
    .input("email", sql.VarChar(255), email)
    .input("password", sql.VarChar(255), passwordHash)
    .input("role", sql.VarChar(50), "user") // force role = user
    .query(
      "INSERT INTO Users (name, email, password, role) OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role VALUES (@username, @email, @password, @role)"
    );

  return result.recordset[0];
}


async function validateLocalLogin(username, password, role) {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("username", sql.VarChar(255), username)
    .input("role", sql.VarChar(50), role)
    .query("SELECT * FROM Users WHERE name = @username AND role = @role");

  const user = result.recordset[0];

  if (!user) {
    return { success: false, reason: "user_not_found_or_wrong_role" };
  }

  if (user.account_status === "suspended") {
    return { success: false, reason: "account_suspended" };
  }

  if (user.password == null) {
    return { success: false, reason: "google_login_required" };
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    return { success: false, reason: "invalid_password" };
  }

  return { success: true, user };
}


async function findOrCreateGoogleUser({ name, email }) {
  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return { created: false, user: existingUser };
  }

  const pool = await poolPromise;
  const result = await pool
    .request()
    .input("name", sql.VarChar(255), name)
    .input("email", sql.VarChar(255), email)
    .input("role", sql.VarChar(50), "user")
    .input("password", sql.VarChar(255), null)
    .query(
      "INSERT INTO Users (name, email, role, password) OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role, INSERTED.password VALUES (@name, @email, @role, @password)",
    );

  return { created: true, user: result.recordset[0] };
}

module.exports = {
  createLocalUser,
  validateLocalLogin,
  findOrCreateGoogleUser,
  getUserByUsername,
  getUserByEmail,
  getUserById,
};
