const express = require("express");

const postController = require("../controllers/post.controller");
const validate = require("../middleware/validate");

const {
  createPostSchema,
  updatePostSchema,
  listPostsQuerySchema,
} = require("../validators/post.validator");

const { requireAuth } = require("../middleware/auth");

const router = express.Router();


router
  .route("/")
  .post(
    requireAuth,
    validate(createPostSchema),
    postController.createPost
  )
  .get(
    validate(listPostsQuerySchema, "query"),
    postController.getAllPosts
  );

router
  .route("/:id")
  .get(postController.getPostById)
  .put(
    requireAuth,
    validate(updatePostSchema),
    postController.updatePost
  )
  .delete(
    requireAuth,
    postController.deletePost
  );
  module.exports = router;
