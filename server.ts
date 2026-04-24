import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const CHAT_FILE = path.join(process.cwd(), 'chat_history.ini');

  app.get("/api/load-chat", (req, res) => {
    try {
      if (fs.existsSync(CHAT_FILE)) {
        const content = fs.readFileSync(CHAT_FILE, 'utf-8');
        res.send(content);
      } else {
        res.send("");
      }
    } catch (error) {
      console.error("Error loading chat:", error);
      res.status(500).send("Error loading chat");
    }
  });

  app.post("/api/save-chat", (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).send("Invalid messages");
      }

      let content = "";
      if (fs.existsSync(CHAT_FILE)) {
        content = fs.readFileSync(CHAT_FILE, 'utf-8');
      }

      messages.forEach((m: any) => {
        content += `[${new Date().toISOString()}] ${m.role.toUpperCase()}: ${m.content}\n\n`;
      });

      fs.writeFileSync(CHAT_FILE, content);
      res.json({ status: "ok" });
    } catch (error) {
      console.error("Error saving chat:", error);
      res.status(500).send("Error saving chat");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
