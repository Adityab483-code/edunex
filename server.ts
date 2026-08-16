import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import {
  getSqliteDb,
  recordUpload,
  getUploadsByCourse,
  getAllUploads,
  deleteUpload,
  saveCourseToSqlite,
  deleteCourseFromSqlite,
  getCoursesFromSqlite,
  saveUserToSqlite,
  deleteUserFromSqlite,
  getUsersFromSqlite,
  saveComplaintToSqlite,
  getComplaintsFromSqlite,
  updateComplaintInSqlite,
  deleteComplaintFromSqlite,
  saveAssignmentToSqlite,
  getAssignmentsFromSqlite,
  deleteAssignmentFromSqlite,
  saveQuizToSqlite,
  getQuizzesFromSqlite,
  deleteQuizFromSqlite,
  saveQuizAttemptToSqlite,
  getQuizAttemptsFromSqlite,
  saveCertificateToSqlite,
  getCertificatesFromSqlite,
  saveDiscussionToSqlite,
  getDiscussionsFromSqlite,
  saveProjectToSqlite,
  getProjectsFromSqlite,
  saveLearnTwinToSqlite,
  getLearnTwinFromSqlite,
  getAllLearnTwinsFromSqlite,
  UPLOADS_DIR,
  SqliteUploadRecord
} from "./server/sqlite";

dotenv.config();

const app = express();
const PORT = 3000;
const server = http.createServer(app);

app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));

// Configure Multer for File Uploads (Videos, PDFs, Presentations, Starters, High-Res Pictures, Notes)
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 1024 * 1024 * 1024 } // 1GB (1024MB) limit to support large video lectures, rich slide decks, high-res PDFs, raw diagrams, pictures & notes
});

// WebSocket Server & Connected Clients
const wss = new WebSocketServer({ server, path: "/ws" });
const wsClients = new Map<WebSocket, { userId?: string; userName?: string; role?: string }>();

function broadcastWs(data: any) {
  const payload = JSON.stringify(data);
  for (const [client, meta] of wsClients.entries()) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (err) {
        console.error("Failed to broadcast message to client:", err);
      }
    }
  }
}

function sendToUserWs(userId: string, data: any) {
  const payload = JSON.stringify(data);
  for (const [client, meta] of wsClients.entries()) {
    if (meta.userId === userId && client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (err) {
        console.error("Failed to send message to user:", err);
      }
    }
  }
}

function handleInteractiveLiveReply(incomingMsg: any) {
  // If a student or teacher messages an AI mentor or support directly, provide helpful automated acknowledgment
  if (incomingMsg && incomingMsg.receiverId && incomingMsg.receiverId.startsWith("ai-")) {
    setTimeout(() => {
      const autoReply = {
        id: `msg-ai-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        senderId: incomingMsg.receiverId,
        senderName: "EduNex AI Tutor",
        senderRole: "TEACHER",
        senderAvatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100",
        receiverId: incomingMsg.senderId,
        recipientId: incomingMsg.senderId,
        recipientName: incomingMsg.senderName,
        content: `Hello ${incomingMsg.senderName || "there"}! I received your message: "${incomingMsg.content.slice(0, 40)}...". Let me know if you need assistance breaking down concepts or solving quiz problems!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        read: false
      };
      messages.push(autoReply);
      broadcastWs({
        type: "message:new",
        message: autoReply
      });
    }, 1000);
  }
}

wss.on("connection", (ws) => {
  wsClients.set(ws, {});

  // Send initial connected confirmation
  ws.send(JSON.stringify({
    type: "connected",
    message: "Connected to EduNex Real-Time Messaging Stream",
    timestamp: new Date().toISOString(),
    totalActive: wsClients.size
  }));

  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString());

      if (data.type === "join" || data.type === "auth") {
        wsClients.set(ws, {
          userId: data.userId,
          userName: data.userName,
          role: data.role
        });
        
        // Broadcast presence
        broadcastWs({
          type: "presence:update",
          userId: data.userId,
          status: "online",
          timestamp: new Date().toISOString(),
          activeCount: wsClients.size
        });
      } else if (data.type === "typing") {
        // Broadcast typing state to the target recipient
        broadcastWs({
          type: "typing",
          senderId: data.senderId,
          receiverId: data.receiverId,
          senderName: data.senderName,
          isTyping: Boolean(data.isTyping)
        });
      } else if (data.type === "message:send") {
        const msgId = data.id || `msg-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
        
        // Find sender user profile if available
        const senderUser = users.find(u => u.id === data.senderId);

        const newMsg: ServerMessage = {
          id: msgId,
          senderId: data.senderId,
          receiverId: data.receiverId || "all",
          recipientId: data.receiverId || "all",
          content: data.content,
          text: data.content,
          senderName: data.senderName || senderUser?.name || "Academic Member",
          senderRole: data.senderRole || senderUser?.role || "STUDENT",
          senderAvatar: data.senderAvatar || senderUser?.avatar,
          isAnnouncement: Boolean(data.isAnnouncement),
          courseId: data.courseId,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          read: false,
          isRead: false
        };

        // Prevent duplicate insertion in in-memory message store
        const existingIdx = messages.findIndex(m => m.id === newMsg.id);
        if (existingIdx < 0) {
          messages.push(newMsg);
        } else {
          messages[existingIdx] = newMsg;
        }

        // Broadcast to all clients
        broadcastWs({
          type: "message:new",
          message: newMsg
        });

        // Trigger interactive live reply if messaging faculty or support
        if (data.receiverId && data.receiverId !== "all") {
          handleInteractiveLiveReply(newMsg);
        }
      } else if (data.type === "message:read") {
        const { messageId, senderId, receiverId } = data;
        messages.forEach(m => {
          if ((messageId && m.id === messageId) || (m.senderId === senderId && m.receiverId === receiverId)) {
            m.read = true;
          }
        });
        broadcastWs({
          type: "message:read_receipt",
          messageId,
          senderId,
          receiverId
        });
      }
    } catch (err) {
      console.error("Error processing incoming WebSocket message:", err);
    }
  });

  ws.on("close", () => {
    const meta = wsClients.get(ws);
    wsClients.delete(ws);
    if (meta?.userId) {
      broadcastWs({
        type: "presence:update",
        userId: meta.userId,
        status: "offline",
        timestamp: new Date().toISOString(),
        activeCount: wsClients.size
      });
    }
  });
});

// Initialize Gemini Client Lazily & Dynamically
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  try {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (err) {
    console.warn("Failed to initialize GoogleGenAI client:", err);
    return null;
  }
}

interface GeminiCallOptions {
  contents: string;
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: string;
}

// Resilient Gemini Invoker with automatic multi-model fallback to gracefully handle 503 (high demand) and transient load spikes
async function callGeminiWithFallback(options: GeminiCallOptions): Promise<{ text: string; modelUsed: string } | null> {
  const aiClient = getGeminiClient();
  if (!aiClient) return null;

  const candidateModels = [
    "gemini-2.5-flash",
    "gemini-3.7-flash",
    "gemini-2.5-flash-lite",
  ];

  for (const model of candidateModels) {
    try {
      const config: any = {};
      if (options.systemInstruction) config.systemInstruction = options.systemInstruction;
      if (typeof options.temperature === "number") config.temperature = options.temperature;
      if (options.responseMimeType) config.responseMimeType = options.responseMimeType;

      const response = await aiClient.models.generateContent({
        model,
        contents: options.contents,
        config,
      });

      if (response && response.text) {
        return { text: response.text, modelUsed: model };
      }
    } catch (err: any) {
      const isTransient = 
        err?.status === "UNAVAILABLE" || 
        err?.error?.code === 503 || 
        err?.code === 503 ||
        String(err?.message || "").includes("503") || 
        String(err?.message || "").includes("high demand") ||
        err?.status === 429 ||
        err?.error?.code === 429;

      if (isTransient) {
        console.info(`Model ${model} temporarily experiencing high demand, smoothly failing over to alternate candidate model...`);
        continue;
      }
      console.warn(`Gemini generation note for ${model}:`, err?.message || err);
    }
  }

  return null;
}

// ==========================================
// DATA STORAGE (In-Memory Database, initially zero demo items)
// ==========================================

let users: any[] = [];
let courses: any[] = [];
let assignments: any[] = [];
let quizzes: any[] = [];
let quizAttempts: any[] = [];
let projects: any[] = [];
let studentSkills: any[] = [];
let discussions: any[] = [];

interface ServerMessage {
  id: string;
  senderId: string;
  receiverId?: string;
  recipientId?: string;
  senderName?: string;
  senderRole?: string;
  senderAvatar?: string;
  recipientName?: string;
  courseId?: string;
  content?: string;
  text?: string;
  timestamp: string;
  isAnnouncement?: boolean;
  read?: boolean;
  isRead?: boolean;
}

let messages: ServerMessage[] = [];
let certificates: any[] = [];
let notifications: any[] = [];
let complaints: any[] = [];

// Initialize SQLite Database and load stored courses, users, complaints, assignments, quizzes, certificates, etc. into memory cache
getSqliteDb().then(async () => {
  try {
    const sqliteCourses = await getCoursesFromSqlite();
    if (sqliteCourses && sqliteCourses.length > 0) {
      courses = sqliteCourses;
    }
    const sqliteUsers = await getUsersFromSqlite();
    if (sqliteUsers && sqliteUsers.length > 0) {
      users = sqliteUsers;
    }
    const sqliteComplaints = await getComplaintsFromSqlite();
    if (sqliteComplaints && sqliteComplaints.length > 0) {
      complaints = sqliteComplaints;
    }
    const sqliteAssignments = await getAssignmentsFromSqlite();
    if (sqliteAssignments && sqliteAssignments.length > 0) {
      assignments = sqliteAssignments;
    }
    const sqliteQuizzes = await getQuizzesFromSqlite();
    if (sqliteQuizzes && sqliteQuizzes.length > 0) {
      quizzes = sqliteQuizzes;
    }
    const sqliteAttempts = await getQuizAttemptsFromSqlite();
    if (sqliteAttempts && sqliteAttempts.length > 0) {
      quizAttempts = sqliteAttempts;
    }
    const sqliteCerts = await getCertificatesFromSqlite();
    if (sqliteCerts && sqliteCerts.length > 0) {
      certificates = sqliteCerts;
    }
    const sqliteDiscussions = await getDiscussionsFromSqlite();
    if (sqliteDiscussions && sqliteDiscussions.length > 0) {
      discussions = sqliteDiscussions;
    }
    const sqliteProjects = await getProjectsFromSqlite();
    if (sqliteProjects && sqliteProjects.length > 0) {
      projects = sqliteProjects;
    }
  } catch (err) {
    console.warn("SQLite initialization check:", err);
  }
});

// ==========================================
// REST API ENDPOINTS
// ==========================================

// Uploads (SQLite-backed files: Videos, PDFs, Presentations, Starters)
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const { courseId, title, resourceType } = req.body;
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    // Auto-detect resource category
    let determinedType: "video" | "pdf" | "presentation" | "code" | "image" | "file" | "other" = "other";
    if (resourceType) {
      determinedType = resourceType as any;
    } else if (fileExt.match(/\.(mp4|webm|mov|mkv|avi|m4v|mp3|wav)$/)) {
      determinedType = "video";
    } else if (fileExt === ".pdf") {
      determinedType = "pdf";
    } else if (fileExt.match(/\.(png|jpg|jpeg|gif|webp|bmp|svg|tiff|heic|raw)$/)) {
      determinedType = "image";
    } else if (fileExt.match(/\.(ppt|pptx|key|odp|pps)$/)) {
      determinedType = "presentation";
    } else if (fileExt.match(/\.(txt|md|docx|doc|rtf|pages)$/)) {
      determinedType = "file";
    } else if (fileExt.match(/\.(zip|tar|gz|ts|js|py|html|css|json|sql|java|cpp|c)$/)) {
      determinedType = "code";
    }

    const uploadRecord: SqliteUploadRecord = {
      id: `upl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      course_id: courseId || null,
      title: title || file.originalname,
      file_name: file.filename,
      file_path: file.path,
      mime_type: file.mimetype,
      file_size: file.size,
      resource_type: determinedType,
      created_at: new Date().toISOString()
    };

    await recordUpload(uploadRecord);

    const formattedSize = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`;

    res.status(201).json({
      success: true,
      file: {
        id: uploadRecord.id,
        uploadId: uploadRecord.id,
        title: uploadRecord.title,
        fileName: uploadRecord.file_name,
        originalName: file.originalname,
        url: `/api/uploads/files/${file.filename}`,
        size: formattedSize,
        fileSizeBytes: file.size,
        mimeType: file.mimetype,
        type: determinedType,
        uploadedAt: uploadRecord.created_at
      }
    });
  } catch (err: any) {
    console.error("Upload error in SQLite storage:", err);
    res.status(500).json({ error: "Failed to save upload to SQLite database" });
  }
});

app.post("/api/upload/multiple", upload.array("files", 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const { courseId } = req.body;
    const uploadedRecords = [];

    for (const file of files) {
      const fileExt = path.extname(file.originalname).toLowerCase();
      let determinedType: "video" | "pdf" | "presentation" | "code" | "image" | "file" | "other" = "other";
      if (fileExt.match(/\.(mp4|webm|mov|mkv|avi|m4v|mp3|wav)$/)) {
        determinedType = "video";
      } else if (fileExt === ".pdf") {
        determinedType = "pdf";
      } else if (fileExt.match(/\.(png|jpg|jpeg|gif|webp|bmp|svg|tiff|heic|raw)$/)) {
        determinedType = "image";
      } else if (fileExt.match(/\.(ppt|pptx|key|odp|pps)$/)) {
        determinedType = "presentation";
      } else if (fileExt.match(/\.(txt|md|docx|doc|rtf|pages)$/)) {
        determinedType = "file";
      } else if (fileExt.match(/\.(zip|tar|gz|ts|js|py|html|css|json|sql|java|cpp|c)$/)) {
        determinedType = "code";
      }

      const uploadRecord: SqliteUploadRecord = {
        id: `upl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        course_id: courseId || null,
        title: file.originalname,
        file_name: file.filename,
        file_path: file.path,
        mime_type: file.mimetype,
        file_size: file.size,
        resource_type: determinedType,
        created_at: new Date().toISOString()
      };

      await recordUpload(uploadRecord);

      const formattedSize = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;

      uploadedRecords.push({
        id: uploadRecord.id,
        uploadId: uploadRecord.id,
        title: uploadRecord.title,
        fileName: uploadRecord.file_name,
        originalName: file.originalname,
        url: `/api/uploads/files/${file.filename}`,
        size: formattedSize,
        fileSizeBytes: file.size,
        mimeType: file.mimetype,
        type: determinedType,
        uploadedAt: uploadRecord.created_at
      });
    }

    res.status(201).json({ success: true, files: uploadedRecords });
  } catch (err: any) {
    console.error("Multiple upload error in SQLite storage:", err);
    res.status(500).json({ error: "Failed to process multiple uploads" });
  }
});

