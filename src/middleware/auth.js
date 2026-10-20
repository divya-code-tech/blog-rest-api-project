
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function requireAuth(req, res, next) {
  const authorization = req.get("Authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: {
        statusCode: 401,
        message: "Authentication required. Provide a Bearer token.",
      },
    });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        statusCode: 401,
        message: "Access token is missing.",
      },
    });
  }

  let payload;

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
      throw new Error("JWT_SECRET is not configured correctly.");
    }

    payload = jwt.verify(token, secret, {
      algorithms: ["HS256"],
      issuer: "blog-rest-api",
      audience: "blog-rest-api-users",
    });
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        error: {
          statusCode: 401,
          message: "Invalid or expired access token.",
        },
      });
    }

    return next(error);
  }

  if (!payload.sub) {
    return res.status(401).json({
      success: false,
      error: {
        statusCode: 401,
        message: "Invalid access token.",
      },
    });
  }

  User.findById(payload.sub)
    .select("_id name email isActive")
    .lean()
    .then((user) => {
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: {
            statusCode: 401,
            message: "User account is unavailable.",
          },
        });
      }

      req.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      };

      next();
    })
    .catch(next);
}

module.exports = { requireAuth };
