import express from "express";
import { supabase } from "../supabaseClient.js";
import { authMiddleware } from '../middleware/authMiddleware.js';
const router = express.Router();

// Get all lists (optionally by workspaceId)
router.get("/", authMiddleware, async (req, res) => {
  const { workspaceId } = req.query;
  let query = supabase.from("lists").select();
  if (workspaceId) query = query.eq("workspace_id", workspaceId);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ lists: data });
});

// Create a new list
router.post("/", authMiddleware, async (req, res) => {
  const { workspace_id, title } = req.body;
  if (!title || !workspace_id) {
    return res.status(400).json({ error: "workspace_id and title required" });
  }
  const { data, error } = await supabase.from("lists").insert({ workspace_id, title }).single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ list: data });
});

// Update a list title
router.put("/:id", authMiddleware, async (req, res) => {
  const id = req.params.id;
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "Title required" });
  const { data, error } = await supabase.from("lists").update({ title }).eq("id", id).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ list: data });
});

// Delete a list
router.delete("/:id", authMiddleware, async (req, res) => {
  const id = req.params.id;
  const { error } = await supabase.from("lists").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;
