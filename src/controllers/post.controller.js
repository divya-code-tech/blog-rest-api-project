const mongoose = require("mongoose");
const postService = require("../services/post.service");

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function validateId(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw httpError(400, "Invalid blog post ID.");
  }
}

async function createPost(req, res, next) {
  try {
    const post = await postService.createPost({
        ...req.body,
        createdBy: req.user.id,
      });

    res.status(201).json({
      success: true,
      message: "Blog post created successfully.",
      data: { post },
    });
  } catch (error) {
    next(error);
  }
}

async function getAllPosts(req, res, next) {
  try {
    const result = await postService.getAllPosts(
      req.validatedQuery
    );

    res.status(200).json({
      success: true,
      data: { posts: result.posts },
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

async function getPostById(req, res, next) {
  try {
    validateId(req.params.id);

    const post = await postService.getPostById(req.params.id);

    if (!post) {
      throw httpError(404, "Blog post not found.");
    }

    res.status(200).json({
      success: true,
      data: { post },
    });
  } catch (error) {
    next(error);
  }
}

async function updatePost(req, res, next) {
  try {
    validateId(req.params.id);

    const post = await postService.updatePost(
      req.params.id,
      req.body,
       req.user.id
    );

    if (!post) {
      throw httpError(404, "Blog post not found.");
    }

    res.status(200).json({
      success: true,
      message: "Blog post updated successfully.",
      data: { post },
    });
  } catch (error) {
    next(error);
  }
}

async function deletePost(req, res, next) {
  try {
    validateId(req.params.id);

   const post = await postService.deletePost(
     req.params.id,
     req.user.id
   );

    if (!post) {
      throw httpError(404, "Blog post not found.");
    }

    res.status(200).json({
      success: true,
      message: "Blog post deleted successfully.",
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
};