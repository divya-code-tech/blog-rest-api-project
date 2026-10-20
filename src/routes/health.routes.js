const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

router.get("/", (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;

  res.status(isConnected ? 200 : 503).json({
    success: isConnected,
    data: {
      service: "Blog REST API",
      status: isConnected ? "ok" : "degraded",
      database: isConnected ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    },
  });
});

module.exports = router;