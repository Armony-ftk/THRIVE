const sql = require("mssql");
const dbConfig = require("../config/dbConfig");

// The shared MSSQL connection pool is created once at application startup.
// This avoids opening and closing a new connection for every request.
const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then(pool => {
    console.log("✔️ MSSQL connection pool created");
    pool.on("error", err => {
      console.error("MSSQL pool error", err);
    });
    return pool;
  })
  .catch(err => {
    console.error("Failed to create MSSQL pool", err);
    throw err;
  });

module.exports = {
  sql,
  poolPromise,
};
