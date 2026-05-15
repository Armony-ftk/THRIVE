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

module.exports = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    trustServerCertificate: true,
  },
};
