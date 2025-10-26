// backend/video-server.js
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*', methods: ['GET', 'POST'] }});

app.use(cors());

io.on('connection', (socket) => {
  console.log('Video socket connected:', socket.id);

  socket.on('join-room', (roomID) => {
    console.log(`${socket.id} joining video room ${roomID}`);
    socket.join(roomID);

    // List all users except sender
    const clientsSet = io.sockets.adapter.rooms.get(roomID) || new Set();
    const clients = Array.from(clientsSet).filter(id => id !== socket.id);
    socket.emit('all-users', clients);

    // Notify others in the room
    socket.to(roomID).emit('user-joined', socket.id);

    socket.on('offer', (payload) => {
      io.to(payload.target).emit('offer', { sdp: payload.sdp, caller: socket.id });
    });

    socket.on('answer', (payload) => {
      io.to(payload.target).emit('answer', { sdp: payload.sdp, caller: socket.id });
    });

    socket.on('ice-candidate', (payload) => {
      io.to(payload.target).emit('ice-candidate', { candidate: payload.candidate, from: socket.id });
    });

    socket.on('disconnect', () => {
      console.log('Video socket disconnected:', socket.id);
      socket.to(roomID).emit('user-left', socket.id);
    });
  });
});

const PORT = process.env.VIDEO_PORT || 5055;
httpServer.listen(PORT, () =>
  console.log(`> Video signaling server listening on http://localhost:${PORT}`)
);
