const requiredEnv = [
  "DB_USER",
  "DB_PASSWORD",
  "DB_SERVER",
  "DB_NAME",
];

const missingEnv = requiredEnv.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(", ")}`);
}

const isAzure = (process.env.DB_SERVER || "").includes("database.windows.net");

module.exports = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  connectionTimeout: 60000,
  requestTimeout: 60000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    trustServerCertificate: !isAzure,
    encrypt: isAzure,
  },
};
