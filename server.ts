import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import crypto from "crypto";

dotenv.config();

// Ensure data directory exists for durable JSON databases
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, "users.json");
const USER_DATA_FILE = path.join(DATA_DIR, "user_data.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");

interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

interface UserDataRecord {
  wheels: any[];
  results: any[];
  updatedAt: string;
}

// Database Helpers
function loadUsers(): Record<string, UserRecord> {
  if (!fs.existsSync(USERS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  } catch (err) {
    return {};
  }
}

function saveUsers(users: Record<string, UserRecord>) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

function loadAllUserData(): Record<string, UserDataRecord> {
  if (!fs.existsSync(USER_DATA_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(USER_DATA_FILE, "utf-8"));
  } catch (err) {
    return {};
  }
}

function saveAllUserData(data: Record<string, UserDataRecord>) {
  fs.writeFileSync(USER_DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function loadSessions(): Record<string, { userId: string; email: string; expiresAt: string }> {
  if (!fs.existsSync(SESSIONS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf-8"));
  } catch (err) {
    return {};
  }
}

function saveSessions(sessions: Record<string, { userId: string; email: string; expiresAt: string }>) {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), "utf-8");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AUTH ENDPOINTS
  app.post("/api/auth/signup", (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const sanitizedEmail = email.trim().toLowerCase();
      if (!sanitizedEmail.includes("@") || password.length < 6) {
        return res.status(400).json({ error: "Invalid email format or password (min 6 characters)" });
      }

      const users = loadUsers();
      const exists = Object.values(users).some(u => u.email === sanitizedEmail);
      if (exists) {
        return res.status(409).json({ error: "An account with this email already exists" });
      }

      const id = crypto.randomBytes(16).toString("hex");
      const salt = crypto.randomBytes(16).toString("hex");
      const passwordHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");

      users[id] = {
        id,
        email: sanitizedEmail,
        passwordHash,
        salt,
        createdAt: new Date().toISOString(),
      };
      saveUsers(users);

      const token = crypto.randomBytes(32).toString("hex");
      const sessions = loadSessions();
      sessions[token] = {
        userId: id,
        email: sanitizedEmail,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      saveSessions(sessions);

      res.status(201).json({ id, email: sanitizedEmail, token });
    } catch (err) {
      console.error("Signup error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const sanitizedEmail = email.trim().toLowerCase();
      const users = loadUsers();
      const user = Object.values(users).find(u => u.email === sanitizedEmail);

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const checkHash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, "sha512").toString("hex");
      if (checkHash !== user.passwordHash) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const token = crypto.randomBytes(32).toString("hex");
      const sessions = loadSessions();
      sessions[token] = {
        userId: user.id,
        email: sanitizedEmail,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      saveSessions(sessions);

      res.json({ id: user.id, email: sanitizedEmail, token });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.split(" ")[1];
      const sessions = loadSessions();
      const session = sessions[token];

      if (!session || new Date(session.expiresAt) < new Date()) {
        return res.status(401).json({ error: "Session expired or invalid" });
      }

      res.json({ id: session.userId, email: session.email, token });
    } catch (err) {
      res.status(500).json({ error: "Auth check failed" });
    }
  });

  // DATA SYNC ENDPOINTS
  app.get("/api/user/data", (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.split(" ")[1];
      const sessions = loadSessions();
      const session = sessions[token];

      if (!session || new Date(session.expiresAt) < new Date()) {
        return res.status(401).json({ error: "Session expired" });
      }

      const allData = loadAllUserData();
      const userData = allData[session.userId] || { wheels: [], results: [], updatedAt: new Date().toISOString() };
      res.json(userData);
    } catch (err) {
      res.status(500).json({ error: "Failed to load cloud data" });
    }
  });

  app.post("/api/user/data", (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.split(" ")[1];
      const sessions = loadSessions();
      const session = sessions[token];

      if (!session || new Date(session.expiresAt) < new Date()) {
        return res.status(401).json({ error: "Session expired" });
      }

      const { wheels, results } = req.body;
      if (!Array.isArray(wheels) || !Array.isArray(results)) {
        return res.status(400).json({ error: "Invalid data format" });
      }

      const allData = loadAllUserData();
      allData[session.userId] = {
        wheels,
        results,
        updatedAt: new Date().toISOString(),
      };
      saveAllUserData(allData);

      res.json({ success: true, updatedAt: allData[session.userId].updatedAt });
    } catch (err) {
      res.status(500).json({ error: "Failed to save cloud data" });
    }
  });

  // Lazy initialize GoogleGenAI client to prevent startup crash if GEMINI_API_KEY is not defined
  function getGeminiClient(): GoogleGenAI {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.");
    }
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  // AI Color Palette Generator endpoint
  app.post("/api/ai/palette", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const client = getGeminiClient();
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Create a gorgeous, cohesive color palette for a spinner wheel of names based on this theme: "${prompt}". Return 6 to 10 beautiful, high-contrast hex colors that look modern and visually striking together (make sure they are legible behind text!).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              colors: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of 6 to 10 hex color codes (e.g. '#FF5500', '#22C55E')"
              },
              name: {
                type: Type.STRING,
                description: "Theme name or description"
              }
            },
            required: ["colors", "name"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response received from Gemini API");
      }
      const data = JSON.parse(responseText);
      res.json(data);
    } catch (err: any) {
      console.error("AI Palette error:", err);
      res.status(500).json({ error: err.message || "Failed to generate AI palette" });
    }
  });

  // AI Suggestions endpoint
  app.post("/api/ai/suggestions", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const client = getGeminiClient();
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Provide a list of 10 to 20 exciting or highly creative suggestions/names for a spinner wheel based on the query: "${prompt}".`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "10 to 20 short name options (max 25 characters each) for the wheel"
              },
              title: {
                type: Type.STRING,
                description: "An elegant, short title for this list"
              }
            },
            required: ["suggestions", "title"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response received from Gemini API");
      }
      const data = JSON.parse(responseText);
      res.json(data);
    } catch (err: any) {
      console.error("AI Suggestions error:", err);
      res.status(500).json({ error: err.message || "Failed to generate suggestions" });
    }
  });

  // Serve static files / Vite Middleware
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
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
