import { GoogleGenAI, Type } from "@google/genai";
import * as VapiModule from "@vapi-ai/web";
import axios from "axios";

const Vapi = VapiModule.default || VapiModule.Vapi || VapiModule;

const getAI = () => {
  return new GoogleGenAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || "",
  });
};

// ✅ Production mein Render URL, local mein localhost
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

let vapiInstance = null;
const getVapi = () => {
  if (!vapiInstance) {
    const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
    if (!publicKey) console.warn("VITE_VAPI_PUBLIC_KEY missing.");
    try {
      if (typeof Vapi !== "function") console.error("Vapi is not a constructor:", typeof Vapi);
      vapiInstance = new Vapi(publicKey || "missing-key");
    } catch (err) {
      console.error("Vapi init failed:", err);
      return null;
    }
  }
  return vapiInstance;
};

export const api = {

  registerComplaint: async (complaint) => {
    try {
      const { data } = await axiosInstance.get("/registerComplaint", {
        params: {
          Intent:      complaint.Intent      || complaint.type,
          source:      complaint.source      || "Web",
          language:    complaint.language    || "English",
          location:    complaint.location    || complaint.street || "Delhi",
          userPhone:   complaint.userPhone   || "9999999999",
          description: complaint.description || "No description provided",
        },
      });
      if (data.status === "success") {
        return { ...complaint, id: data.ticket_id, ticket_id: data.ticket_id, status: "pending", timestamp: data.timestamp };
      }
      throw new Error(data.error || "Failed to register complaint");
    } catch (error) {
      console.error("Register Complaint Error:", error);
      return null;
    }
  },

  getComplaints: async () => {
    try {
      const { data } = await axiosInstance.get("/admin/complaints");
      return data;
    } catch (error) {
      console.error("Get Complaints Error:", error);
      return [];
    }
  },

  getStats: async () => {
    try {
      const { data } = await axiosInstance.get("/admin/stats");
      return data;
    } catch (error) {
      console.error("Get Stats Error:", error);
      return { pending: 0, in_progress: 0, completed: 0 };
    }
  },

  updateStatus: async (ticket_id, status) => {
    try {
      const backendStatus =
        status === "In Progress" ? "in_progress" :
        status === "Completed"   ? "completed"   :
        status === "Pending"     ? "pending"      : status;
      const { data } = await axiosInstance.put("/admin/update-status", null, {
        params: { ticket_id, status: backendStatus },
      });
      return data;
    } catch (error) {
      console.error("Update Status Error:", error);
      return null;
    }
  },

  startCampaign: async (campaignData) => {
    try {
      const { data } = await axiosInstance.post("/admin/start-campaign", null, {
        params: { name: campaignData.name, area: campaignData.area || "All", message: campaignData.message || `Campaign: ${campaignData.name}` },
      });
      return data;
    } catch (error) {
      console.error("Start Campaign Error:", error);
      return null;
    }
  },

  adminRegister: async (name, email) => {
    try {
      const { data } = await axiosInstance.post("/admin/register", { name, email });
      return data;
    } catch (error) {
      console.error("Admin Register Error:", error);
      return null;
    }
  },

  adminLogin: async (email) => {
    try {
      const { data } = await axiosInstance.post("/admin/login", { email });
      return data;
    } catch (error) {
      console.error("Admin Login Error:", error);
      return null;
    }
  },

  userRegister: async (name, phone, area) => {
    try {
      const { data } = await axiosInstance.post("/user/register", { name, phone, area });
      return data;
    } catch (error) {
      console.error("User Register Error:", error);
      return null;
    }
  },

  userLogin: async (phone) => {
    try {
      const { data } = await axiosInstance.post("/user/login", { phone });
      return data;
    } catch (error) {
      console.error("User Login Error:", error);
      return null;
    }
  },

  getUserComplaints: async (phone) => {
    try {
      const { data } = await axiosInstance.get("/user/my-complaints", { params: { phone } });
      return data;
    } catch (error) {
      console.error("Get User Complaints Error:", error);
      return [];
    }
  },

  cancelComplaint: async (ticket_id, phone) => {
    try {
      const { data } = await axiosInstance.put("/user/cancel-complaint", null, { params: { ticket_id, phone } });
      return data;
    } catch (error) {
      console.error("Cancel Complaint Error:", error);
      return null;
    }
  },

  forwardCall: async () => {
    try {
      const { data } = await axiosInstance.get("/forwardCall");
      return data;
    } catch (error) {
      console.error("Forward Call Error:", error);
      return null;
    }
  },

  startOutboundCall: async (phoneNumber) => {
    try {
      const { data } = await axiosInstance.get("/startOutboundCall", { params: { phone: phoneNumber } });
      return data;
    } catch (error) {
      console.error("Start Outbound Call Error:", error);
      return { status: "error", message: error.message };
    }
  },

  vapi: {
    start: async (assistantId) => {
      const vapi = getVapi();
      if (!vapi) throw new Error("Vapi SDK failed to initialize.");
      const aid = assistantId || import.meta.env.VITE_VAPI_ASSISTANT_ID;
      if (!import.meta.env.VITE_VAPI_PUBLIC_KEY || !aid) throw new Error("Vapi Configuration Missing.");
      return await vapi.start(aid);
    },

    startWithOverrides: async (assistantId, overrides = {}) => {
      const vapi = getVapi();
      if (!vapi) throw new Error("Vapi SDK failed to initialize.");
      const aid = assistantId || import.meta.env.VITE_VAPI_ASSISTANT_ID;
      if (!import.meta.env.VITE_VAPI_PUBLIC_KEY || !aid) throw new Error("Vapi Configuration Missing.");
      return await vapi.start(aid, {
        variableValues: overrides.variableValues || {},
        firstMessage:   overrides.firstMessage   || undefined,
      });
    },

    stop: () => { const vapi = getVapi(); if (vapi) vapi.stop(); },
    on:   (event, cb) => { const vapi = getVapi(); if (vapi) vapi.on(event, cb); },
    off:  (event, cb) => { const vapi = getVapi(); if (vapi) vapi.off(event, cb); },
    isSupported: () => true,
  },

  connectToVaani: (callbacks) => {
    const ai = getAI();
    return ai.live.connect({
      model: "gemini-2.5-flash-native-audio-preview-12-2025",
      callbacks,
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
        systemInstruction: `You are Vaani, a polite and soft-spoken female AI assistant for the Delhi Complaint System.
        Speak in Hinglish. Help citizens register Garbage, Water, or Electricity complaints.
        Gather: Complaint Type, Location, and confirm their phone number.`,
      },
    });
  },

  chatWithVaani: async (message) => {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{ text: message }] }],
        config: { systemInstruction: "You are Vaani, Delhi Complaint System assistant. Speak in Hinglish. Help with Garbage, Water, Electricity complaints." },
      });
      return response.text;
    } catch (error) {
      console.error("Vaani Chat Error:", error);
      return "Technical glitch. Please try again.";
    }
  },

  processVoiceInput: async (text) => {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Extract complaint details from: "${text}". Type must be Garbage/Water/Electricity. Return JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type:        { type: Type.STRING, enum: ["Garbage", "Water", "Electricity"] },
              subCategory: { type: Type.STRING },
              street:      { type: Type.STRING },
              area:        { type: Type.STRING },
              pincode:     { type: Type.STRING },
            },
            required: ["type"],
          },
        },
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("AI Processing Error:", error);
      return null;
    }
  },
};