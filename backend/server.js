// backend/server.js
import { supabase } from './supabaseClient.js';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js'; // import signup/login routes
import workspacesRouter from './routes/workspaces.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import messagesRouter from './routes/messages.js';
import boardsRouter from './routes/boards.js';
import callRouter from './routes/call.js';

dotenv.config(); // load .env variables

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Mount auth routes
app.use('/api/auth', authRoutes);

// Workspace routes
app.use('/api/workspaces', workspacesRouter);

// Messages routes ✅
app.use('/api/messages', messagesRouter);

// Test route
app.get('/', (req, res) => {
  res.send('Supabase backend is running!');
});

// Create HTTP server (needed for socket.io)
const httpServer = createServer(app);

// Setup socket.io
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173', // frontend URL
    methods: ['GET', 'POST'],
  },
});

// Make io available to routes via app.get('io')
app.set('io', io);

// --------------------- Socket.io events --------------------- //
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // join workspace chat room
  socket.on('joinWorkspace', (workspaceId) => {
    socket.join(workspaceId);
    console.log(`User ${socket.id} joined workspace ${workspaceId}`);
  });

  // new message
  socket.on('sendMessage', (message) => {
    // broadcast to others in the same workspace
    io.to(message.workspace_id).emit('receiveMessage', message);
  });

  // ---------------- WebRTC Video Call ---------------- //
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    console.log(`User ${userId} joined video call room ${roomId}`);

    // Notify other users in the room
    socket.to(roomId).emit('user-connected', userId);

    // Handle signaling data
    socket.on('signal', ({ userId: targetUserId, signal }) => {
      io.to(targetUserId).emit('signal', { userId: socket.id, signal });
    });

    // Handle disconnect from call
    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId);
      console.log(`User ${userId} disconnected from room ${roomId}`);
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Task Boards routes (mounted after io is set so routes can access req.app.get('io'))
app.use('/api/boards', boardsRouter);

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.use('/api/call', callRouter);
