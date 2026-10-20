const { z } = require("zod");

const postFields = {
  title: z.string().trim().min(3).max(160),
  content: z.string().trim().min(10).max(20000),
  authorName: z.string().trim().min(2).max(80),
  category: z.string().trim().min(2).max(60),
};

const createPostSchema = z.object(postFields).strict();

const updatePostSchema = z
  .object(postFields)
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update.",
  });

const listPostsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().max(100).optional(),
    category: z.string().trim().min(1).max(60).optional(),
    sort: z
      .enum(["newest", "oldest", "title_asc", "title_desc"])
      .default("newest"),
  })
  .strict();

module.exports = {
  createPostSchema,
  updatePostSchema,
  listPostsQuerySchema,
};