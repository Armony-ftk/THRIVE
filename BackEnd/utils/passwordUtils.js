const bcrypt = require("bcrypt");

// Password utilities are isolated so password-related logic is easy to test.
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function comparePassword(plainText, hashedPassword) {
  return bcrypt.compare(plainText, hashedPassword);
}

module.exports = {
  hashPassword,
  comparePassword,
};