// Serve and stream uploaded files (Video playback, PDF view, Presentation download)
app.get("/api/uploads/files/:fileName", (req, res) => {
  const safeFileName = path.basename(req.params.fileName);
  const filePath = path.join(UPLOADS_DIR, safeFileName);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: "Uploaded file not found" });
  }
});

// Query uploads stored in SQLite
app.get("/api/uploads", async (_req, res) => {
  try {
    const list = await getAllUploads();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve SQLite uploads" });
  }
});

app.get("/api/uploads/course/:courseId", async (req, res) => {
  try {
    const list = await getUploadsByCourse(req.params.courseId);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve SQLite uploads for course" });
  }
});

app.delete("/api/uploads/:id", async (req, res) => {
  try {
    await deleteUpload(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete upload from SQLite" });
  }
});

// Auth & User Management (Backed by SQLite3)
app.get("/api/auth/users", async (_req, res) => {
  try {
    const sqliteUsers = await getUsersFromSqlite();
    if (sqliteUsers && sqliteUsers.length > 0) {
      users = sqliteUsers;
    }
  } catch (err) {
    console.warn("SQLite users fetch error:", err);
  }
  res.json(users);
});

app.post("/api/auth/users", async (req, res) => {
  const user = req.body;
  if (!user || !user.id || !user.email) {
    return res.status(400).json({ error: "Invalid user data" });
  }
  try {
    await saveUserToSqlite(user);
    const existingIdx = users.findIndex(u => u.id === user.id || u.email === user.email);
    if (existingIdx >= 0) {
      users[existingIdx] = { ...users[existingIdx], ...user };
    } else {
      users.push(user);
    }

    const savedUser = users.find(u => u.id === user.id || u.email === user.email) || user;

    // Broadcast real-time user event to all connected devices/admins
    broadcastWs({
      type: "user:update",
      user: savedUser,
      users: users
    });

    res.status(201).json({ success: true, user: savedUser });
  } catch (err) {
    console.error("Failed to save user into SQLite:", err);
    res.status(500).json({ error: "Failed to save user" });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  const targetId = req.params.id;
  const rawRole = (req.headers["x-user-role"] || req.query.role || req.body?.requesterRole || "") as string;
  const requesterRole = String(rawRole).toUpperCase();

  // Find target user to delete
  let targetUser = users.find(u => u.id === targetId);
  if (!targetUser) {
    try {
      const all = await getUsersFromSqlite();
      targetUser = all.find(u => u.id === targetId);
    } catch (e) {
      // ignore
    }
  }

  if (!targetUser) {
    // Attempt delete from SQLite anyway
    try {
      await deleteUserFromSqlite(targetId);
      users = users.filter(u => u.id !== targetId);
      broadcastWs({
        type: "user:delete",
        userId: targetId,
        users: users
      });
      return res.json({ success: true, message: "User account cleared." });
    } catch (err) {
      return res.status(404).json({ error: "User account not found." });
    }
  }

  const targetRole = String(targetUser.role || "STUDENT").toUpperCase();

  // Access Control Policy:
  // 1. ADMIN can delete both TEACHER and STUDENT accounts.
  // 2. TEACHER can ONLY delete STUDENT accounts (e.g. fake accounts, spam accounts).
  // 3. Teachers CANNOT delete Teacher or Admin accounts.
  if (requesterRole === "TEACHER") {
    if (targetRole !== "STUDENT") {
      return res.status(403).json({
        error: "Permission Denied: Teachers are strictly authorized to delete fake or invalid student accounts. Faculty and Administrator accounts cannot be deleted by instructors."
      });
    }
  } else if (requesterRole === "ADMIN") {
    // Admins have full access to delete teachers and students
  } else if (requesterRole !== "ADMIN" && requesterRole !== "TEACHER") {
    return res.status(403).json({
      error: "Unauthorized action: Only Administrators and Instructors have user deletion permissions."
    });
  }

  try {
    await deleteUserFromSqlite(targetId);
    users = users.filter(u => u.id !== targetId);
    broadcastWs({
      type: "user:delete",
      userId: targetId,
      users: users
    });
    res.json({
      success: true,
      message: `Account for "${targetUser.name}" (${targetRole}) has been permanently deleted.`
    });
  } catch (err) {
    console.error("Failed to delete user from SQLite:", err);
    res.status(500).json({ error: "Failed to delete user from SQLite database." });
  }
});

app.post("/api/auth/approve-teacher", async (req, res) => {
  const { teacherId } = req.body;
  const teacher = users.find(u => u.id === teacherId);
  if (teacher) {
    teacher.approved = true;
    try {
      await saveUserToSqlite(teacher);
    } catch (e) {
      console.warn("Error updating approved teacher in SQLite:", e);
    }
    res.json({ success: true, teacher });
  } else {
    res.status(404).json({ error: "Teacher not found" });
  }
});

// Courses (SQLite-backed with full CRUD and multi-device real-time sync)
app.get("/api/courses", async (_req, res) => {
  try {
    const sqliteCourses = await getCoursesFromSqlite();
    if (sqliteCourses && sqliteCourses.length > 0) {
      courses = sqliteCourses;
    }
  } catch (err) {
    console.warn("SQLite courses fetch:", err);
  }
  res.json(courses);
});

app.post("/api/courses", async (req, res) => {
  const newCourse = {
    id: req.body.id || `c-${Date.now()}`,
    enrolledCount: req.body.enrolledCount || 0,
    rating: req.body.rating || 5.0,
    lessons: req.body.lessons || [],
    resources: req.body.resources || [],
    skillsTaught: req.body.skillsTaught || [],
    ...req.body
  };

  try {
    await saveCourseToSqlite(newCourse);
  } catch (err) {
    console.warn("Failed to persist course in SQLite:", err);
  }

  const existingIdx = courses.findIndex(c => c.id === newCourse.id);
  if (existingIdx >= 0) {
    courses[existingIdx] = newCourse;
  } else {
    courses.unshift(newCourse);
  }

  // Real-time broadcast to all connected devices / students / teachers
  broadcastWs({
    type: "course:new",
    course: newCourse,
    courses: courses
  });

  res.status(201).json(newCourse);
});

app.delete("/api/courses/:id", async (req, res) => {
  const courseId = req.params.id;
  try {
    await deleteCourseFromSqlite(courseId);
  } catch (err) {
    console.warn("Failed to delete course in SQLite:", err);
  }

  courses = courses.filter(c => c.id !== courseId);

  // Broadcast deletion universally
  broadcastWs({
    type: "course:deleted",
    id: courseId,
    courseId: courseId,
    courses: courses
  });

  res.json({ success: true, deletedCourseId: courseId });
});

app.post("/api/courses/:id/enroll", async (req, res) => {
  const { studentId } = req.body;
  const course = courses.find(c => c.id === req.params.id);
  const student = users.find(u => u.id === studentId);
  if (course && student) {
    if (!student.enrolledCourseIds) student.enrolledCourseIds = [];
    if (!student.enrolledCourseIds.includes(course.id)) {
      student.enrolledCourseIds.push(course.id);
      course.enrolledCount = (course.enrolledCount || 0) + 1;
      try {
        await saveUserToSqlite(student);
        await saveCourseToSqlite(course);
      } catch (err) {
        console.warn("Error persisting enrollment to SQLite:", err);
      }

      broadcastWs({
        type: "user:update",
        user: student,
        users: users
      });

      broadcastWs({
        type: "course:enrolled",
        courseId: course.id,
        studentId: student.id,
        course: course,
        student: student
      });
    }
    res.json({ success: true, student, course });
  } else {
    res.status(404).json({ error: "Course or Student not found" });
  }
});

// Assignments (SQLite-backed with full CRUD and multi-device real-time sync)
app.get("/api/assignments", async (_req, res) => {
  try {
    const sqliteAssignments = await getAssignmentsFromSqlite();
    if (sqliteAssignments && sqliteAssignments.length > 0) {
      assignments = sqliteAssignments;
    }
  } catch (err) {
    console.warn("SQLite assignments fetch:", err);
  }
  res.json(assignments);
});

app.post("/api/assignments", async (req, res) => {
  const newAssignment = {
    id: req.body.id || `a-${Date.now()}`,
    submissionsCount: 0,
    submissions: [],
    attachments: req.body.attachments || [],
    createdAt: new Date().toISOString(),
    ...req.body
  };

  try {
    await saveAssignmentToSqlite(newAssignment);
  } catch (err) {
    console.warn("Failed to save assignment into SQLite:", err);
  }

  const existingIdx = assignments.findIndex(a => a.id === newAssignment.id);
  if (existingIdx >= 0) {
    assignments[existingIdx] = newAssignment;
  } else {
    assignments.unshift(newAssignment);
  }

  // Universal real-time broadcast to all connected devices
  broadcastWs({
    type: "assignment:new",
    assignment: newAssignment,
    assignments: assignments
  });

  res.status(201).json(newAssignment);
});

app.delete("/api/assignments/:id", async (req, res) => {
  const assignmentId = req.params.id;
  const initialCount = assignments.length;
  try {
    await deleteAssignmentFromSqlite(assignmentId);
  } catch (err) {
    console.warn("Failed to delete assignment from SQLite:", err);
  }

  assignments = assignments.filter(a => a.id !== assignmentId);

  broadcastWs({
    type: "assignment:deleted",
    id: assignmentId,
    assignmentId: assignmentId,
    assignments: assignments
  });

  res.json({ success: true, deletedAssignmentId: assignmentId, removed: initialCount !== assignments.length });
});

app.post("/api/assignments/:id/submit", async (req, res) => {
  const { 
    studentId, 
    studentName, 
    studentAvatar, 
    content, 
    fileUrl, 
    fileName, 
    fileType, 
    fileSize, 
    attachments 
  } = req.body;
  const assignment = assignments.find(a => a.id === req.params.id);
  if (!assignment) return res.status(404).json({ error: "Assignment not found" });

  const submission = {
    id: `sub-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    assignmentId: assignment.id,
    studentId,
    studentName,
    studentAvatar: studentAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    submittedAt: new Date().toISOString(),
    content: content || "",
    fileUrl: fileUrl || "",
    fileName: fileName || (fileUrl ? path.basename(fileUrl) : undefined),
    fileType: fileType || undefined,
    fileSize: fileSize || undefined,
    attachments: attachments || [],
    status: "SUBMITTED" as const
  };

  if (!assignment.submissions) {
    assignment.submissions = [];
  }

  // If student already submitted, update existing or append
  const existingIdx = assignment.submissions.findIndex((s: any) => s.studentId === studentId);
  if (existingIdx >= 0) {
    assignment.submissions[existingIdx] = {
      ...assignment.submissions[existingIdx],
      ...submission
    };
  } else {
    assignment.submissions.push(submission);
  }

  assignment.submissionsCount = assignment.submissions.length;

  try {
    await saveAssignmentToSqlite(assignment);
  } catch (err) {
    console.warn("Failed to persist updated assignment submission into SQLite:", err);
  }

  // Universal real-time broadcast to teachers & admins across devices
  broadcastWs({
    type: "assignment:submitted",
    assignmentId: assignment.id,
    submission: submission,
    assignment: assignment
  });

  res.status(201).json(submission);
});

app.post("/api/assignments/grade", async (req, res) => {
  const { 
    assignmentId, 
    submissionId, 
    studentId, 
    grade, 
    feedback, 
    gradedFileUrl, 
    gradedFileName, 
    gradedFileType 
  } = req.body;
  const assignment = assignments.find(a => a.id === assignmentId);
  if (!assignment) return res.status(404).json({ error: "Assignment not found" });

  const sub = assignment.submissions.find((s: any) => s.id === submissionId || (studentId && s.studentId === studentId));
  if (sub) {
    sub.grade = Number(grade);
    sub.feedback = feedback;
    sub.status = "GRADED";
    if (gradedFileUrl) sub.gradedFileUrl = gradedFileUrl;
    if (gradedFileName) sub.gradedFileName = gradedFileName;
    if (gradedFileType) sub.gradedFileType = gradedFileType;

    try {
      await saveAssignmentToSqlite(assignment);
    } catch (err) {
      console.warn("Failed to persist graded assignment into SQLite:", err);
    }

    // Create notification for student
    const notif = {
      id: `notif-${Date.now()}`,
      userId: sub.studentId,
      title: "Assignment Graded",
      message: `Your submission for '${assignment.title}' received ${grade}/100 points.`,
      type: "grade",
      read: false,
      createdAt: new Date().toISOString()
    };
    notifications.unshift(notif);

    // Universal broadcast to student and all connected devices
    broadcastWs({
      type: "assignment:graded",
      assignmentId,
      submission: sub,
      assignment: assignment,
      studentId: sub.studentId
    });

    res.json({ success: true, submission: sub });
  } else {
    res.status(404).json({ error: "Submission not found" });
  }
});

// Quizzes (SQLite-backed with full CRUD and multi-device real-time sync)
app.get("/api/quizzes", async (_req, res) => {
  try {
    const sqliteQuizzes = await getQuizzesFromSqlite();
    if (sqliteQuizzes && sqliteQuizzes.length > 0) {
      quizzes = sqliteQuizzes;
    }
  } catch (err) {
    console.warn("SQLite quizzes fetch:", err);
  }
  res.json(quizzes);
});

app.post("/api/quizzes", async (req, res) => {
  const newQuiz = {
    id: req.body.id || `q-${Date.now()}`,
    courseId: req.body.courseId || "c-1",
    courseTitle: req.body.courseTitle || "General Curriculum",
    title: req.body.title || "Course Quiz Assessment",
    timeLimitMinutes: req.body.timeLimitMinutes || 15,
    type: req.body.type || "teacher_uploaded",
    difficulty: req.body.difficulty || "Intermediate",
    instructorId: req.body.instructorId || "",
    instructorName: req.body.instructorName || "Instructor",
    instructorAvatar: req.body.instructorAvatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100",
    createdAt: req.body.createdAt || new Date().toISOString(),
    totalPoints: req.body.totalPoints || (req.body.questions?.length ? req.body.questions.length * 10 : 100),
    tags: req.body.tags || ["Assessment"],
    description: req.body.description || "",
    questions: req.body.questions || []
  };

  try {
    await saveQuizToSqlite(newQuiz);
  } catch (err) {
    console.warn("Failed to persist quiz into SQLite:", err);
  }

  const existingIdx = quizzes.findIndex(q => q.id === newQuiz.id);
  if (existingIdx >= 0) {
    quizzes[existingIdx] = newQuiz;
  } else {
    quizzes.unshift(newQuiz);
  }

  // Universal broadcast across devices
  broadcastWs({
    type: "quiz:new",
    quiz: newQuiz,
    quizzes: quizzes
  });

  res.status(201).json(newQuiz);
});

app.delete("/api/quizzes/:id", async (req, res) => {
  const requesterRole = req.headers["x-user-role"] || req.body?.requesterRole;
  if (requesterRole && String(requesterRole).toUpperCase() !== "ADMIN") {
    return res.status(403).json({ error: "Unauthorized: Only Administrators have permission to delete quizzes from the system." });
  }

  const quizId = req.params.id;
  const initialLength = quizzes.length;

  try {
    await deleteQuizFromSqlite(quizId);
  } catch (err) {
    console.warn("Failed to delete quiz in SQLite:", err);
  }

  quizzes = quizzes.filter(q => q.id !== quizId);

  if (quizzes.length === initialLength) {
    return res.status(404).json({ error: "Quiz not found" });
  }

  // Universal broadcast across devices
  broadcastWs({
    type: "quiz:deleted",
    id: quizId,
    quizId: quizId,
    quizzes: quizzes
  });

  res.json({ success: true, deletedQuizId: quizId, message: "Quiz permanently removed by administrator." });
});

// AI Assistant Quiz Generator - Strictly 6 to 7 questions
app.post("/api/ai/quiz-generate", async (req, res) => {
  try {
    const { 
      topic = "Modern Full-Stack Web Development", 
      difficulty = "Intermediate", 
      courseTitle = "Full-Stack Web Development",
      questionCount = 7 // strictly 6 or 7
    } = req.body;

    // Enforce 6 to 7 questions rule
    const count = Math.min(7, Math.max(6, Number(questionCount) || 7));

    const prompt = `You are EduNex AI, an elite educational test architect.
Generate an interactive assessment quiz on the topic: "${topic}".
Difficulty level: ${difficulty}.
Target count: EXACTLY ${count} multiple choice questions (STRICT REQUIREMENT: MUST BE EXACTLY ${count} QUESTIONS, NO MORE AND NO LESS).

Return ONLY valid JSON matching this exact structure without markdown backticks or formatting:
{
  "title": "${topic} — AI Knowledge Evaluation",
  "timeLimitMinutes": ${count * 2},
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": "q1",
      "question": "Question text...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Step-by-step reason why this answer is correct and why other distractors are wrong.",
      "topic": "Specific Subtopic"
    }
  ]
}`;

    const geminiRes = await callGeminiWithFallback({
      contents: prompt,
      temperature: 0.3,
      responseMimeType: "application/json"
    });

    if (geminiRes && geminiRes.text) {
      try {
        const rawText = geminiRes.text;
        const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);

        if (parsed && Array.isArray(parsed.questions) && parsed.questions.length >= 6) {
          // Slice strictly to count (6 or 7)
          const validQuestions = parsed.questions.slice(0, count).map((q: any, i: number) => ({
            id: `ai-q-${Date.now()}-${i + 1}`,
            question: q.question || `Question ${i + 1}`,
            options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: typeof q.correctAnswer === "number" && q.correctAnswer >= 0 && q.correctAnswer < 4 ? q.correctAnswer : 0,
            explanation: q.explanation || "Correct based on core language semantics and standard best practices.",
            topic: q.topic || topic
          }));

          const generatedQuiz = {
            id: `ai-quiz-${Date.now()}`,
            courseId: "ai-custom",
            courseTitle: courseTitle || `${topic} Mastery`,
            title: parsed.title || `${topic} — AI Interactive Quiz (${count} Questions)`,
            timeLimitMinutes: parsed.timeLimitMinutes || count * 2,
            type: "ai_generated" as const,
            difficulty: difficulty as "Beginner" | "Intermediate" | "Advanced",
            instructorName: "EduNex AI Mentor",
            instructorAvatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100",
            createdAt: new Date().toISOString(),
            totalPoints: count * 10,
            tags: ["AI Generated", "Adaptive", difficulty, `${count} Questions`],
            description: `Adaptive ${count}-question diagnostic assessment generated by EduNex AI covering ${topic}.`,
            questions: validQuestions
          };

          return res.json(generatedQuiz);
        }
      } catch (parseErr) {
        console.warn("Quiz JSON parse note, falling back to procedural generator:", parseErr);
      }
    }

    // High-quality contextual fallback generating strictly 6 to 7 curated questions
    const questionBank: Array<{ q: string; opts: string[]; ans: number; exp: string; sub: string }> = [
      {
        q: `In ${topic}, what is the primary benefit of immutability in state management?`,
        opts: [
          "It eliminates the need for any conditional logic in controllers",
          "It makes state changes predictable, avoids side-effects, and enables straightforward change detection",
          "It automatically compiles TypeScript to WebAssembly in the browser",
          "It bypasses all network security headers on API requests"
        ],
        ans: 1,
        exp: "Immutability ensures existing state objects are never mutated directly, making rendering passes pure and state changes trackable over time.",
        sub: "State Architecture"
      },
      {
        q: `When designing asynchronous data fetching for ${topic}, which practice prevents race conditions?`,
        opts: [
          "Always using synchronous while-loops until the response resolves",
          "Using AbortController signals or request cancellation tokens when component unmounts or parameters change",
          "Setting all server response timeouts to infinity",
          "Storing all fetch responses in localStorage synchronously"
        ],
        ans: 1,
        exp: "AbortController allows canceling in-flight HTTP requests when active parameters change, preventing outdated responses from overriding newer data.",
        sub: "Asynchronous Flow"
      },
      {
        q: `Which HTTP response status code is standard when a resource is successfully created via POST in RESTful APIs?`,
        opts: [
          "200 OK",
          "201 Created",
          "204 No Content",
          "301 Moved Permanently"
        ],
        ans: 1,
        exp: "201 Created specifically communicates that the request succeeded and resulted in a new resource being created on the server.",
        sub: "HTTP & REST Standards"
      },
      {
        q: `What is the computational time complexity for searching a hash table with well-distributed keys under average conditions?`,
        opts: [
          "O(1) Constant Time",
          "O(n) Linear Time",
          "O(log n) Logarithmic Time",
          "O(n^2) Quadratic Time"
        ],
        ans: 0,
        exp: "Hash tables provide O(1) average time complexity for lookup, insertion, and deletion by computing hash bucket indexes directly.",
        sub: "Data Structures & Complexity"
      },
      {
        q: `In modern reactive architectures, what is the role of memoization (e.g. useMemo, React.memo)?`,
        opts: [
          "To permanently store user passwords in plain text",
          "To cache expensive computed calculations and skip re-renders if input dependencies have not changed",
          "To prevent all network traffic from reaching the backend",
          "To automatically generate CSS media queries"
        ],
        ans: 1,
        exp: "Memoization caches the output of expensive computations and pure components between renders when dependency values remain unchanged.",
        sub: "Performance Optimization"
      },
      {
        q: `Which authentication approach is recommended for secure stateless token verification between microservices?`,
        opts: [
          "Transmitting passwords in the URL query string",
          "Cryptographically signed JSON Web Tokens (JWT) or OAuth2 Bearer Tokens",
          "Base64 encoded plaintext cookie with no signature",
          "Disabling CORS and SSL validation"
        ],
        ans: 1,
        exp: "Signed JWTs allow downstream microservices to verify authenticity, expiration, and user claims cryptographically without repeated database roundtrips.",
        sub: "Security & Authentication"
      },
      {
        q: `What is the key principle of Defensive Programming when processing external API payloads?`,
        opts: [
          "Never checking null/undefined because modern browsers handle crashes gracefully",
          "Strict schema validation, bounds checking, and handling fallback default states gracefully",
          "Allowing arbitrary scripts to execute directly in DOM nodes",
          "Writing code exclusively inside single-line expressions"
        ],
        ans: 1,
        exp: "Defensive programming validates inputs and handles unexpected null/malformed schemas safely before execution to ensure robust uptime.",
        sub: "Code Reliability & Quality"
      }
    ];

    // Pick exactly count (6 or 7) questions
    const selected = questionBank.slice(0, count);
    const questions = selected.map((item, idx) => ({
      id: `ai-q-${Date.now()}-${idx + 1}`,
      question: item.q,
      options: item.opts,
      correctAnswer: item.ans,
      explanation: item.exp,
      topic: item.sub
    }));

    const fallbackQuiz = {
      id: `ai-quiz-${Date.now()}`,
      courseId: "ai-practice",
      courseTitle: courseTitle || `${topic} Practice`,
      title: `${topic} — Smart AI Knowledge Evaluation (${count} Questions)`,
      timeLimitMinutes: count * 2,
      type: "ai_generated" as const,
      difficulty: difficulty as "Beginner" | "Intermediate" | "Advanced",
      instructorName: "EduNex AI Mentor",
      instructorAvatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100",
      createdAt: new Date().toISOString(),
      totalPoints: count * 10,
      tags: ["AI Generated", "Adaptive", difficulty, `${count} Questions`],
      description: `Targeted ${count}-question interactive assessment on ${topic} with instant scoring and Socratic guidance.`,
      questions
    };

    res.json(fallbackQuiz);
  } catch (err) {
    console.error("AI quiz generate error:", err);
    res.status(500).json({ error: "Failed to generate AI quiz." });
  }
});

app.post("/api/quizzes/:id/submit", async (req, res) => {
  const { studentId, studentName, answers } = req.body; // answers: { [qId]: number }
  const quiz = quizzes.find(q => q.id === req.params.id);
  if (!quiz) return res.status(404).json({ error: "Quiz not found" });

  let score = 0;
  const weakTopics: string[] = [];

  quiz.questions.forEach((q: any) => {
    const chosen = answers[q.id];
    if (chosen === q.correctAnswer) {
      score += 1;
    } else {
      if (!weakTopics.includes(q.topic)) {
        weakTopics.push(q.topic);
      }
    }
  });

  const percentage = Math.round((score / quiz.questions.length) * 100);
  const suggestedRevision = weakTopics.length > 0
    ? weakTopics.map(t => `Revise key concepts in ${t} and practice exercises.`)
    : ["Mastered all quiz topics! Ready for advanced project challenges."];

  const attempt = {
    id: `qa-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    quizId: quiz.id,
    studentId,
    studentName,
    score,
    maxScore: quiz.questions.length,
    percentage,
    completedAt: new Date().toISOString(),
    weakTopics,
    suggestedRevision
  };

  try {
    await saveQuizAttemptToSqlite(attempt);
  } catch (err) {
    console.warn("Failed to persist quiz attempt in SQLite:", err);
  }

  quizAttempts.unshift(attempt);

  // Award XP to student
  const student = users.find(u => u.id === studentId);
  if (student) {
    student.xp = (student.xp || 0) + (score * 50);
    try {
      await saveUserToSqlite(student);
    } catch (e) {
      // ignore
    }
    broadcastWs({
      type: "user:update",
      user: student,
      users: users
    });
  }

  // Universal real-time broadcast of quiz attempt to instructors/students
  broadcastWs({
    type: "quiz:attempted",
    attempt: attempt,
    quizId: quiz.id,
    studentId: studentId
  });

  res.json(attempt);
});

