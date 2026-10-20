
require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./app");
const { connectDatabase } = require("./config/database");

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  await connectDatabase();

  const server = app.listen(PORT, () => {
    console.log(`Blog REST API running at http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });

  let shuttingDown = false;

  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`${signal} received. Shutting down...`);

    server.close(async (error) => {
      try {
        await mongoose.connection.close();

        if (error) {
          console.error("HTTP server shutdown error:", error);
          process.exitCode = 1;
        } else {
          console.log("Server and database connections closed.");
        }
      } catch (closeError) {
        console.error("Shutdown error:", closeError);
        process.exitCode = 1;
      }
    });
  }

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exitCode = 1;
});
