
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

const TEST_URI =
  process.env.MONGODB_TEST_URI ||
  "mongodb://127.0.0.1:27017/blog_rest_api_test";

const credentials = {
  name: "Automated Test User",
  email: "auth-test@example.com",
  password: "TestPassword_2026!",
};

beforeAll(async () => {
  await mongoose.connect(TEST_URI, {
    serverSelectionTimeoutMS: 10000,
    runtimeAdapters: { os },
  });
});

beforeEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Authentication API", () => {
  test("registers a user and returns an access token", async () => {
    const response = await request(app)
      .post("/auth/register")
      .send(credentials)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeTruthy();
    expect(response.body.data.user.email).toBe(credentials.email);
    expect(response.body.data.user.passwordHash).toBeUndefined();
    expect(response.body.data.user.password).toBeUndefined();

    const savedUser = await User.findOne({
      email: credentials.email,
    }).select("+passwordHash");

    expect(savedUser).toBeTruthy();
    expect(savedUser.passwordHash).not.toBe(credentials.password);
  });

  test("rejects duplicate email registration", async () => {
    await request(app).post("/auth/register").send(credentials).expect(201);

    const response = await request(app)
      .post("/auth/register")
      .send(credentials)
      .expect(409);

    expect(response.body.success).toBe(false);
  });

  test("allows login with correct credentials", async () => {
    await request(app).post("/auth/register").send(credentials).expect(201);

    const response = await request(app)
      .post("/auth/login")
      .send({
        email: credentials.email,
        password: credentials.password,
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeTruthy();
  });

  test("rejects an incorrect password", async () => {
    await request(app).post("/auth/register").send(credentials).expect(201);

    const response = await request(app)
      .post("/auth/login")
      .send({
        email: credentials.email,
        password: "DefinitelyWrongPassword!",
      })
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  test("rejects invalid registration data", async () => {
    const response = await request(app)
      .post("/auth/register")
      .send({
        name: "A",
        email: "not-an-email",
        password: "short",
      })
      .expect(400);

    expect(response.body.success).toBe(false);
  });
});