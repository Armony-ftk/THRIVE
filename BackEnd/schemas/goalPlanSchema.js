const { z } = require("zod");

const taskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  offset_days: z.number().int().positive("offset_days must be a positive integer"),
});

const goalPlanSchema = z.object({
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(80, "Title must be 80 characters or fewer"),
  category: z.string(),
  duration: z.number().int().positive("Duration must be a positive integer"),
  duration_unit: z.enum(["days", "weeks", "months"]),
  tasks: z.array(taskSchema).min(3, "At least 3 tasks are required"),
});

module.exports = {
  goalPlanSchema,
};
