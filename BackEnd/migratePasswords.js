const sql = require("mssql");   // or your DB client
const bcrypt = require("bcrypt"); // or bcryptjs if you installed that

async function migratePasswords() {
  try {
    // Connect to your DB
    await sql.connect({
      user: "thrive_user",
      password: "StrongPass123!",
      server: "localhost\\SQLEXPRESS",
      database: "ThriveDb",
      options: { encrypt: true, trustServerCertificate: true }
    });

    // Fetch all users
    const result = await sql.query`SELECT id, password FROM Users`;

    for (const user of result.recordset) {
      const currentPassword = user.password;

      // Skip if already hashed (bcrypt hashes start with $2b$ or $2a$)
      if (currentPassword.startsWith("$2b$") || currentPassword.startsWith("$2a$")) {
        console.log(`User ${user.id} already hashed, skipping.`);
        continue;
      }

      // Hash the plain text password
      const hashedPassword = await bcrypt.hash(currentPassword, 10);

      // Update DB with hashed password
      await sql.query`
        UPDATE Users SET password = ${hashedPassword} WHERE id = ${user.id}
      `;

      console.log(`User ${user.id} password migrated.`);
    }

    console.log("Migration complete.");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

migratePasswords();
