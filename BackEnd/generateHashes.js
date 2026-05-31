const bcrypt = require("bcrypt");

async function run() {
  const adminPassword = "AdminPass123@";       // your chosen admin password
  const superAdminPassword = "SuperAdmin456@"; // your chosen super admin password

  const adminHash = await bcrypt.hash(adminPassword, 10);
  const superAdminHash = await bcrypt.hash(superAdminPassword, 10);

  console.log("Admin hash:", adminHash);
  console.log("Super Admin hash:", superAdminHash);
}

run();