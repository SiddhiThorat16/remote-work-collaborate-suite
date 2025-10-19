import express from "express";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

/**
 * Find or create a private chat between two users
 */
router.post("/find-or-create", async (req, res) => {
  try {
    const { user1_id, user2_id } = req.body;
    if (!user1_id || !user2_id)
      return res.status(400).json({ error: "Missing user IDs" });

    // Ensure user1_id < user2_id for uniqueness
    const [a, b] = user1_id < user2_id ? [user1_id, user2_id] : [user2_id, user1_id];

    // Try to find existing chat
    let { data: chat, error } = await supabase
      .from("PrivateChats")
      .select("*")
      .eq("user1_id", a)
      .eq("user2_id", b)
      .maybeSingle();

    if (error) throw error;

    // If not found, create one
    if (!chat) {
      const { data: newChat, error: createErr } = await supabase
        .from("PrivateChats")
        .insert([{ user1_id: a, user2_id: b }])
        .select()
        .maybeSingle();

      if (createErr) throw createErr;
      chat = newChat;
    }

    return res.json({ chat });
  } catch (err) {
    console.error("find-or-create error:", err.message || err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

/**
 * Fetch all messages in a private chat
 * Supports optional pagination: ?limit=50&offset=0
 */
router.get("/:chatId/messages", async (req, res) => {
  try {
    const { chatId } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const { data: messages, error } = await supabase
      .from("PrivateMessages")
      .select("*, sender:sender_id(id, human_id, name)")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return res.json(messages || []);
  } catch (err) {
    console.error("get messages error:", err.message || err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

/**
 * Send a message in a private chat + trigger Socket.IO event
 */
router.post("/:chatId/send", async (req, res) => {
  try {
    const { chatId } = req.params;
    const { sender_id, content } = req.body;

    if (!sender_id || !content)
      return res.status(400).json({ error: "Missing sender or content" });

    if (typeof content !== "string" || content.trim() === "")
      return res.status(400).json({ error: "Message content must be a non-empty string" });

    const { data: inserted, error } = await supabase
      .from("PrivateMessages")
      .insert([{ chat_id: chatId, sender_id, content }])
      .select("*, sender:sender_id(id, human_id, name)")
      .maybeSingle();

    if (error) throw error;
    if (!inserted) return res.status(500).json({ error: "Message insertion failed" });

    // Emit message event to clients in the chat room
    const io = req.app.get("io"); // Ensure io is attached in server.js
    io?.to(`private_${chatId}`).emit("receivePrivateMessage", inserted);

    return res.json(inserted);
  } catch (err) {
    console.error("send message error:", err.message || err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;