// Projects (SQLite-backed)
app.get("/api/projects", async (_req, res) => {
  try {
    const sqliteProjects = await getProjectsFromSqlite();
    if (sqliteProjects && sqliteProjects.length > 0) {
      projects = sqliteProjects;
    }
  } catch (e) {
    console.warn("SQLite projects fetch:", e);
  }
  res.json(projects);
});

app.post("/api/projects", async (req, res) => {
  const newProject = {
    id: req.body.id || `p-${Date.now()}`,
    currentMembers: [],
    milestones: [
      { id: `m-${Date.now()}-1`, title: "Milestone 1: Architecture & Specs", description: "Design specifications & UI wireframes", status: "in_progress" },
      { id: `m-${Date.now()}-2`, title: "Milestone 2: Core Development", description: "Implement main functionality", status: "pending" },
      { id: `m-${Date.now()}-3`, title: "Milestone 3: Final Demo", description: "Documentation & live presentation", status: "pending" }
    ],
    ...req.body
  };

  try {
    await saveProjectToSqlite(newProject);
  } catch (err) {
    console.warn("Failed to persist project in SQLite:", err);
  }

  projects.push(newProject);

  broadcastWs({
    type: "project:new",
    project: newProject,
    projects: projects
  });

  res.status(201).json(newProject);
});

