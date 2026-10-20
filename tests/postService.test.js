
jest.mock("../src/models/Post");

const Post = require("../src/models/Post");
const postService = require("../src/services/post.service");

function createQuery(result) {
  const query = {
    sort: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
    lean: jest.fn().mockResolvedValue(result),
  };

  query.sort.mockReturnValue(query);
  query.skip.mockReturnValue(query);
  query.limit.mockReturnValue(query);

  return query;
}

describe("Post service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("creates a post", async () => {
    const data = { title: "Testing", content: "Test content" };
    const savedPost = { _id: "post-1", ...data };

    Post.create.mockResolvedValue(savedPost);

    await expect(postService.createPost(data)).resolves.toEqual(savedPost);
    expect(Post.create).toHaveBeenCalledWith(data);
  });

  test("searches, filters, sorts, and paginates posts", async () => {
    const posts = [{ _id: "post-1", title: "Testing APIs" }];
    const query = createQuery(posts);

    Post.find.mockReturnValue(query);
    Post.countDocuments.mockResolvedValue(25);

    const result = await postService.getAllPosts({
      page: 2,
      limit: 10,
      search: "a+b",
      category: "Technology",
      sort: "title_asc",
    });

    const filter = Post.find.mock.calls[0][0];

    expect(filter.$or).toHaveLength(3);
    expect(filter.$or[0].title).toBeInstanceOf(RegExp);
    expect(filter.$or[0].title.source).toBe("a\\+b");
    expect(filter.category).toBeInstanceOf(RegExp);
    expect(filter.category.test("technology")).toBe(true);

    expect(query.sort).toHaveBeenCalledWith({ title: 1 });
    expect(query.skip).toHaveBeenCalledWith(10);
    expect(query.limit).toHaveBeenCalledWith(10);
    expect(query.lean).toHaveBeenCalled();

    expect(result.posts).toEqual(posts);
    expect(result.pagination).toEqual({
      page: 2,
      limit: 10,
      totalItems: 25,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  test("returns correct pagination for an empty result", async () => {
    const query = createQuery([]);

    Post.find.mockReturnValue(query);
    Post.countDocuments.mockResolvedValue(0);

    const result = await postService.getAllPosts({
      page: 1,
      limit: 10,
      sort: "newest",
    });

    expect(result.posts).toEqual([]);
    expect(result.pagination).toEqual({
      page: 1,
      limit: 10,
      totalItems: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    expect(Post.find).toHaveBeenCalledWith({});
    expect(query.sort).toHaveBeenCalledWith({
      createdAt: -1,
      _id: -1,
    });
  });

  test.each([
    ["newest", { createdAt: -1, _id: -1 }],
    ["oldest", { createdAt: 1, _id: 1 }],
    ["title_asc", { title: 1 }],
    ["title_desc", { title: -1 }],
  ])("supports the %s sort option", async (sort, expectedSort) => {
    const query = createQuery([]);
    Post.find.mockReturnValue(query);
    Post.countDocuments.mockResolvedValue(0);

    await postService.getAllPosts({
      page: 1,
      limit: 10,
      sort,
    });

    expect(query.sort).toHaveBeenCalledWith(expectedSort);
  });

  test("gets a post by ID", async () => {
    const post = { _id: "post-1", title: "Testing" };
    const query = { lean: jest.fn().mockResolvedValue(post) };

    Post.findById.mockReturnValue(query);

    await expect(postService.getPostById("post-1")).resolves.toEqual(post);
    expect(Post.findById).toHaveBeenCalledWith("post-1");
    expect(query.lean).toHaveBeenCalled();
  });

  test("updates a post with validators enabled", async () => {
    const updatedPost = { _id: "post-1", title: "Updated title" };
    Post.findOneAndUpdate.mockResolvedValue(updatedPost);

    const result = await postService.updatePost(
      "post-1",
      { title: "Updated title" },
      "user-1"
    );

    expect(result).toEqual(updatedPost);
    expect(Post.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: "post-1", createdBy: "user-1" },
      { title: "Updated title" },
      {
        returnDocument: "after",
        runValidators: true,
        context: "query",
      }
    );
  });

  test("deletes a post only for the specified owner", async () => {
    const deletedPost = { _id: "post-1" };
    Post.findOneAndDelete.mockResolvedValue(deletedPost);

    await expect(
      postService.deletePost("post-1", "user-1")
    ).resolves.toEqual(deletedPost);

    expect(Post.findOneAndDelete).toHaveBeenCalledWith({
      _id: "post-1",
      createdBy: "user-1",
    });
  });
});