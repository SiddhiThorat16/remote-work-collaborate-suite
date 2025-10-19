// backend/routes/tasks.js
import express from "express";
import { supabase } from "../supabaseClient.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();

// Get tasks by list id
router.get("/", authMiddleware, async (req, res) => {
  const { listId } = req.query;
  if (!listId) return res.status(400).json({ error: "listId required" });
  const { data, error } = await supabase.from("board_tasks").select().eq("list_id", listId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ tasks: data });
});

// Create a new task
router.post("/", authMiddleware, async (req, res) => {
  const { list_id, title, description } = req.body;
  if (!title || !list_id) return res.status(400).json({ error: "list_id and title required" });
  const { data, error } = await supabase.from("board_tasks").insert({ list_id, title, description }).single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ task: data });
});

// Update a task
router.put("/:id", authMiddleware, async (req, res) => {
  const id = req.params.id;
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: "Title required" });
  const { data, error } = await supabase.from("board_tasks").update({ title, description }).eq("id", id).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ task: data });
});

// Delete a task
router.delete("/:id", authMiddleware, async (req, res) => {
  const id = req.params.id;
  const { error } = await supabase.from("board_tasks").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;