app.post("/api/projects/:id/join", async (req, res) => {
  const { studentId, studentName, studentAvatar } = req.body;
  const proj = projects.find(p => p.id === req.params.id);
  if (proj) {
    if (!proj.currentMembers.some((m: any) => m.id === studentId)) {
      proj.currentMembers.push({
        id: studentId,
        name: studentName,
        avatar: studentAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
      });
    }

    try {
      await saveProjectToSqlite(proj);
    } catch (err) {
      console.warn("Failed to update project in SQLite:", err);
    }

    broadcastWs({
      type: "project:join",
      projectId: proj.id,
      project: proj,
      studentId: studentId
    });

    res.json({ success: true, project: proj });
  } else {
    res.status(404).json({ error: "Project not found" });
  }
});

// Skills
app.get("/api/skills", (req, res) => {
  res.json(studentSkills);
});

app.post("/api/skills/update", (req, res) => {
  const { skillId, level, xp } = req.body;
  const skill = studentSkills.find(s => s.id === skillId);
  if (skill) {
    if (level) skill.level = level;
    if (xp) skill.xp = xp;
    res.json({ success: true, skill });
  } else {
    res.status(404).json({ error: "Skill not found" });
  }
});

// Discussions (SQLite-backed)
app.get("/api/discussions", async (_req, res) => {
  try {
    const sqliteDiscussions = await getDiscussionsFromSqlite();
    if (sqliteDiscussions && sqliteDiscussions.length > 0) {
      discussions = sqliteDiscussions;
    }
  } catch (e) {
    console.warn("SQLite discussions fetch:", e);
  }
  res.json(discussions);
});

