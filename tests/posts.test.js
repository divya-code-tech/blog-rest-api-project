
process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  "automated-test-secret-32-characters-minimum-value";
process.env.JWT_EXPIRES_IN = "1d";
process.env.BCRYPT_SALT_ROUNDS = "10";
process.env.CORS_ORIGIN = "http://localhost:5173";

const request = require("supertest");
const mongoose = require("mongoose");
const os = require("node:os");
const app = require("../src/app");
const User = require("../src/models/User");
const Post = require("../src/models/Post");

const jwt = require("jsonwebtoken");

const TEST_URI =
  process.env.MONGODB_TEST_URI ||
  "mongodb://127.0.0.1:27017/blog_rest_api_test";

async function registerUser(email) {
  const response = await request(app)
    .post("/auth/register")
    .send({
      name: "Automated Test User",
      email,
      password: "TestPassword_2026!",
    })
    .expect(201);

  return {
    token: response.body.data.accessToken,
    user: response.body.data.user,
  };
}

function bearer(token) {
  return { Authorization: `Bearer ${token}` };
}

function postPayload(overrides = {}) {
  return {
    title: "REST API Testing with Supertest",
    content:
      "This automated test verifies blog post CRUD and database behavior.",
    authorName: "Automated Test User",
    category: "Testing",
    ...overrides,
  };
}

beforeAll(async () => {
  await mongoose.connect(TEST_URI, {
    serverSelectionTimeoutMS: 10000,
    runtimeAdapters: { os },
  });
});


beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Post.deleteMany({}),
  ]);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Blog Posts API", () => {
  test("reports a healthy database connection", async () => {
    const response = await request(app)
      .get("/health")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.database).toBe("connected");
  });

  test("rejects post creation without authentication", async () => {
    await request(app)
      .post("/posts")
      .send(postPayload())
      .expect(401);

    expect(await Post.countDocuments()).toBe(0);
  });

  test("rejects missing fields and malformed IDs", async () => {
    const owner = await registerUser("validation@example.com");

    await request(app)
      .post("/posts")
      .set(bearer(owner.token))
      .send({
        content: "A post with no title.",
        authorName: "Test Author",
        category: "Testing",
      })
      .expect(400);

    await request(app)
      .get("/posts/not-a-valid-id")
      .expect(400);

    await request(app)
      .get("/posts/000000000000000000000000")
      .expect(404);
  });

  test("creates, reads, searches, filters, updates and deletes posts", async () => {
    const owner = await registerUser("owner@example.com");

    const createResponse = await request(app)
      .post("/posts")
      .set(bearer(owner.token))
      .send(postPayload())
      .expect(201);

    const postId = createResponse.body.data.post._id;

    expect(createResponse.body.success).toBe(true);
    expect(createResponse.body.data.post.createdBy).toBe(owner.user.id);

    const singleResponse = await request(app)
      .get(`/posts/${postId}`)
      .expect(200);

    expect(singleResponse.body.data.post._id).toBe(postId);

    await request(app)
      .get("/posts?search=Supertest&category=Testing&page=1&limit=10")
      .expect(200)
      .then((response) => {
        expect(response.body.data.posts).toHaveLength(1);
        expect(response.body.pagination.totalItems).toBe(1);
      });

    await request(app)
      .get("/posts?category=Nonexistent")
      .expect(200)
      .then((response) => {
        expect(response.body.data.posts).toHaveLength(0);
      });

    const updateResponse = await request(app)
      .put(`/posts/${postId}`)
      .set(bearer(owner.token))
      .send({ title: "Updated by the Owner" })
      .expect(200);

    expect(updateResponse.body.data.post.title).toBe(
      "Updated by the Owner"
    );

    await request(app)
      .delete(`/posts/${postId}`)
      .set(bearer(owner.token))
      .expect(200);

    await request(app)
      .get(`/posts/${postId}`)
      .expect(404);
  });

  test("prevents another user from updating or deleting a post", async () => {
    const owner = await registerUser("first-owner@example.com");
    const otherUser = await registerUser("second-owner@example.com");

    const created = await request(app)
      .post("/posts")
      .set(bearer(owner.token))
      .send(postPayload())
      .expect(201);

    const postId = created.body.data.post._id;

    await request(app)
      .put(`/posts/${postId}`)
      .set(bearer(otherUser.token))
      .send({ title: "Unauthorized change" })
      .expect(404);

    await request(app)
      .delete(`/posts/${postId}`)
      .set(bearer(otherUser.token))
      .expect(404);

    // Confirm the owner's document remains unchanged.
    const unchanged = await request(app)
      .get(`/posts/${postId}`)
      .expect(200);

    expect(unchanged.body.data.post.title).toBe(
      "REST API Testing with Supertest"
    );
  });

  test("rejects page sizes above the configured maximum", async () => {
    await request(app)
      .get("/posts?page=1&limit=500")
      .expect(400);
  });

  it("returns 404 for an unknown endpoint", async () => {
  const response = await request(app).get(
    "/this-endpoint-does-not-exist"
  );

  expect(response.status).toBe(404);
});


  test("rejects a malformed Authorization header", async () => {
    await request(app)
      .post("/posts")
      .set("Authorization", "Basic invalid-token")
      .send(postPayload())
      .expect(401);
  });

  test("rejects an invalid JWT", async () => {
    await request(app)
      .post("/posts")
      .set(bearer("not-a-valid-jwt"))
      .send(postPayload())
      .expect(401);
  });

  test("rejects a validly signed JWT without a subject", async () => {
    const token = jwt.sign(
      { email: "test@example.com" },
      process.env.JWT_SECRET,
      {
        algorithm: "HS256",
        issuer: "blog-rest-api",
        audience: "blog-rest-api-users",
      }
    );

    await request(app)
      .post("/posts")
      .set(bearer(token))
      .send(postPayload())
      .expect(401);
  });

  test("rejects a token for a nonexistent user", async () => {
    const token = jwt.sign(
      { sub: new mongoose.Types.ObjectId().toString() },
      process.env.JWT_SECRET,
      {
        algorithm: "HS256",
        issuer: "blog-rest-api",
        audience: "blog-rest-api-users",
      }
    );

    await request(app)
      .post("/posts")
      .set(bearer(token))
      .send(postPayload())
      .expect(401);
  });

  test("rejects a token belonging to an inactive user", async () => {
    const account = await registerUser("inactive@example.com");

    await User.findByIdAndUpdate(account.user.id, {
      isActive: false,
    });

    await request(app)
      .post("/posts")
      .set(bearer(account.token))
      .send(postPayload())
      .expect(401);
  });

  
  test("returns 400 for malformed JSON", async () => {
    const response = await request(app)
      .post("/auth/register")
      .set("Content-Type", "application/json")
      .send('{"name": "Test", "email":')
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe(
      "The request body contains invalid JSON."
    );
  });

  
  test("rejects a title that fails request validation", async () => {
    const owner = await registerUser("short-title@example.com");

    const response = await request(app)
      .post("/posts")
      .set(bearer(owner.token))
      .send(
        postPayload({
          title: "AB",
        })
      )
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe(
      "Request validation failed."
    );
  });

  
  test("rejects an unexpected field in a post", async () => {
    const owner = await registerUser("extra-field@example.com");

    const response = await request(app)
      .post("/posts")
      .set(bearer(owner.token))
      .send(
        postPayload({
          unexpectedField: "should not be accepted",
        })
      );

    expect([400, 500]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });


  test("handles Mongoose validation errors during post updates", async () => {
    const owner = await registerUser("mongoose-validation@example.com");

    const created = await request(app)
      .post("/posts")
      .set(bearer(owner.token))
      .send(postPayload())
      .expect(201);

    const postId = created.body.data.post._id;

    const response = await request(app)
      .put(`/posts/${postId}`)
      .set(bearer(owner.token))
      .send({ title: "AB" })
      .expect(400);

    expect(response.body.success).toBe(false);
  });

});