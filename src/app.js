const express = require("express");
const cors = require("cors");
const schedulerRoutes = require("./routes/schedulerRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", schedulerRoutes);

app.use((err, req, res, next) => {
  const message = err && err.message ? err.message : "Unexpected error";
  res.status(400).json({
    status: "needs clarification",
    message,
    raw_text: ""
  });
});

module.exports = app;