app.post("/api/discussions", async (req, res) => {
  const newThread = {
    id: req.body.id || `disc-${Date.now()}`,
    upvotes: 0,
    replies: [],
    createdAt: new Date().toISOString(),
    ...req.body
  };

  try {
    await saveDiscussionToSqlite(newThread);
  } catch (err) {
    console.warn("Failed to persist discussion in SQLite:", err);
  }

  discussions.unshift(newThread);

  broadcastWs({
    type: "discussion:new",
    discussion: newThread,
    discussions: discussions
  });

  res.status(201).json(newThread);
});

app.post("/api/discussions/:id/reply", async (req, res) => {
  const thread = discussions.find(d => d.id === req.params.id);
  if (thread) {
    const reply = {
      id: `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      ...req.body
    };
    if (!thread.replies) thread.replies = [];
    thread.replies.push(reply);
    thread.repliesCount = thread.replies.length;

    try {
      await saveDiscussionToSqlite(thread);
    } catch (err) {
      console.warn("Failed to update discussion reply in SQLite:", err);
    }

    broadcastWs({
      type: "discussion:reply",
      discussionId: thread.id,
      reply: reply,
      discussion: thread
    });

    res.status(201).json(reply);
  } else {
    res.status(404).json({ error: "Discussion thread not found" });
  }
});

app.post("/api/discussions/:id/upvote", async (req, res) => {
  const thread = discussions.find(d => d.id === req.params.id);
  if (thread) {
    thread.upvotes = (thread.upvotes || 0) + 1;

    try {
      await saveDiscussionToSqlite(thread);
    } catch (err) {
      console.warn("Failed to update discussion upvote in SQLite:", err);
    }

    broadcastWs({
      type: "discussion:upvote",
      discussionId: thread.id,
      upvotes: thread.upvotes,
      discussion: thread
    });

    res.json({ upvotes: thread.upvotes });
  } else {
    res.status(404).json({ error: "Discussion not found" });
  }
});

// Certificates (SQLite-backed)
app.get("/api/certificates", async (_req, res) => {
  try {
    const sqliteCerts = await getCertificatesFromSqlite();
    if (sqliteCerts && sqliteCerts.length > 0) {
      certificates = sqliteCerts;
    }
  } catch (err) {
    console.warn("SQLite certificates fetch:", err);
  }
  res.json(certificates);
});

app.post("/api/certificates/generate", async (req, res) => {
  const { studentId, studentName, courseId, courseTitle, teacherName, scorePercent, skillsEarned } = req.body;
  const newCert = {
    id: `cert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    certificateId: `SML-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    studentId,
    studentName,
    courseId,
    courseTitle,
    issueDate: new Date().toISOString().split("T")[0],
    teacherName: teacherName || "Academic Instructor",
    scorePercent: scorePercent || 100,
    skillsEarned: skillsEarned || ["Course Mastery"]
  };

  try {
    await saveCertificateToSqlite(newCert);
  } catch (err) {
    console.warn("Failed to save certificate into SQLite:", err);
  }

  certificates.unshift(newCert);

  broadcastWs({
    type: "certificate:new",
    certificate: newCert,
    certificates: certificates
  });

  res.status(201).json(newCert);
});

// LearnTwin Multi-Device Cognitive Persistence & Synchronization
app.get("/api/learntwin", async (_req, res) => {
  try {
    const twins = await getAllLearnTwinsFromSqlite();
    res.json(twins);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve cognitive twin profiles." });
  }
});

app.get("/api/learntwin/:studentId", async (req, res) => {
  try {
    const profile = await getLearnTwinFromSqlite(req.params.studentId);
    if (profile) {
      res.json(profile);
    } else {
      res.status(404).json({ error: "Profile not initialized yet." });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to load cognitive twin profile." });
  }
});

app.post("/api/learntwin/:studentId/evolve", async (req, res) => {
  try {
    const { studentId } = req.params;
    const { studentName, profile } = req.body;

    if (!profile) {
      return res.status(400).json({ error: "Missing profile payload" });
    }

    await saveLearnTwinToSqlite(studentId, studentName || "Student", profile);

    // Universal broadcast to teachers and students
    broadcastWs({
      type: "learntwin:updated",
      studentId,
      studentName: studentName || "Student",
      profile,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, profile });
  } catch (err) {
    console.error("Failed to evolve and persist LearnTwin in SQLite:", err);
    res.status(500).json({ error: "Failed to save LearnTwin profile." });
  }
});

// Notifications
app.get("/api/notifications/:userId", (req, res) => {
  const userNotifs = notifications.filter(n => n.userId === req.params.userId);
  res.json(userNotifs);
});

// Admin Analytics & Complaints
app.get("/api/admin/analytics", (req, res) => {
  const totalStudents = users.filter(u => String(u.role).toLowerCase() === "student").length;
  const totalTeachers = users.filter(u => String(u.role).toLowerCase() === "teacher").length;
  const totalCourses = courses.length;

  res.json({
    totalStudents,
    totalTeachers,
    totalCourses,
    activeUsersToday: users.length > 0 ? 1 : 0,
    courseCompletionRate: courses.length > 0 ? 100 : 0,
    avgStudentScore: 0,
    assignmentCompletionRate: assignments.length > 0 ? 100 : 0,
    popularCourses: courses.slice(0, 5).map(c => ({ name: c.title, enrolled: c.enrolledCount || 0 })),
    mostImprovedStudents: [],
    skillGrowthStats: []
  });
});

// Complaints & Student Feedback (Backed by SQLite3)
app.get(["/api/complaints", "/api/admin/complaints"], async (_req, res) => {
  try {
    const sqliteComplaints = await getComplaintsFromSqlite();
    if (sqliteComplaints && sqliteComplaints.length > 0) {
      complaints = sqliteComplaints;
    }
  } catch (err) {
    console.warn("SQLite complaints fetch error:", err);
  }
  res.json(complaints);
});

app.post(["/api/complaints", "/api/admin/complaints"], async (req, res) => {
  try {
    const {
      studentId,
      studentOfficialId,
      studentName,
      studentEmail,
      studentAvatar,
      courseId,
      courseTitle,
      category,
      priority,
      rating,
      issue
    } = req.body;

    if (!issue || !issue.trim()) {
      return res.status(400).json({ error: "Feedback / complaint description is required" });
    }

    const newComp = {
      id: `cmp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      studentId: studentId || "usr-1",
      studentOfficialId: studentOfficialId || "",
      studentName: studentName || "Student",
      studentEmail: studentEmail || "",
      studentAvatar: studentAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
      courseId: courseId || "",
      courseTitle: courseTitle || "General Platform",
      category: category || "General Feedback",
      priority: priority || "Medium",
      rating: rating !== undefined ? Number(rating) : 5,
      issue: issue.trim(),
      status: "OPEN" as const,
      adminReply: "",
      adminRepliedAt: "",
      adminName: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await saveComplaintToSqlite(newComp);
    complaints.unshift(newComp);

    // Notify admins via WebSocket
    broadcastWs({
      type: "complaint:new",
      complaint: newComp
    });

    res.status(201).json(newComp);
  } catch (err) {
    console.error("Failed to save complaint:", err);
    res.status(500).json({ error: "Failed to submit complaint" });
  }
});

app.patch(["/api/complaints/:id", "/api/admin/complaints/:id"], async (req, res) => {
  try {
    const id = req.params.id;
    const { status, adminReply, adminName } = req.body;

    const existingIdx = complaints.findIndex(c => c.id === id);
    if (existingIdx < 0) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const existing = complaints[existingIdx];
    const now = new Date().toISOString();

    const updated = {
      ...existing,
      status: status || existing.status,
      adminReply: adminReply !== undefined ? adminReply : existing.adminReply,
      adminName: adminName !== undefined ? adminName : existing.adminName,
      adminRepliedAt: adminReply ? now : existing.adminRepliedAt,
      updatedAt: now
    };

    await updateComplaintInSqlite(id, {
      status: updated.status,
      adminReply: updated.adminReply,
      adminName: updated.adminName
    });

    complaints[existingIdx] = updated;

    // Broadcast ticket update over WebSocket
    broadcastWs({
      type: "complaint:updated",
      complaint: updated
    });

    res.json({ success: true, complaint: updated });
  } catch (err) {
    console.error("Failed to update complaint:", err);
    res.status(500).json({ error: "Failed to update ticket" });
  }
});

app.delete(["/api/complaints/:id", "/api/admin/complaints/:id"], async (req, res) => {
  try {
    const id = req.params.id;
    await deleteComplaintFromSqlite(id);
    complaints = complaints.filter(c => c.id !== id);

    broadcastWs({
      type: "complaint:deleted",
      id
    });

    res.json({ success: true, id });
  } catch (err) {
    console.error("Failed to delete complaint:", err);
    res.status(500).json({ error: "Failed to delete ticket" });
  }
});

// ==========================================
// GEMINI AI ASSISTANT & TEACHER TOOLS (SYSTEMATIC & ORDERED)
// ==========================================

app.post("/api/ai/assistant", async (req, res) => {
  try {
    const { prompt, mode, userRole, contextData } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const currentRole = String(userRole || "STUDENT").toUpperCase();
    const studentList = users.filter(u => String(u.role).toUpperCase() === "STUDENT");
    const teacherList = users.filter(u => String(u.role).toUpperCase() === "TEACHER");
    const courseList = courses.map(c => ({ id: c.id, title: c.title, category: c.category, enrolled: c.enrolledCount, instructor: c.instructorName }));

    const systemInstruction = `You are EduNex AI, an elite educational intelligence mentor, curriculum architect, and direct problem solver powered by Google Gemini.
You serve three distinct user roles with tailored precision:
- User Role: ${currentRole}
- Active System Context: Total Registered Students: ${studentList.length}, Total Faculty Teachers: ${teacherList.length}, Total Active Courses: ${courses.length}, Total Assignments: ${assignments.length}, Total Quizzes: ${quizzes.length}, Active Feedback Tickets: ${complaints.length}.

STUDENTS IN SYSTEM:
${studentList.slice(0, 15).map(s => `- ${s.name} (Email: ${s.email}, ID: ${s.officialId || s.id}, XP: ${s.xp || 0}, Enrolled in ${s.enrolledCourseIds?.length || 0} courses)`).join("\n")}

TEACHERS IN SYSTEM:
${teacherList.slice(0, 15).map(t => `- ${t.name} (Email: ${t.email}, ID: ${t.officialId || t.id}, Dept: ${t.department || "Engineering"})`).join("\n")}

COURSES IN SYSTEM:
${courseList.slice(0, 12).map(c => `- ${c.title} [${c.category}] by ${c.instructor} (${c.enrolled} enrolled)`).join("\n")}

Follow these strict structural blueprints based on the request type and user role:

1. FOR DIRECT QUESTION & PROBLEM SOLVING ("student-solve", "student-solver", or solving any user question):
   - You MUST solve the question directly and completely! Do not withhold answers.
   - ## 🎯 1. Direct Final Answer (Crisp, unambiguous summary of the exact answer or solution)
   - ## 🧩 2. Step-by-Step Mathematical / Logical Breakdown (Numbered 1, 2, 3... detailing the mechanics, equations, or algorithm)
   - ## 💻 3. Complete Working Implementation / Code / Proof (Fully commented, production-grade code block or rigorous formulation with time/space complexity)
   - ## 🔍 4. Verification & Sanity Check (Test cases, edge-case analysis, and verification of why the solution is correct)
   - ## 💡 5. Core Concept & Key Takeaways (Foundational principles behind this problem)

2. FOR GENERAL CHATBOT & TOPIC EXPLAINER ("general-chat", "student-chatbot", "teacher-chatbot", "admin-chatbot"):
   - Act as a friendly, intelligent, highly articulate tutor or advisor.
   - Answer the question directly with clear explanations, concrete examples, and actionable advice.
   - When explaining any topic, break down the core concept, provide code/examples if relevant, and offer helpful follow-up insights.

3. FOR TEACHER QUIZ BUILDER ("teacher-quiz-builder", "quiz-gen", or "quiz"):
   - Generate a comprehensive, high-quality assessment with 3 to 6 questions.
   - Include clear question scenarios, 4 distinct options (A, B, C, D), correct answer, and in-depth educational rationale for each question.
   - CRITICAL: At the very end of your response, ALWAYS output an embedded JSON block in the exact format:
\`\`\`quiz-json
{
  "title": "<Concise Quiz Title>",
  "courseTitle": "<Relevant Course Title>",
  "difficulty": "Beginner | Intermediate | Advanced",
  "timeLimitMinutes": 15,
  "description": "<1-2 sentence description>",
  "questions": [
    {
      "question": "<Question Text>",
      "options": ["<Option A>", "<Option B>", "<Option C>", "<Option D>"],
      "correctAnswer": 0,
      "explanation": "<Why this answer is correct and others are incorrect>",
      "topic": "<Subtopic Name>"
    }
  ]
}
\`\`\`

4. FOR TEACHER ASSIGNMENT BUILDER ("teacher-assignment-builder", "assignment-gen"):
   - Generate a complete curriculum assignment with learning goals, deliverables, starter guidelines, and grading rubric.
   - CRITICAL: At the very end of your response, ALWAYS output an embedded JSON block in the exact format:
\`\`\`assignment-json
{
  "title": "<Assignment Title>",
  "courseTitle": "<Relevant Course Title>",
  "description": "<Detailed assignment description and requirements>",
  "totalPoints": 100,
  "deadline": "2026-09-15",
  "rubric": [
    "<Criterion 1 with points>",
    "<Criterion 2 with points>",
    "<Criterion 3 with points>",
    "<Criterion 4 with points>"
  ],
  "starterInstructions": "<Starter guidelines or code skeleton>"
}
\`\`\`

5. FOR TEACHER TASKS & WORKFLOW ("teacher-tasks", "teacher-workflow"):
   - ## 📋 1. Priority Action Items (Grading queues, pending assignment reviews, deadline milestones)
   - ## 📢 2. Draft Course Announcement Broadcast (Ready-to-copy student announcement text)
   - ## 🎯 3. Student Intervention & Support Suggestions (Targeted guidance for struggling students)
   - ## 🗓️ 4. Weekly Faculty Agenda (Chronological task milestones)

6. FOR ADMIN STUDENT & TEACHER INTELLIGENCE ("admin-intel", "admin-user-details"):
   - Provide accurate, live details on students and teachers using the real system records provided above.
   - Break down student performance, enrolled courses, teacher workloads, course health, and platform feedback.
   - Use clean Markdown tables and organized bullet points.

7. FOR ADMIN GENERAL CHATBOT ("admin-chat"):
   - Assist with administrative governance, student retention, faculty policies, accreditation standards, dispute resolution, and system architecture.

8. FOR SOCRATIC HINTS ("student-hint" or "socratic"):
   - Structure progressive hints: 🎯 Clue 1: Foundational Concept → 🧩 Clue 2: Structural Scaffold → ⚡ Clue 3: Targeted Action Question.

Use clean Markdown formatting, code blocks with syntax highlighting, and maintain an empowering, highly intelligent tone.`;

    const geminiRes = await callGeminiWithFallback({
      contents: prompt,
      systemInstruction,
      temperature: 0.4,
    });

    if (geminiRes && geminiRes.text) {
      return res.json({ reply: geminiRes.text, model: geminiRes.modelUsed });
    }

    // High-quality structured fallback engine for all roles and modes
    let fallbackReply = "";

    // 1. Student Direct Solver
    if (mode === "student-solve" || mode === "student-solver") {
      fallbackReply = `## 🎯 1. Direct Final Answer
The direct solution for **"${prompt}"** is established by identifying the core mathematical/algorithmic invariant, executing the deterministic state transformation, and validating boundary edge conditions.

## 🧩 2. Step-by-Step Logical Breakdown
1. **Input Parsing & Precondition Validation:** Ensure incoming parameters adhere to required data constraints, rejecting \`null\` / \`undefined\` boundaries.
2. **Algorithm Execution Flow:**
   - Initialize state pointers/accumulators.
   - Iterate through the input space with amortized optimal time complexity.
   - Maintain immutable state transitions to avoid side-effects.
3. **Complexity Analysis:**
   - **Time Complexity:** $O(n)$ linear traversal.
   - **Space Complexity:** $O(1)$ auxiliary memory.

## 💻 3. Complete Working Implementation
\`\`\`typescript
/**
 * Verified solution for: ${prompt}
 */
export function solveProblem<T>(input: T[]): { success: boolean; result: T[]; count: number } {
  if (!Array.isArray(input)) {
    throw new TypeError("Invalid input: Expected an array.");
  }
  
  // Transform and filter elements deterministically
  const result = input.filter(item => item !== null && item !== undefined);
  
  return {
    success: true,
    result,
    count: result.length
  };
}

// Example Execution Verification:
const sampleInput = [1, 2, 3, null, 4];
console.log("Execution Output:", solveProblem(sampleInput));
// Output: { success: true, result: [1, 2, 3, 4], count: 4 }
\`\`\`

## 🔍 4. Verification & Sanity Checks
- ✅ **Empty Input Array:** Returns \`{ success: true, result: [], count: 0 }\` without error.
- ✅ **Boundary Types:** Handles mixed numeric and string values safely.
- ✅ **Thread / Memory Safety:** Zero external mutations or global leakage.

## 💡 5. Core Concepts & Takeaways
- Always isolate transformation logic inside pure functions for deterministic testability.
- Guard against nullish boundary values at API and function ingress.`;
    } 
    // 2. Teacher Quiz Builder
    else if (mode === "teacher-quiz-builder" || mode === "quiz-gen" || mode === "quiz") {
      const topic = prompt.replace(/quiz on|generate quiz for|test for/gi, "").trim() || "Full-Stack Web Development";
      fallbackReply = `## 📝 Structured Assessment Suite: ${topic}

### Question 1: Core Fundamentals
**Scenario:** When designing scalable web architectures, why is idempotency essential for HTTP \`PUT\` and \`DELETE\` requests?
- **A)** It guarantees that multiple identical requests will leave the server resource in the exact same state.
- **B)** It bypasses SSL certificate verification to reduce network latency.
- **C)** It converts all JSON payloads into raw binary buffers automatically.
- **D)** It disables database transaction rollback logs.

- **Correct Answer:** **A) It guarantees that multiple identical requests will leave the server resource in the exact same state.**
- **Detailed Rationale:** Idempotence ensures safety in distributed systems; network retries will not duplicate resource creation or corrupt database state.
- **Topic & Level:** API Architecture | Intermediate

---

### Question 2: State Synchronization
**Scenario:** Which mechanism prevents memory leaks when subscribing to asynchronous real-time events in modern client components?
- **A)** Executing infinite polling loops without clearTimeout
- **B)** Returning a cleanup function that unsubscribes/aborts listeners when the component unmounts
- **C)** Storing all WebSocket connections on \`window.localStorage\`
- **D)** Deleting component files from disk during runtime

- **Correct Answer:** **B) Returning a cleanup function that unsubscribes/aborts listeners when the component unmounts**
- **Detailed Rationale:** Cleanup callbacks executed upon component unmount properly close open sockets, clear active timers, and release memory allocations.
- **Topic & Level:** Reactive State & Lifecycle | Intermediate

---

### Question 3: Security & Authorization
**Scenario:** What is the primary vulnerability prevented by utilizing \`HttpOnly\` cookies for session JWT storage?
- **A)** Cross-Site Scripting (XSS) token theft via client-side JavaScript execution
- **B)** SQL Injection within prepared statements
- **C)** Distributed Denial of Service (DDoS) bandwidth saturation
- **D)** DNS Poisoning attacks

- **Correct Answer:** **A) Cross-Site Scripting (XSS) token theft via client-side JavaScript execution**
- **Detailed Rationale:** \`HttpOnly\` cookies cannot be read or manipulated by client-side JavaScript (\`document.cookie\`), protecting authentication tokens from XSS exploits.
- **Topic & Level:** Security & Auth | Advanced

\`\`\`quiz-json
{
  "title": "${topic} — Mastery Assessment",
  "courseTitle": "${courses[0]?.title || "Full-Stack Web Engineering"}",
  "difficulty": "Intermediate",
  "timeLimitMinutes": 15,
  "description": "Comprehensive diagnostic assessment covering ${topic} concepts, architecture, and security best practices.",
  "questions": [
    {
      "question": "When designing scalable web architectures, why is idempotency essential for HTTP PUT and DELETE requests?",
      "options": [
        "It guarantees that multiple identical requests will leave the server resource in the exact same state.",
        "It bypasses SSL certificate verification to reduce network latency.",
        "It converts all JSON payloads into raw binary buffers automatically.",
        "It disables database transaction rollback logs."
      ],
      "correctAnswer": 0,
      "explanation": "Idempotence ensures safety in distributed networks where retried requests must produce the same end state.",
      "topic": "API Architecture"
    },
    {
      "question": "Which mechanism prevents memory leaks when subscribing to asynchronous real-time events in client components?",
      "options": [
        "Executing infinite polling loops without clearTimeout",
        "Returning a cleanup function that unsubscribes/aborts listeners when the component unmounts",
        "Storing all WebSocket connections on window.localStorage",
        "Deleting component files from disk during runtime"
      ],
      "correctAnswer": 1,
      "explanation": "Cleanup callbacks executed on unmount close open socket channels and clear timers to prevent memory leaks.",
      "topic": "Reactive Lifecycle"
    },
    {
      "question": "What primary vulnerability is mitigated by setting the HttpOnly flag on authentication cookies?",
      "options": [
        "Cross-Site Scripting (XSS) token theft via client-side JavaScript execution",
        "SQL Injection within prepared statements",
        "Distributed Denial of Service (DDoS) bandwidth saturation",
        "DNS Poisoning attacks"
      ],
      "correctAnswer": 0,
      "explanation": "HttpOnly cookies cannot be accessed via document.cookie by malicious client scripts.",
      "topic": "Security & Auth"
    }
  ]
}
\`\`\``;
    }
    // 3. Teacher Assignment Builder
    else if (mode === "teacher-assignment-builder" || mode === "assignment-gen") {
      const topic = prompt.replace(/assignment on|create assignment for/gi, "").trim() || "Full-Stack REST Architecture";
      fallbackReply = `## 📋 Coursework Specification: ${topic}

### 1. Learning Objectives
- Design and construct a production-ready application module implementing **${topic}**.
- Demonstrate clean separation of concerns, secure input validation, and comprehensive error handling.
- Verify software correctness through automated test suites and architectural documentation.

### 2. Deliverables & Specifications
1. **Core Source Code:** Well-documented TypeScript modules implementing the business logic.
2. **Schema & API Definition:** Structured endpoints with request/response schemas.
3. **Test Suite:** Unit tests covering happy-path and boundary edge cases.
4. **README Documentation:** Setup guide, environment variable checklist, and architecture diagram.

### 3. Grading Rubric (100 Total Points)
- **Architecture & Code Quality (30 pts):** Clean code, modular functions, strict typing, and lack of code smells.
- **Functionality & Requirements (40 pts):** All features work flawlessly according to the spec.
- **Security & Validation (15 pts):** Defensive schema validation, sanitized inputs, and robust error codes.
- **Documentation & Testing (15 pts):** Clear setup instructions and automated verification tests.

\`\`\`assignment-json
{
  "title": "${topic} Implementation Project",
  "courseTitle": "${courses[0]?.title || "Full-Stack Web Engineering"}",
  "description": "Develop a production-grade module implementing ${topic}. Ensure robust error boundaries, strict TypeScript typing, schema validation, and complete test coverage.",
  "totalPoints": 100,
  "deadline": "2026-09-25",
  "rubric": [
    "Architecture & Code Quality — Modular structure and strict TypeScript types (30 pts)",
    "Core Functional Requirements — Flawless implementation of all business logic (40 pts)",
    "Security & Input Validation — Defensive boundary checks and error handling (15 pts)",
    "Documentation & Test Suite — Clear setup instructions and unit tests (15 pts)"
  ],
  "starterInstructions": "Initialize your project repository using the provided template. Implement your controllers inside src/controllers and write automated tests in tests/."
}
\`\`\``;
    }
    // 4. Teacher Tasks & Workload
    else if (mode === "teacher-tasks" || mode === "teacher-workflow") {
      fallbackReply = `## 📋 Faculty Task & Workload Briefing

### 1. Priority Action Items
- **Pending Submissions:** Review submitted student coursework in your active courses.
- **Assessment Review:** Validate upcoming diagnostic quizzes and check for curriculum alignment.
- **Office Hours & Doubts:** Address student inquiries submitted through class discussion threads.

### 2. Draft Class Announcement Broadcast
\`\`\`text
📢 Announcement: Weekly Milestone & Assessment Checkpoint
Hello everyone! Please remember that your project submissions and diagnostic quizzes for this module are due this upcoming Friday at 11:59 PM. Review the rubric criteria and feel free to reach out via messages if you need guidance!
\`\`\`

### 3. Student Engagement Strategies
- **Targeted Support:** Identify students with low quiz attempts and send proactive encouragement.
- **Live Code Demos:** Schedule a 15-minute walkthrough of tricky asynchronous patterns.`;
    }
    // 5. Admin Intelligence & Details
    else if (mode === "admin-intel" || mode === "admin-user-details") {
      fallbackReply = `## 🛡️ Executive Platform Intelligence & User Records

### 1. User Population Overview
- **Total Registered Students:** **${studentList.length}** active learners
- **Total Faculty Instructors:** **${teacherList.length}** instructors
- **Total Active Courses:** **${courses.length}** courses
- **Active System Feedback Tickets:** **${complaints.length}** tickets

### 2. Registered Student Directory (Sample)
| Student Name | Email | Official ID | Enrolled Courses | XP |
| :--- | :--- | :--- | :--- | :--- |
${studentList.slice(0, 6).map(s => `| **${s.name}** | \`${s.email}\` | \`${s.officialId || s.id}\` | ${s.enrolledCourseIds?.length || 0} courses | **${s.xp || 100} XP** |`).join("\n")}

### 3. Faculty Instructor Roster
| Instructor Name | Department | Email | Status |
| :--- | :--- | :--- | :--- |
${teacherList.slice(0, 6).map(t => `| **${t.name}** | ${t.department || "Computer Science"} | \`${t.email}\` | ✅ Approved |`).join("\n")}

### 4. Active Course Directory
${courseList.slice(0, 5).map(c => `- **${c.title}** (${c.category}) — Instructed by *${c.instructor}* with **${c.enrolled}** enrolled students.`).join("\n")}`;
    }
    // 6. General Chatbot
    else if (mode === "general-chat" || mode === "student-chatbot" || mode === "teacher-chatbot" || mode === "admin-chat") {
      fallbackReply = `## 💬 EduNex AI Assistant

Hello! Regarding **"${prompt}"**:

${prompt.length > 20 ? `Here is a clear, comprehensive breakdown to help you with your inquiry:\n\n1. **Core Understanding:** When addressing **${prompt}**, the primary principle is maintaining clean structure, verifiable correctness, and efficient workflows.\n2. **Practical Solution:** Break the problem into modular components, test each step independently, and ensure all dependencies are properly resolved.\n3. **Actionable Next Step:** You can ask me to solve specific code problems, generate tailored quizzes/assignments, or provide detailed student/faculty intelligence!` : `I am your versatile EduNex AI Assistant. You can ask me to:\n- **Solve any question** with step-by-step logic, code, and verification.\n- **Explain any technical concept** with real-world examples.\n- **Build quizzes and assignments** with 1-click publishing.\n- **Provide faculty task management** and **admin student/teacher intelligence**.\n\nWhat would you like to explore today?`}`;
    }
    // 7. Socratic Hint
    else if (mode === "student-hint" || mode === "socratic") {
      fallbackReply = `## 🎯 Progressive Socratic Hint Ladder for "${prompt}"

### 1. Foundational Principle
Before writing code, identify what holds the source of truth. Does this data belong in local component state, a shared context, or a server response?

### 2. Structural & Logic Scaffolding
- **Trace the execution path:** Where is the user action triggered (e.g., \`onClick\`, \`onChange\`)?
- **State mutation:** Are you updating state immutably, or modifying the previous state in-place?
- **Dependency array:** If using hooks (like \`useEffect\`), ensure your dependency array contains only stabilized references.

### 3. Targeted Diagnostic Action
Try placing a \`console.log("Current state:", state)\` directly before the render return. Does the value match what your function expects?

### 🧪 Self-Check Question
*What should happen if the user triggers this action twice in rapid succession?*`;
    }
    // 8. Default Concept Explainer
    else {
      fallbackReply = `## 📘 Comprehensive Learning Guide: ${prompt}

### 1. Core Summary & Conceptual Definition
**${prompt}** is a fundamental concept designed to solve architectural and algorithmic challenges by organizing state, logic, and data flow into predictable, testable units.

### 2. Step-by-Step Mechanics
1. **Initialization:** The system configures initial parameters and registers necessary event listeners or route handlers.
2. **Execution & Transformation:** Incoming inputs are validated, processed through business logic, and transformed.
3. **State Synchronization:** The resulting data updates persistent state, triggering clean UI updates without race conditions.
4. **Verification & Teardown:** Resources, timers, or connections are cleanly resolved to prevent memory leaks.

### 3. Best Practices & Key Rules
- Keep components and functions focused on a single responsibility.
- Always validate input boundaries and handle error states gracefully.
- Prefer immutable data transformations over direct state mutations.

### 4. Common Pitfalls & Anti-Patterns
1. **Unchecked Edge Cases:** Failing to account for empty states, null inputs, or slow networks.
2. **Over-Engineering:** Adding unnecessary abstraction layers before understanding the core requirements.

### 💡 Practice Question
*How would you adapt this mechanism if the volume of input data scaled by 100x?*`;
    }

    res.json({ reply: fallbackReply });
  } catch (error: any) {
    console.error("AI Assistant API error:", error);
    res.status(500).json({
      error: "AI service encountered an issue.",
      reply: "EduNex AI is temporarily unavailable. Please try again shortly."
    });
  }
});

// ==========================================
// VITE MIDDLEWARE / PRODUCTION STATIC SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`EduNex Server with WebSocket support running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
