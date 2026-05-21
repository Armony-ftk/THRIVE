// Simple sleep utility returning a promise that resolves after `ms` milliseconds.
module.exports = function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
};
