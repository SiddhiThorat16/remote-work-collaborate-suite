// frontend/remote-work-collaborate-suite/src/api.js
import { supabase } from "./supabaseClient";

// ------------------- Boards -------------------

// Fetch all boards for a workspace using human_id
export async function getBoards(workspaceHumanId) {
  const { data, error } = await supabase
    .from("boards")
    .select("*")
    .eq("workspace_human_id", workspaceHumanId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

// Create a new board
export async function createBoard(workspaceId, title) {
  const { data, error } = await supabase
    .from("boards")
    .insert([{ workspace_id: workspaceId, name: title }])
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Update board
export async function updateBoard(boardId, title) {
  const { data, error } = await supabase
    .from("boards")
    .update({ name: title })
    .eq("id", boardId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Delete board
export async function deleteBoard(boardId) {
  const { data, error } = await supabase
    .from("boards")
    .delete()
    .eq("id", boardId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ------------------- Lists & Tasks -------------------

// Fetch lists with tasks for a board
export async function getBoardData(boardId) {
  const { data: lists, error } = await supabase
    .from("lists")
    .select("*, board_tasks(*)")
    .eq("board_id", boardId)
    .order("position", { ascending: true });

  if (error) throw error;
  return lists;
}

// Add a new task
export async function addTask(listId, title, position) {
  const { data, error } = await supabase
    .from("board_tasks")
    .insert([{ list_id: listId, title, position }])
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Update a task
export async function updateTask(taskId, updates) {
  const { data, error } = await supabase
    .from("board_tasks")
    .update(updates)
    .eq("id", taskId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Delete a task
export async function deleteTask(taskId) {
  const { data, error } = await supabase
    .from("board_tasks")
    .delete()
    .eq("id", taskId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ------------------- User Settings -------------------

// Get user settings
export async function getUserSettings(userId) {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data;
}

// Update user settings
export async function updateUserSettings(userId, settings) {
  const { data, error } = await supabase
    .from("user_settings")
    .upsert({
      user_id: userId,
      theme: settings.theme,
      notifications_enabled: settings.notifications,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update user password
export async function updateUserPassword(newPassword) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) throw error;
  return true;
}

// Update user email
export async function updateUserEmail(newEmail) {
  const { error } = await supabase.auth.updateUser({
    email: newEmail
  });

  if (error) throw error;
  return true;
}

// ✅ Default export
const api = {
  getBoards,
  createBoard,
  updateBoard,
  deleteBoard,
  getBoardData,
  addTask,
  updateTask,
  deleteTask,
  getUserSettings,
  updateUserSettings,
  updateUserPassword,
  updateUserEmail,
};

export default api;
