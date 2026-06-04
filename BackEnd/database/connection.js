const sql = require("mssql");
const dbConfig = require("../config/dbConfig");

let poolPromise;

// Lazy pool with retry — handles Azure SQL Serverless cold starts.
async function getPool() {
  if (poolPromise) return poolPromise;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const pool = await new sql.ConnectionPool(dbConfig).connect();
      console.log("✔️ MSSQL connection pool created");
      pool.on("error", err => console.error("MSSQL pool error", err));
      poolPromise = Promise.resolve(pool);
      return poolPromise;
    } catch (err) {
      console.error(`DB connection attempt ${attempt} failed:`, err.message);
      if (attempt === 3) throw err;
      await new Promise(r => setTimeout(r, 3000 * attempt));
    }
  }
}

// Export a promise-compatible interface so existing code works unchanged.
module.exports = {
  sql,
  get poolPromise() { return getPool(); },
};
