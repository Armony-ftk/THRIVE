const geminiService = require("../services/geminiService");

// Controller: keep thin — call the service and return JSON.
exports.generateTest = async (req, res, next) => {
  try {
    const text = await geminiService.generateTestResponse();
    // Return a simple JSON payload – frontend can adapt as needed later.
    return res.json({ success: true, data: text });
  } catch (error) {
    // Delegate error handling to centralized error middleware
    return next(error);
  }
};
