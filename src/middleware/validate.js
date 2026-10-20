function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || source,
        message: issue.message,
      }));

      return res.status(400).json({
        success: false,
        error: {
          statusCode: 400,
          message: "Request validation failed.",
          details,
        },
      });
    }

    if (source === "query") {
      req.validatedQuery = result.data;
    } else {
      req[source] = result.data;
    }

    next();
  };
}

module.exports = validate;