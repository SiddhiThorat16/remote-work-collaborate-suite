// backend/routes/messages.js
import express from "express";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

// Fetch messages for a workspace
router.get("/:workspaceId", async (req, res) => {
  const { workspaceId } = req.params;

  const { data: messagesData, error } = await supabase
    .from("messages")
    .select("id, content, created_at, sender_id")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) return res.status(400).json({ error: error.message });

  const messagesWithSender = await Promise.all(
    messagesData.map(async (msg) => {
      if (!msg.sender_id) return { ...msg, sender_name: "Unknown" };

      const { data: userData } = await supabase
        .from("users")
        .select("human_id")
        .eq("id", msg.sender_id)
        .single();

      return { ...msg, sender_name: userData?.human_id || "Unknown" };
    })
  );

  res.json(messagesWithSender);
});

// Save new message and generate notifications for other workspace members
router.post("/", async (req, res) => {
  const { workspace_id, sender_id, content } = req.body;

  // Insert the new message
  const { data, error } = await supabase
    .from("messages")
    .insert([{ workspace_id, sender_id, content }])
    .select("id, content, created_at, sender_id");

  if (error) {
    console.error("Message insert error:", error);
    return res.status(400).json({ error: error.message });
  }

  // Fetch sender's human-readable ID
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("human_id")
    .eq("id", sender_id)
    .single();

  if (userError) {
    console.error("Error fetching user data:", userError);
  }

  // Find other members in the workspace except the sender
  const { data: members, error: membersError } = await supabase
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", workspace_id)
    .neq("user_id", sender_id);

  if (membersError) {
    console.error("Error fetching workspace members:", membersError);
  }

  console.log("workspace_id received:", workspace_id);
  console.log("sender_id received:", sender_id);
  console.log("Members found for notify:", members);

  // If members exist, create notifications for them
  if (members && members.length > 0) {
    const notifications = members.map((m) => ({
      user_id: m.user_id,
      workspace_id: workspace_id,
      type: "message",
      text: `${userData?.human_id || "Someone"} sent a new message`,
      created_at: new Date(),
    }));

    const { error: notifError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (notifError) {
      console.error("Notification insert error:", notifError);
    } else {
      console.log("Notifications inserted successfully");
    }
  } else {
    console.log("No other members to notify.");
  }

  res.json({
    ...data[0],
    sender_name: userData?.human_id || "Unknown",
  });
});

export default router;
