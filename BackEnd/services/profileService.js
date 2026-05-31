const sql = require("mssql");
const config = require("../config/dbConfig");

async function getUserById(userId) {
  await sql.connect(config);
  const result = await sql.query`SELECT id, name, email FROM Users WHERE id = ${userId}`;
  return result.recordset[0];
}

async function updateUser(userId, name, email) {
  await sql.connect(config);
  await sql.query`UPDATE Users SET name = ${name}, email = ${email} WHERE id = ${userId}`;
}

module.exports = { getUserById, updateUser };
