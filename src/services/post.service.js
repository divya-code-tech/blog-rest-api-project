const Post = require("../models/Post");

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function createPost(data) {
  return Post.create(data);
}

async function getAllPosts({ page, limit, search, category, sort }) {
  const filter = {};

  if (search) {
    const safeSearch = new RegExp(escapeRegex(search), "i");

    filter.$or = [
      { title: safeSearch },
      { content: safeSearch },
      { authorName: safeSearch },
    ];
  }

  if (category) {
    filter.category = new RegExp(
      `^${escapeRegex(category)}$`,
      "i"
    );
  }

  const sortOptions = {
    newest: { createdAt: -1, _id: -1 },
    oldest: { createdAt: 1, _id: 1 },
    title_asc: { title: 1 },
    title_desc: { title: -1 },
  };

  const [posts, totalItems] = await Promise.all([
    Post.find(filter)
      .sort(sortOptions[sort])
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Post.countDocuments(filter),
  ]);

  return {
    posts,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      hasNextPage: page * limit < totalItems,
      hasPreviousPage: page > 1,
    },
  };
}

async function getPostById(id) {
  return Post.findById(id).lean();
}

async function updatePost(id, data, userId) {
  return Post.findOneAndUpdate(
    { _id: id, createdBy: userId },
    data,
    {
      returnDocument: "after",
      runValidators: true,
      context: "query",
    }
  );
}

async function deletePost(id, userId) {
  return Post.findOneAndDelete({
    _id: id,
    createdBy: userId,
  });
}

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
};