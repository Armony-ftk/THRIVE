// Centralized error handling keeps the app stable and prevents sensitive details from leaking to users.
function errorHandler(err, req, res, next) {
  console.error("Unhandled error:", err.message || err);

  if (res.headersSent) {
    return next(err);
  }

  if (req.originalUrl.startsWith("/api/")) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      error: err.message || "Server error",
    });
  }

  const fallbackPage = req.originalUrl.startsWith("/signup") ? "/signUp.html" : "/login.html";
  return res.status(500).redirect(`${fallbackPage}?error=Server+error`);
}

module.exports = {
  errorHandler,
};
