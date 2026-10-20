# Blog REST API

A secure RESTful API for a blogging platform built with **Node.js, Express.js, MongoDB, and JWT authentication**. This project demonstrates backend development concepts, including CRUD operations, authentication, authorization, request validation, pagination, search, automated testing, and API documentation.

## 🚀 Features

- **User Authentication:** Secure registration and login using JWT and password hashing.
- **CRUD Operations:** Create, read, update, and delete blog posts.
- **Authorization:** Restrict post creation to authenticated users and allow only post owners to update or delete their posts.
- **Search:** Search blog posts by title, content, or author.
- **Category Filtering:** Filter posts by category.
- **Pagination:** Retrieve posts in manageable pages with pagination metadata.
- **Sorting:** Sort posts by newest, oldest, title ascending, or title descending.
- **Input Validation:** Validate request data using Zod.
- **Security:** Helmet security headers, configurable CORS, and rate limiting.
- **API Documentation:** Interactive Swagger UI and OpenAPI specification.
- **Automated Testing:** Unit and integration tests using Jest and Supertest.
- **Error Handling:** Centralized error handling and consistent API responses.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | REST API framework |
| MongoDB | NoSQL database |
| Mongoose | Database modeling and queries |
| JWT | Authentication and authorization |
| bcryptjs | Password hashing |
| Zod | Request validation |
| Swagger | API documentation |
| Jest | Automated testing |
| Supertest | HTTP endpoint testing |
| Helmet | Security headers |
| express-rate-limit | Rate limiting |
| Morgan | HTTP request logging |

## 📁 Project Structure

```text
blog-rest-api-project/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── post.controller.js
│   ├── docs/
│   │   └── swagger.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── notFound.js
│   │   └── validate.js
│   ├── models/
│   │   ├── Post.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── health.routes.js
│   │   └── post.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   └── post.service.js
│   ├── utils/
│   ├── validators/
│   │   ├── auth.validator.js
│   │   └── post.validator.js
│   ├── app.js
│   └── server.js
├── tests/
│   ├── auth.test.js
│   ├── authMiddleware.test.js
│   ├── errorHandler.test.js
│   ├── posts.test.js
│   └── postService.test.js
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## ⚙️ Getting Started

### Prerequisites

Install the following before running the project:

- [Node.js](https://nodejs.org/)
- npm
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) or MongoDB Atlas
- [Git](https://git-scm.com/)

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd blog-rest-api-project
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your actual GitHub repository URL.

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root using `.env.example` as a reference.

Configure the following variables with your own values:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/blog_rest_api
MONGODB_TEST_URI=mongodb://127.0.0.1:27017/blog_rest_api_test
JWT_SECRET=replace_with_a_long_random_secret
CORS_ORIGIN=http://localhost:3000
```

**Important:**

- Use a strong, unique JWT secret.
- Update the CORS origin to match your frontend's actual URL, if applicable.
- If you use MongoDB Atlas, replace the local MongoDB connection strings with your own connection strings.
- Never commit your `.env` file, credentials, or database secrets to GitHub.

### 4. Start the Development Server

```bash
npm run dev
```

The API runs at:

`http://localhost:5000`

### 5. Verify the Server

Open the following health endpoint in your browser:

`http://localhost:5000/health`

A successful response indicates that the health endpoint is reachable and reports the service and database status.

## 📚 API Documentation

Interactive API documentation is available through Swagger UI:

`http://localhost:5000/api-docs`

The OpenAPI specification is available at:

`http://localhost:5000/api-docs.json`

Use Swagger UI or an API client such as Postman to explore and test the API endpoints.

## 🔗 API Endpoints

The API supports both root routes and versioned routes under `/api/v1`.

### Authentication

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| POST | `/auth/register` | Register a new user | Not required |
| POST | `/auth/login` | Log in and receive a token | Not required |
| POST | `/api/v1/auth/register` | Versioned registration endpoint | Not required |
| POST | `/api/v1/auth/login` | Versioned login endpoint | Not required |

### Blog Posts

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| GET | `/posts` | Retrieve blog posts | Not required |
| GET | `/posts/:id` | Retrieve a post by ID | Not required |
| POST | `/posts` | Create a blog post | Required |
| PUT | `/posts/:id` | Update a blog post | Required; owner only |
| DELETE | `/posts/:id` | Delete a blog post | Required; owner only |

The same post operations are available under `/api/v1/posts`.

### Health Check

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check service and database health |

### Query Parameters

The `GET /posts` endpoint supports the following parameters:

| Parameter | Description |
|---|---|
| `page` | Page number |
| `limit` | Number of posts per page |
| `search` | Search by title, content, or author |
| `category` | Filter posts by category |
| `sort` | Sort by `newest`, `oldest`, `title_asc`, or `title_desc` |

Example request:

```text
GET /posts?page=1&limit=10&search=technology&category=Technology&sort=newest
```

For the versioned endpoint, use `/api/v1/posts` instead of `/posts`.

### Authentication Header

For protected endpoints, include the JWT received during login in the request header:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

Replace `YOUR_JWT_TOKEN` with a valid token. Only the owner of a post can update or delete it.

## 🧪 Testing

Run the automated test suite:

```bash
npm test
```

Run tests with coverage reporting:

```bash
npm run test:coverage
```

The test suite covers authentication, authorization middleware, post operations, service-layer behavior, and error handling.

**Latest verified local results:**

- Test suites passed: 5
- Tests passed: 39
- Statement coverage: approximately 94.95%

These results reflect the last confirmed test run and may change after further code modifications.

## 🔒 Security

- Passwords are hashed before storage.
- Protected endpoints require JWT authentication.
- Post ownership is checked before updates and deletions.
- Incoming request data is validated.
- Rate limiting helps reduce excessive requests.
- Helmet adds security-related HTTP headers.
- Environment variables are used for sensitive configuration.
- Database credentials and secrets should never be committed to version control.

## 🌐 Deployment

The API can be deployed to a Node.js hosting platform such as [Render](https://render.com/) and connected to a MongoDB Atlas database.

Before deploying:

1. Push the project to GitHub.
2. Configure production environment variables on the hosting platform.
3. Set `NODE_ENV=production`.
4. Configure `MONGODB_URI` with the production database connection string.
5. Set a strong production `JWT_SECRET`.
6. Configure `CORS_ORIGIN` for the frontend's actual origin, if applicable.
7. Deploy the application and verify the health endpoint and Swagger documentation.

Keep production credentials secure, and do not use the development or test database as the production database.

## 👩‍💻 Author

**Divya**

GitHub: [divya-code-tech](https://github.com/divya-code-tech)

Project Repository: [Blog REST API](https://github.com/divya-code-tech/blog-rest-api-project)

---

*Built with Node.js, Express.js, and MongoDB.*

**Thank you for visiting the Blog REST API project!**
