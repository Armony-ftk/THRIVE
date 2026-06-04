const sql = require("mssql");
const dbConfig = require("../config/dbConfig");

// Lazy pool with retry — handles Azure SQL Serverless cold starts.
// poolPromise is assigned synchronously before the first await so concurrent
// callers all reuse the same in-flight promise instead of each opening a pool.
async function createPool() {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const pool = await new sql.ConnectionPool(dbConfig).connect();
      console.log("✔️ MSSQL connection pool created");
      pool.on("error", err => console.error("MSSQL pool error", err));
      return pool;
    } catch (err) {
      console.error(`DB connection attempt ${attempt} failed:`, err.message);
      if (attempt === 5) throw err;
      await new Promise(r => setTimeout(r, 5000 * attempt));
    }
  }
}

// Assigned once — all concurrent requires share this single promise.
const poolPromise = createPool();

module.exports = {
  sql,
  poolPromise,
};
