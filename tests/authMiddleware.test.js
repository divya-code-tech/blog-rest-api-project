
jest.mock("jsonwebtoken");
jest.mock("../src/models/User");

const jwt = require("jsonwebtoken");
const User = require("../src/models/User");
const { requireAuth } = require("../src/middleware/auth");

describe("Authentication middleware error handling", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET =
      "test-secret-that-is-at-least-32-characters-long";

    req = {
      get: jest.fn().mockReturnValue("Bearer test-token"),
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  test("passes an error to next when JWT_SECRET is too short", () => {
    process.env.JWT_SECRET = "short";

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "JWT_SECRET is not configured correctly.",
      })
    );
    expect(jwt.verify).not.toHaveBeenCalled();
  });

  test("passes unexpected JWT verification errors to next", () => {
    const error = new Error("Unexpected verification failure");
    jwt.verify.mockImplementation(() => {
      throw error;
    });

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("passes database lookup failures to next", async () => {
    const error = new Error("Database lookup failed");

    jwt.verify.mockReturnValue({
      sub: "507f1f77bcf86cd799439011",
    });

    const query = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockRejectedValue(error),
    };

    User.findById.mockReturnValue(query);

    requireAuth(req, res, next);

    // Wait for the database promise rejection to reach catch(next).
    await new Promise((resolve) => setImmediate(resolve));

    expect(User.findById).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011"
    );
    expect(next).toHaveBeenCalledWith(error);
  });
});
