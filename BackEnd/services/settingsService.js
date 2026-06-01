const sql = require("mssql");
const bcrypt = require("bcrypt");
const config = require("../config/dbConfig")

async function changePassword(userId, currentPassword, newPassword){
  await sql.connect(config);
  const result = await sql.query`SELECT password FROM Users WHERE id = ${userId}`;

  if (result.recordset.length === 0) throw new Error("User not found");

  const match = await bcrypt.compare(currentPassword, result.recordset[0].password);
  if (!match) throw new Error("Current password incorrect");

  const hashed = await bcrypt.hash(newPassword, 10);
  await sql.query`UPDATE Users SET password = ${hashed} WHERE id = ${userId}`;
};

async function deleteAccount(userId){
  await sql.connect(config);
  await sql.query`DELETE FROM Users WHERE id = ${userId}`;
};

module.exports = {
    changePassword,
    deleteAccount,   
}