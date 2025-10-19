// backend/whiteboard-server.js
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Join workspace-specific room
  socket.on("join-workspace", (workspaceId) => {
    socket.join(workspaceId);
    console.log(`User ${socket.id} joined workspace ${workspaceId}`);
  });

  // Handle drawing events
  socket.on("draw", (data) => {
    // Broadcast to all users in the same workspace except sender
    socket.to(data.workspaceId).emit("draw", data);
  });

  // Handle shape drawing events
  socket.on("draw-shape", (data) => {
    socket.to(data.workspaceId).emit("draw-shape", data);
  });

  // Handle clear events
  socket.on("clear", (data) => {
    socket.to(data.workspaceId).emit("clear", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Whiteboard server running on http://localhost:${PORT}`);
});

  /*
    Siddhi Thorat@DESKTOP-RO6GC9B MINGW64 /c/Labmentix Projects/remote-work-collaborate-suite/backend (main)
    $ node whiteboard-server.js
  */