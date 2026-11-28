
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Frontend files serve pannurathu
app.use(express.json({ limit: "1mb" }));

app.use(express.static(
  path.join(__dirname, "../frontend")
));

// Home page
app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/index.html")
  );
});

// AI Chat API
app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body.message;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Please enter a message."
      });
    }

    if (
      !process.env.AI_API_KEY ||
      !process.env.AI_API_URL ||
      !process.env.AI_MODEL
    ) {
      return res.status(503).json({
        error: "AI API is not configured yet."
      });
    }

    const aiResponse = await fetch(
      process.env.AI_API_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization":
            `Bearer ${process.env.AI_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL,
          messages: [
            {
              role: "system",
              content:
                "You are SAARA AI, a helpful AI assistant."
            },
            {
              role: "user",
              content: message
            }
          ]
        })
      }
    );

    if (!aiResponse.ok) {
      console.error(
        "AI provider error:",
        aiResponse.status
      );

      return res.status(502).json({
        error: "AI provider returned an error."
      });
    }

    const data = await aiResponse.json();

    const reply =
      data.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(502).json({
        error: "No answer was returned."
      });
    }

    res.json({ reply });

  } catch (error) {
    console.error("Chat error:", error.message);

    res.status(500).json({
      error: "Unable to process your request."
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(
    `SAARA AI running at http://localhost:${PORT}`
  );
});
