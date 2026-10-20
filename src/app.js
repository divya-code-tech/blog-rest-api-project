const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const postRoutes = require("./routes/post.routes");
const healthRoutes = require("./routes/health.routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/auth.routes");
const app = express();
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
      : false,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: "Too many requests. Please try again later.",
    },
  },
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Blog REST API is running.",
    healthCheck: "/health",
  });
});

app.use("/api/v1", apiLimiter);
app.use("/posts", apiLimiter);

app.use("/posts", postRoutes);
app.use("/api/v1/posts", postRoutes);



app.use("/auth", apiLimiter, authRoutes);
app.use("/api/v1/auth", authRoutes);

app.use("/health", healthRoutes);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: "Blog REST API Documentation",
  })
);

app.get("/api-docs.json", (req, res) => {
  res.json(swaggerSpec);
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;