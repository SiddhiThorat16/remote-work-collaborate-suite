io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });

  // Relay WebRTC signals
  socket.on("signal", ({ roomId, signal, userId }) => {
    socket.to(roomId).emit("signal", { signal, userId });
  });
});
