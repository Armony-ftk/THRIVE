// Centralized helper to create errors with HTTP status codes and readable messages.
function createApiError(status, message) {
  const err = new Error(message || "AI service error");
  err.status = status || 500;
  return err;
}

module.exports = { createApiError };
