require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const principalRoutes = require("./routes/principalRoutes");
const classInchargeRoutes = require("./routes/classInchargeRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

// ── Socket.IO Setup ──────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: "https://school-class-management.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Attach io to app so controllers can access it
app.set("io", io);

// Socket.IO auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("No token provided"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_jwt_secret");
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

// Socket connection handler
io.on("connection", (socket) => {
  // Teacher joins their personal room using their userId
  socket.join(`user_${socket.userId}`);
  console.log(`Socket connected: user_${socket.userId} (${socket.userRole})`);

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: user_${socket.userId}`);
  });
});

// Connect Database
connectDB();

// Middleware
app.use(cors({
  origin: "https://school-class-management.vercel.app",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/principal", principalRoutes);
app.use("/api/class-incharge", classInchargeRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/complaints", complaintRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/academic", require("./routes/academicRoutes"));

// Health Check
app.get("/", (req, res) => {
  res.send(
    "School Academic Performance & Test Management System API is running..."
  );
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found - ${req.originalUrl}`,
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});