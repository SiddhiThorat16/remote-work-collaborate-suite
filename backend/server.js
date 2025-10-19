// backend/server.js
import { supabase } from './supabaseClient.js';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.js';
import workspacesRouter from './routes/workspaces.js';
import messagesRouter from './routes/messages.js';
import privateMessagesRouter from './routes/privateMessages.js';
import callRouter from './routes/call.js';
import listsRouter from "./routes/lists.js";
import tasksRouter from "./routes/tasks.js";

dotenv.config(); // Load environment variables

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // frontend URL
  credentials: true,
}));
app.use(bodyParser.json());

// ------------------- Routes ------------------- //
// Auth routes
app.use('/api/auth', authRoutes);

// Workspace routes
app.use('/api/workspaces', workspacesRouter);

// Messages routes
app.use('/api/messages', messagesRouter);
app.use('/api/private-messages', privateMessagesRouter);

// Video call routes
app.use('/api/call', callRouter);

// Test route
app.get('/', (req, res) => {
  res.send('Supabase backend is running!');
});

// ------------------- HTTP & Socket.io ------------------- //
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Make io accessible in routes
app.set('io', io);

// Socket.io events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join workspace chat room
  socket.on('joinWorkspace', (workspaceId) => {
    socket.join(workspaceId);
    console.log(`User ${socket.id} joined workspace ${workspaceId}`);
  });

  // Join private chat
  socket.on('joinPrivateChat', (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined private chat ${chatId}`);
  });

  // Leave private chat
  socket.on('leavePrivateChat', (chatId) => {
    socket.leave(chatId);
    console.log(`User ${socket.id} left private chat ${chatId}`);
  });

  // Send private message
  socket.on('sendPrivateMessage', async (message) => {
    try {
      const { chat_id, sender_id, content } = message;
      const { data, error } = await supabase
        .from('PrivateMessages')
        .insert([{ chat_id, sender_id, content }])
        .select('*, sender:sender_id(human_id, name)');

      if (error) {
        console.error('Failed to save private message:', error);
        return;
      }
      io.to(chat_id).emit('receivePrivateMessage', data[0]);
    } catch (err) {
      console.error('Socket private message save error:', err);
    }
  });

  // WebRTC Video Call
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    console.log(`User ${userId} joined video call room ${roomId}`);

    socket.to(roomId).emit('user-connected', userId);

    socket.on('signal', ({ userId: targetUserId, signal }) => {
      io.to(targetUserId).emit('signal', { userId: socket.id, signal });
    });

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId);
      console.log(`User ${userId} disconnected from room ${roomId}`);
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

  app.use("/api/lists", listsRouter);
app.use("/api/tasks", tasksRouter);



// ------------------- Start server ------------------- //
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
