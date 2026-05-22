const geminiService = require("./geminiService");
const { extractJson } = require("../utils/extractJson");
const { goalPlanSchema } = require("../schemas/goalPlanSchema");
const { createApiError } = require("../utils/apiErrorHandler");

const promptTemplate = `
"You are an AI goal-planning engine for a Personal Decision Support System called Thrive.
Your task is to analyze a user's natural language goal and convert it into STRICT structured JSON.

PRIMARY OBJECTIVE
Analyze the user's goal and generate:
1. A clean goal title
2. A goal category
3. Estimated duration
4. Duration unit
5. A logical sequence of actionable tasks
You MUST return ONLY valid raw JSON.

CRITICAL OUTPUT RULES
YOU MUST FOLLOW ALL RULES EXACTLY.
1. RETURN JSON ONLY
* Do NOT include explanations
* Do NOT include markdown
* Do NOT include comments
* Do NOT include notes
* Do NOT include headings
* Do NOT include conversational text
* Do NOT include "Here is the JSON"
* Do NOT output anything before or after the JSON
2. OUTPUT MUST BE VALID JSON
* Must be parsable with JSON.parse()
* Use double quotes only
* No trailing commas
* No undefined values
* No functions
* No comments
* No special formatting
3. NEVER OMIT REQUIRED FIELDS
All required fields must ALWAYS exist even if estimation is needed.
4. IF INFORMATION IS MISSING
You MUST intelligently estimate:
* category
* duration
* duration_unit
* tasks
based on the user's goal.
5. NEVER RETURN NULL
Use reasonable estimations instead.

REQUIRED JSON SCHEMA
{
"title": "string",
"category": "string",
"duration": number,
"duration_unit": "days | weeks | months",
"tasks": [
{
"title": "string",
"offset_days": number
}
]
}

FIELD RULES
"title"
* Must be concise
* Must summarize the user's goal clearly
* Maximum 80 characters
"category"
Must be ONE of:
* education
* fitness
* career
* finance
* productivity
* health
* business
* personal_development
* relationships
* spirituality
* technology
* other
"duration"
* Must be a positive integer
* Cannot be 0
* Cannot be negative
"duration_unit"
Must ONLY be:
* "days"
* "weeks"
* "months"

TASK RULES
1. tasks MUST be an array of JSON objects
2. tasks array MUST contain at least 3 tasks
3. tasks MUST be ordered logically
4. tasks MUST be actionable
5. tasks MUST NOT be vague
6. tasks MUST NOT repeat
7. tasks MUST progressively move toward the goal
8. each task title must be concise
9. each task MUST include:
* title
* offset_days

OFFSET DAYS RULES
"offset_days"
* MUST be a positive integer
* MUST represent the estimated number of days AFTER the current system date
* MUST progressively increase across tasks
* MUST NOT repeat across tasks
* MUST logically match the task progression
* MUST remain realistic for the type of goal
* MUST NOT exceed the estimated total duration
* MUST NOT be negative
* MUST NOT be 0
Example:
[
{
"title": "Learn Python basics",
"offset_days": 7
},
{
"title": "Practice functions",
"offset_days": 21
}
]

CONSISTENCY RULES
* Goal duration must logically match the user's goal
* Tasks must align with the user's actual goal
* Do NOT generate unrelated tasks
* Do NOT hallucinate impossible timelines
* Keep outputs realistic and achievable
* Task progression must logically evolve from beginner to advanced where applicable
* offset_days values must logically align with task difficulty and progression

EDGE CASE HANDLING
IF the user input is:
* too short
* ambiguous
* unrealistic
* messy
* contains spelling mistakes
* contains slang
* contains multiple sentences
THEN:
* infer the MOST likely intended goal
* still return valid JSON
* still follow the exact schema

MULTI-GOAL INPUT RULE
If the user provides multiple goals in one sentence:
Example:
"I want to learn Python and lose weight"
THEN:
* choose the PRIMARY goal only
* prioritize the FIRST major actionable goal mentioned

FORBIDDEN OUTPUTS
NEVER:
* explain your reasoning
* apologize
* ask questions
* add markdown
* add extra keys
* add nested structures outside schema
* output arrays outside root object
* output invalid JSON
* return partial JSON
* include fields not defined in the schema
* include "deadline"
* include "status"
* include "position"

FINAL INSTRUCTION:
Return ONLY the JSON object.
No markdown.
No explanation.
No extra text. " Here is a text i need to pass as one variable inside my js file. When I just past it i the file, it's showing me red lines and errors. How can I ensure it fits in one string for one variable.`;

function createPlannerPrompt(goalText) {
  return `${promptTemplate}\n\nUser goal: "${goalText}"`;
}

async function createGoalPlan(userInput) {
  if (!userInput || typeof userInput !== "string") {
    throw createApiError(400, "Goal input must be a non-empty string.");
  }

  const prompt = createPlannerPrompt(userInput);
  const rawResponse = await geminiService.generateContent(prompt);
  const extracted = extractJson(rawResponse);

  const validation = goalPlanSchema.safeParse(extracted);
  if (!validation.success) {
    const issues = validation.error.issues
      .map(issue => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw createApiError(500, `AI response failed validation: ${issues}`);
  }

  return validation.data;
}

module.exports = {
  createGoalPlan,
};
