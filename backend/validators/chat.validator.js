const { z } = require("zod");
const mongoose = require("mongoose");

/**
 * OBJECT ID VALIDATION
 */
const objectIdSchema = z
  .string()
  .refine((id) => mongoose.Types.ObjectId.isValid(id), {
    message: "Invalid ID",
  });

/**
 * CREATE DIRECT CHAT
 */
const createDirectChatSchema = z.object({
  body: z.object({
    participantId: objectIdSchema,
  }),
});

const searchChatSchema = z.object({
  query: z.object({
    search: z.string().optional(),
  }),
});

/**
 * CREATE GROUP CHAT
 */
const createGroupChatSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: "Group name is required",
      })
      .trim()
      .min(3, "Group name must be at least 3 characters")
      .max(50, "Group name cannot exceed 50 characters"),

    participantIds: z
      .array(objectIdSchema)
      .min(2, "At least two participants are required"),
  }),
});

/**
 * GET CHAT BY ID
 */
const getChatByIdSchema = z.object({
  params: z.object({
    chatId: objectIdSchema,
  }),
});

/**
 * ADD MEMBERS TO GROUP
 */
const addMembersToGroupSchema = z.object({
  params: z.object({
    chatId: objectIdSchema,
  }),

  body: z.object({
    memberIds: z
      .array(objectIdSchema)
      .min(1, "At least one member is required"),
  }),
});

/**
 * REMOVE MEMBERS FROM GROUP
 */
const removeMembersFromGroupSchema = z.object({
  params: z.object({
    chatId: objectIdSchema,
  }),

  body: z.object({
    memberIds: z
      .array(objectIdSchema)
      .min(1, "At least one member is required"),
  }),
});

/**
 * LEAVE GROUP CHAT
 */
const leaveGroupChatSchema = z.object({
  params: z.object({
    chatId: objectIdSchema,
  }),
});

/**
 * UPDATE GROUP CHAT
 */
const updateGroupChatSchema = z.object({
  params: z.object({
    chatId: objectIdSchema,
  }),

  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(3, "Group name must be at least 3 characters")
        .max(50, "Group name cannot exceed 50 characters")
        .optional(),

      groupAvatar: z.string().url("Invalid avatar URL").optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    }),
});

/**
 * ASSIGN ADMIN ROLE
 */
const assignAdminRoleSchema = z.object({
  params: z.object({
    chatId: objectIdSchema,
  }),

  body: z.object({
    memberId: objectIdSchema,
  }),
});

/**
 * REVOKE ADMIN ROLE
 */
const revokeAdminRoleSchema = z.object({
  params: z.object({
    chatId: objectIdSchema,
  }),

  body: z.object({
    memberId: objectIdSchema,
  }),
});

module.exports = {
  createDirectChatSchema,
  createGroupChatSchema,
  addMembersToGroupSchema,
  removeMembersFromGroupSchema,
  updateGroupChatSchema,
  assignAdminRoleSchema,
  revokeAdminRoleSchema,
  getChatByIdSchema,
  leaveGroupChatSchema,
  searchChatSchema
};
