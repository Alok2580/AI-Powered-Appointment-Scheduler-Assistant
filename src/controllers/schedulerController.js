const fs = require("fs/promises");
const aiService = require("../services/aiService");

const buildNeedsClarification = (message, rawText) => ({
  status: "needs clarification",
  message,
  raw_text: rawText || ""
});

const handleSchedule = async (req, res) => {
  const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
  const imagePath = req.file ? req.file.path : null;
  const mimeType = req.file ? req.file.mimetype : null;

  if (!text && !imagePath) {
    return res.status(400).json(buildNeedsClarification("No input provided", ""));
  }

  try {
    const result = await aiService.processInput({ text, imagePath, mimeType });
    return res.json(result);
  } catch (error) {
    return res.status(500).json(buildNeedsClarification("Internal error processing request", text));
  } finally {
    if (imagePath) {
      fs.unlink(imagePath).catch(() => undefined);
    }
  }
};

module.exports = {
  handleSchedule
};
