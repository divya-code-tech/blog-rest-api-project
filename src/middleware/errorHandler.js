function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal server error.";

  if (err.code === 11000) {
    statusCode = 409;
    message = "A record with this value already exists.";
  } else if (
    err.name === "ValidationError" ||
    err.name === "CastError"
  ) {
    statusCode = 400;
    message = "The supplied data is invalid.";
  } else if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    Object.prototype.hasOwnProperty.call(err, "body")
  ) {
    statusCode = 400;
    message = "The request body contains invalid JSON.";
  }

  if (statusCode >= 500) {
    console.error(err);
  }

  const response = {
    success: false,
    error: {
      statusCode,
      message:
        statusCode >= 500 && process.env.NODE_ENV === "production"
          ? "Internal server error."
          : message,
    },
  };

  if (process.env.NODE_ENV === "development") {
    response.error.details = err.message;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;