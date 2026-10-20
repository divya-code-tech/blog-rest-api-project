
const errorHandler = require("../src/middleware/errorHandler");

describe("Error handler middleware", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {};
    res = {
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
  });

  test("handles duplicate-key errors with 409", () => {
    const error = new Error("Duplicate key");
    error.code = 11000;

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        statusCode: 409,
        message: "A record with this value already exists.",
      },
    });
  });

  test("handles Mongoose validation errors with 400", () => {
    const error = new Error("Invalid model data");
    error.name = "ValidationError";

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        statusCode: 400,
        message: "The supplied data is invalid.",
      },
    });
  });

  test("passes errors to next when headers were already sent", () => {
    const error = new Error("Headers already sent");
    res.headersSent = true;

    errorHandler(error, req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test("masks server error messages in production", () => {
    process.env.NODE_ENV = "production";
    const error = new Error("Sensitive internal details");
    error.statusCode = 500;

    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          statusCode: 500,
          message: "Internal server error.",
        },
      });
    } finally {
      consoleError.mockRestore();
    }
  });

  test("includes error details in development", () => {
    process.env.NODE_ENV = "development";
    const error = new Error("Detailed development error");
    error.statusCode = 400;

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        statusCode: 400,
        message: "Detailed development error",
        details: "Detailed development error",
      },
    });
  });
});
