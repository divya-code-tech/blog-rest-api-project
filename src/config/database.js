const mongoose = require("mongoose");

async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing from the environment.");
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });

  console.log(
    `MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`
  );
}

module.exports = { connectDatabase };