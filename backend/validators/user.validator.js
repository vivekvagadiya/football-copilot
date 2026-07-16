// backend/validators/user.validator.js
const { z } = require("zod");

const updateUserSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  status: z.string().optional(),
});

module.exports = {
  updateUserSchema,
};