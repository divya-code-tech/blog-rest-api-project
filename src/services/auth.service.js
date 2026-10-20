const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function createError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET must be configured with at least 32 characters."
    );
  }

  return secret;
}

function createAccessToken(user) {
  return jwt.sign(
    {},
    getJwtSecret(),
    {
      subject: user._id.toString(),
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      issuer: "blog-rest-api",
      audience: "blog-rest-api-users",
    }
  );
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

async function register({ name, email, password }) {
  const existingUser = await User.findOne({ email }).lean();

  if (existingUser) {
    throw createError(
      409,
      "An account with this email already exists."
    );
  }

  const saltRounds = Number.parseInt(
    process.env.BCRYPT_SALT_ROUNDS || "12",
    10
  );

  if (!Number.isInteger(saltRounds) || saltRounds < 10 || saltRounds > 14) {
    throw new Error("BCRYPT_SALT_ROUNDS must be between 10 and 14.");
  }

  const passwordHash = await bcrypt.hash(password, saltRounds);

  let user;

  try {
    user = await User.create({
      name,
      email,
      passwordHash,
    });
  } catch (error) {
    // Also handle simultaneous registrations with the same email.
    if (error.code === 11000) {
      throw createError(
        409,
        "An account with this email already exists."
      );
    }

    throw error;
  }

  return {
    user: publicUser(user),
    accessToken: createAccessToken(user),
  };
}

async function login({ email, password }) {
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw createError(401, "Invalid email or password.");
  }

  if (!user.isActive) {
    throw createError(403, "This account is inactive.");
  }

  return {
    user: publicUser(user),
    accessToken: createAccessToken(user),
  };
}

module.exports = {
  register,
  login,
};