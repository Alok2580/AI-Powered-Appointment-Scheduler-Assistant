const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-flash-latest";

const buildNeedsClarification = (rawText) => ({
  status: "needs clarification",
  message: "Ambiguous date/time or department",
  raw_text: rawText || ""
});

const getKolkataISOString = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });

  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+05:30`;
};

const buildSystemPrompt = (nowIso) => [
  "You are an appointment scheduler.",
  `Today's date and time in Asia/Kolkata is ${nowIso}.`,
  "Analyze the user input (text or image OCR).",
  "Extract raw text, then extract entities date_phrase, time_phrase, department.",
  "Normalize date to YYYY-MM-DD and time to HH:MM using Asia/Kolkata timezone.",
  "Normalize department to a clean title-case value (example: dentist -> Dentistry).",
  "If the input is ambiguous or missing critical info, return status 'needs clarification'",
  "with message 'Ambiguous date/time or department'.",
  "Return JSON only and match exactly one of the schemas:",
  "Success schema: {\"appointment\":{\"department\":\"Dentistry\",\"date\":\"YYYY-MM-DD\",\"time\":\"HH:MM\",\"tz\":\"Asia/Kolkata\",\"status\":\"ok\"},\"metadata\":{\"raw_text\":\"...\",\"confidence\":0.0}}",
  "Needs clarification schema: {\"status\":\"needs clarification\",\"message\":\"Ambiguous date/time or department\",\"raw_text\":\"...\"}",
  "Do not include any extra keys, markdown, or commentary."
].join(" ");

const cleanJsonText = (text) => {
  if (!text) return "";
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
};

const parseModelJson = (text, rawTextFallback) => {
  const cleaned = cleanJsonText(text);
  if (!cleaned) return buildNeedsClarification(rawTextFallback);
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    return buildNeedsClarification(rawTextFallback);
  }
};

const processInput = async ({ text, imagePath, mimeType }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const nowIso = getKolkataISOString();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: buildSystemPrompt(nowIso)
  });

  const parts = [];
  if (text) {
    parts.push({ text: `Input text: ${text}` });
  }

  if (imagePath) {
    const imageData = fs.readFileSync(imagePath, { encoding: "base64" });
    parts.push({ text: "Input image contains the appointment request." });
    parts.push({
      inlineData: {
        data: imageData,
        mimeType: mimeType || "image/png"
      }
    });
  }

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0.2,
      topP: 0.95,
      maxOutputTokens: 1024,
      responseMimeType: "application/json"
    }
  });

  const responseText = result.response.text();
  const rawTextFallback = text || "";
  return parseModelJson(responseText, rawTextFallback);
};

module.exports = {
  processInput
};
