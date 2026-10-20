
const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Blog REST API",
    version: "1.0.0",
    description:
      "A modular Blog REST API supporting CRUD operations, JWT authentication, validation, pagination, search, filtering, and ownership protection.",
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local development server",
    },
  ],
  tags: [
    { name: "Health", description: "Service health checks" },
    { name: "Posts", description: "Blog post CRUD operations" },
    { name: "Authentication", description: "User registration and login" },
  ],
  paths: {
    "/": {
      get: {
        tags: ["Health"],
        summary: "API welcome endpoint",
        responses: {
          200: { description: "API is running" },
        },
      },
    },
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Check API and database health",
        responses: {
          200: { description: "Service and database are healthy" },
          503: { description: "Database is unavailable" },
        },
      },
    },
    "/posts": {
      get: {
        tags: ["Posts"],
        summary: "List, search, and filter blog posts",
        description:
          "Supports pagination and sorting. Search checks the title, content, and author name. The /api/v1/posts alias is also available.",
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
          },
          {
            name: "search",
            in: "query",
            schema: { type: "string", maxLength: 100 },
          },
          {
            name: "category",
            in: "query",
            schema: { type: "string", maxLength: 60 },
          },
          {
            name: "sort",
            in: "query",
            schema: {
              type: "string",
              enum: ["newest", "oldest", "title_asc", "title_desc"],
              default: "newest",
            },
          },
        ],
        responses: {
          200: {
            description: "Posts returned successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PostListResponse" },
              },
            },
          },
          400: { description: "Invalid query parameters" },
        },
      },
      post: {
        tags: ["Posts"],
        summary: "Create a blog post",
        description:
          "Requires a JWT Bearer token. The authenticated user becomes the post owner.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PostInput" },
              example: {
                title: "Getting Started with REST APIs",
                content:
                  "REST APIs allow applications to exchange data through HTTP methods and JSON responses.",
                authorName: "Divya",
                category: "Technology",
              },
            },
          },
        },
        responses: {
          201: { description: "Post created successfully" },
          400: { description: "Validation failed" },
          401: { description: "Authentication required" },
        },
      },
    },
    "/posts/{id}": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "MongoDB ObjectId",
          schema: {
            type: "string",
            pattern: "^[a-fA-F0-9]{24}$",
          },
        },
      ],
      get: {
        tags: ["Posts"],
        summary: "Get a single blog post",
        responses: {
          200: { description: "Post returned successfully" },
          400: { description: "Invalid post ID" },
          404: { description: "Post not found" },
        },
      },
      put: {
        tags: ["Posts"],
        summary: "Update a blog post",
        description: "Requires authentication and ownership of the post.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PostUpdateInput" },
              example: {
                title: "Updated REST API Guide",
                category: "Web Development",
              },
            },
          },
        },
        responses: {
          200: { description: "Post updated successfully" },
          400: { description: "Invalid ID or request body" },
          401: { description: "Authentication required" },
          404: { description: "Post not found or not owned by the user" },
        },
      },
      delete: {
        tags: ["Posts"],
        summary: "Delete a blog post",
        description: "Requires authentication and ownership of the post.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Post deleted successfully" },
          400: { description: "Invalid post ID" },
          401: { description: "Authentication required" },
          404: { description: "Post not found or not owned by the user" },
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterInput" },
              example: {
                name: "Demo User",
                email: "demo@example.com",
                password: "ExamplePass_2026!",
              },
            },
          },
        },
        responses: {
          201: { description: "Account created and access token issued" },
          400: { description: "Invalid registration data" },
          409: { description: "Email already registered" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Log in",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginInput" },
            },
          },
        },
        responses: {
          200: { description: "Login successful and access token issued" },
          401: { description: "Invalid credentials" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Register or log in to obtain an access token.",
      },
    },
    schemas: {
      PostInput: {
        type: "object",
        additionalProperties: false,
        required: ["title", "content", "authorName", "category"],
        properties: {
          title: { type: "string", minLength: 3, maxLength: 160 },
          content: { type: "string", minLength: 10, maxLength: 20000 },
          authorName: { type: "string", minLength: 2, maxLength: 80 },
          category: { type: "string", minLength: 2, maxLength: 60 },
        },
      },
      PostUpdateInput: {
        type: "object",
        additionalProperties: false,
        minProperties: 1,
        properties: {
          title: { type: "string", minLength: 3, maxLength: 160 },
          content: { type: "string", minLength: 10, maxLength: 20000 },
          authorName: { type: "string", minLength: 2, maxLength: 80 },
          category: { type: "string", minLength: 2, maxLength: 60 },
        },
      },
      Post: {
        type: "object",
        properties: {
          _id: { type: "string", example: "507f1f77bcf86cd799439011" },
          title: { type: "string" },
          content: { type: "string" },
          authorName: { type: "string" },
          category: { type: "string" },
          createdBy: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      PostListResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              posts: {
                type: "array",
                items: { $ref: "#/components/schemas/Post" },
              },
            },
          },
          pagination: {
            type: "object",
            properties: {
              page: { type: "integer" },
              limit: { type: "integer" },
              totalItems: { type: "integer" },
              totalPages: { type: "integer" },
              hasNextPage: { type: "boolean" },
              hasPreviousPage: { type: "boolean" },
            },
          },
        },
      },
      RegisterInput: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 80 },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8, maxLength: 128 },
        },
      },
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 1, maxLength: 128 },
        },
      },
    },
  },
};

module.exports = swaggerSpec;
