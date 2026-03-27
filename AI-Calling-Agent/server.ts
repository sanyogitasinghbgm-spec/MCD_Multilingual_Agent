import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID;
const MONGODB_URI = process.env.MONGODB_URI;

// MongoDB Connection
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB Connection Error:", err));
} else {
  console.warn("MONGODB_URI is missing. Data will not be persistent.");
}

// Complaint Schema
const complaintSchema = new mongoose.Schema({
  Intent: { type: String, required: true },
  source: { type: String, default: "Web" },
  language: { type: String, default: "English" },
  location: { type: String, required: true },
  userPhone: { type: String, required: true },
  description: { type: String },
  ticket_id: { type: String, unique: true },
  timestamp: { type: String },
  status: { type: String, default: "pending" },
  cancelled: { type: Boolean, default: false },
  isEscalated: { type: Boolean, default: false },
  escalationLog: [{
    timestamp: String,
    admin: String,
    action: String
  }],
  feedback: {
    rating: Number,
    comment: String
  }
});

const Complaint = mongoose.model("Complaint", complaintSchema);

async function makeCall(phone: string, message: string) {
  const url = "https://api.vapi.ai/call";
  const payload = {
    assistantId: VAPI_ASSISTANT_ID,
    phoneNumber: phone,
    metadata: {
      campaign_message: message
    }
  };

  const headers = {
    "Authorization": `Bearer ${VAPI_API_KEY}`,
    "Content-Type": "application/json"
  };

  const response = await axios.post(url, payload, { headers });
  return response.data;
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // 📋 Get All Complaints
  app.get("/api/complaints", async (req, res) => {
    try {
      const allComplaints = await Complaint.find().sort({ timestamp: -1 });
      res.json(allComplaints);
    } catch (error) {
      console.error("Fetch Complaints Error:", error);
      res.status(500).json({ error: "Failed to fetch complaints" });
    }
  });

  // 🔄 Update Complaint Status
  app.post("/api/complaints/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await Complaint.findOneAndUpdate(
        { $or: [{ ticket_id: id }, { _id: mongoose.isValidObjectId(id) ? id : null }] },
        { status },
        { new: true }
      );
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  // 📝 Submit Feedback
  app.post("/api/complaints/:id/feedback", async (req, res) => {
    try {
      const { id } = req.params;
      const { feedback } = req.body;
      const updated = await Complaint.findOneAndUpdate(
        { $or: [{ ticket_id: id }, { _id: mongoose.isValidObjectId(id) ? id : null }] },
        { feedback },
        { new: true }
      );
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to submit feedback" });
    }
  });

  // ❌ Cancel Complaint
  app.post("/api/complaints/:id/cancel", async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await Complaint.findOneAndUpdate(
        { $or: [{ ticket_id: id }, { _id: mongoose.isValidObjectId(id) ? id : null }] },
        { status: "Cancelled", cancelled: true },
        { new: true }
      );
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel complaint" });
    }
  });

  // 🔁 Forward Call (VAPI karega actual transfer)
  app.get("/api/forwardCall", (req, res) => {
    res.json({
      status: "success",
      message: "Transfer triggered"
    });
  });

  // 🚀 Forward Complaint (Escalation)
  app.post("/api/complaints/:id/forward", async (req, res) => {
    try {
      const { id } = req.params;
      const { adminName } = req.body;
      const updated = await Complaint.findOneAndUpdate(
        { $or: [{ ticket_id: id }, { _id: mongoose.isValidObjectId(id) ? id : null }] },
        { 
          isEscalated: true,
          $push: { 
            escalationLog: {
              timestamp: new Date().toISOString(),
              admin: adminName,
              action: 'Forwarded Call to Specialized Team (Vapi Triggered)'
            }
          }
        },
        { new: true }
      );
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to forward complaint" });
    }
  });

  // 📲 Outbound Call (VAPI karega actual call)
  app.get("/api/startOutboundCall", async (req, res) => {
    try {
      const { phone, message } = req.query;
      if (!phone) {
        return res.status(400).json({ error: "Phone number is required" });
      }
      const result = await makeCall(phone as string, (message as string) || "Hello from MCD AI");
      res.json(result);
    } catch (error: any) {
      console.error("Outbound Call Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to trigger outbound call", details: error.response?.data });
    }
  });

  // 📝 Register Complaint
  app.get("/api/registerComplaint", async (req, res) => {
    try {
      const { Intent, source, language, location, userPhone, description } = req.query;

      const ALLOWED_INTENTS = ["Garbage", "Water", "Electricity"];

      // Intent validation
      if (!Intent || !ALLOWED_INTENTS.includes(Intent as string)) {
        return res.status(400).json({ error: "Invalid complaint type" });
      }

      // Basic validation
      if (!location || !(location as string).trim()) {
        return res.status(400).json({ error: "Location is required" });
      }

      if (!userPhone || !(userPhone as string).trim()) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      // Ticket generate
      const ticket_id = uuidv4().substring(0, 8);
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

      const complaint_data = {
        Intent,
        source,
        language,
        location,
        userPhone,
        description,
        ticket_id,
        timestamp,
        status: "pending",
        cancelled: false
      };

      // Save in MongoDB
      const newComplaint = new Complaint(complaint_data);
      await newComplaint.save();
      console.log("Complaint Registered:", complaint_data);

      res.json({
        status: "success",
        ticket_id: ticket_id,
        timestamp: timestamp,
        message: "Complaint registered successfully"
      });
    } catch (error) {
      console.error("Register Complaint Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // 🪝 Vapi Webhook (Handles Tool Calls and Inbound Events)
  app.post("/api/vapi/webhook", async (req, res) => {
    try {
      const { message } = req.body;
      console.log("Vapi Webhook Received:", message.type);

      if (message.type === "tool-call") {
        const toolCalls = message.toolCalls;
        const results = [];

        for (const toolCall of toolCalls) {
          if (toolCall.function.name === "registerComplaint") {
            const args = toolCall.function.arguments;
            
            // Re-use the registration logic
            const ticket_id = uuidv4().substring(0, 8);
            const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

            const complaint_data = {
              Intent: args.Intent || "General",
              source: "Vapi",
              language: args.language || "English",
              location: args.location || "Unknown",
              userPhone: args.userPhone || "Unknown",
              description: args.description || "Voice complaint via Vapi",
              ticket_id,
              timestamp,
              status: "pending",
              cancelled: false
            };

            const newComplaint = new Complaint(complaint_data);
            await newComplaint.save();
            console.log("Vapi Complaint Registered:", complaint_data);

            results.push({
              toolCallId: toolCall.id,
              result: `Complaint registered successfully. Ticket ID: ${ticket_id}`
            });
          }
        }

        return res.json({ results });
      }

      res.json({ status: "ok" });
    } catch (error) {
      console.error("Vapi Webhook Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: message }] }],
        config: {
          systemInstruction: "You are Vaani, a helpful AI assistant for the Delhi Complaint System. Your goal is to help citizens register complaints about Garbage, Water, or Electricity. Be polite, professional, and speak in a mix of Hindi and English (Hinglish) as appropriate. If the user provides complaint details (type, area, pincode), acknowledge them and guide them to the registration form. Keep responses concise and helpful.",
        }
      });
      res.json({ text: response.text });
    } catch (error) {
      console.error("Chat Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/process-voice", async (req, res) => {
    try {
      const { text } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Extract complaint details from this text: "${text}". 
        The complaint type must be one of: Garbage, Water, Electricity.
        For each type, extract the sub-category if mentioned:
        - Garbage: overflowingBin, illegalDumping, deadAnimal
        - Water: leakage, noSupply, dirtyWater
        - Electricity: powerCut, streetLight, voltageIssue
        Extract street/landmark, area, and pincode if mentioned.
        Return JSON format.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ['Garbage', 'Water', 'Electricity'] },
              subCategory: { type: Type.STRING },
              street: { type: Type.STRING },
              area: { type: Type.STRING },
              pincode: { type: Type.STRING },
            },
            required: ['type']
          }
        }
      });
      res.json(JSON.parse(response.text || '{}'));
    } catch (error) {
      console.error("Process Voice Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
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

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // WebSocket Server for Gemini Live Proxy
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    if (url.pathname !== "/ws/vaani") {
      ws.close();
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing");
      ws.send(JSON.stringify({ type: "error", message: "GEMINI_API_KEY is missing" }));
      ws.close();
      return;
    }

    // Connect to Gemini Live API
    const sessionPromise = ai.live.connect({
      model: "gemini-2.5-flash-native-audio-preview-12-2025",
      callbacks: {
        onopen: () => {
          console.log("Connected to Gemini Live API");
        },
        onmessage: (message) => {
          // Proxy messages from Gemini to Client
          ws.send(JSON.stringify(message));
        },
        onclose: () => {
          console.log("Gemini Live API connection closed");
          ws.close();
        },
        onerror: (err) => {
          console.error("Gemini WebSocket error:", err);
          ws.send(JSON.stringify({ type: "error", message: "Gemini WebSocket error" }));
          ws.close();
        }
      },
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
        },
        systemInstruction: `You are Vaani, a polite and soft-spoken female AI assistant for the Delhi Complaint System. 
        Your personality is empathetic, patient, and professional. 
        Your primary goal is to assist Delhi citizens in registering civic complaints (Garbage, Water, Electricity) through a natural voice conversation.
        
        Guidelines:
        1. Speak in a warm, gentle, and soft tone.
        2. Use a natural mix of Hindi and English (Hinglish) as spoken in Delhi.
        3. Patiently listen to the user's concerns and acknowledge their frustration with empathy.
        4. Gently guide the conversation to gather: Complaint Type, Landmark/Street, Area, and Pincode.
        5. If the user is confused, explain things simply and softly.
        6. Once all details are gathered, reassure them that their complaint is being processed.
        7. Keep your responses concise yet helpful, suitable for a real-time voice call.
        
        Avoid sounding like a robot. Be a helpful companion for the citizens.`,
      },
    });

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const session = await sessionPromise;
        
        if (message.type === 'input') {
          if (message.audio) {
            session.sendRealtimeInput({ audio: message.audio });
          } else if (message.video) {
            session.sendRealtimeInput({ video: message.video });
          } else if (message.text) {
            session.sendRealtimeInput({ text: message.text });
          }
        }
      } catch (e) {
        console.error("Error processing client message:", e);
      }
    });

    ws.on("close", async () => {
      console.log("Client connection closed");
      const session = await sessionPromise;
      session.close();
    });
  });
}

startServer();
