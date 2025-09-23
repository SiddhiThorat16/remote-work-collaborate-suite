// backend/routes/messages.js
import express from "express";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

// Fetch messages for a workspace
router.get("/:workspaceId", async (req, res) => {
  const { workspaceId } = req.params;

  // Fetch messages from supabase
  const { data: messagesData, error } = await supabase
    .from("messages")
    .select("id, content, created_at, sender_id")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) return res.status(400).json({ error: error.message });

  // Map sender_id to human_id
  const messagesWithSender = await Promise.all(
    messagesData.map(async (msg) => {
      if (!msg.sender_id) return { ...msg, sender_name: "Unknown" };

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("human_id")
        .eq("id", msg.sender_id)
        .single();

      return { ...msg, sender_name: userData?.human_id || "Unknown" };
    })
  );

  res.json(messagesWithSender);
});

// Save new message
router.post("/", async (req, res) => {
  const { workspace_id, sender_id, content } = req.body;

  const { data, error } = await supabase
    .from("messages")
    .insert([{ workspace_id, sender_id, content }])
    .select("id, content, created_at, sender_id");

  if (error) return res.status(400).json({ error: error.message });

  // Fetch sender human_id for the inserted message
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("human_id")
    .eq("id", sender_id)
    .single();

  res.json({
    ...data[0],
    sender_name: userData?.human_id || "Unknown",
  });
});

export default router;
