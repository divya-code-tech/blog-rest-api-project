const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required."],
      trim: true,
      minlength: [3, "Title must contain at least 3 characters."],
      maxlength: [160, "Title cannot exceed 160 characters."],
    },
    content: {
      type: String,
      required: [true, "Content is required."],
      trim: true,
      minlength: [10, "Content must contain at least 10 characters."],
      maxlength: [20000, "Content cannot exceed 20000 characters."],
    },
    authorName: {
      type: String,
      required: [true, "Author name is required."],
      trim: true,
      minlength: [2, "Author name must contain at least 2 characters."],
      maxlength: [80, "Author name cannot exceed 80 characters."],
    },
    category: {
      type: String,
      required: [true, "Category is required."],
      trim: true,
      minlength: [2, "Category must contain at least 2 characters."],
      maxlength: [60, "Category cannot exceed 60 characters."],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
      index: true,
  },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw",
  }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model("Post", postSchema, "posts");