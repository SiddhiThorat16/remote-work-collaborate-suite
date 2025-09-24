import { supabase } from "./supabaseClient";

// Fetch all lists with tasks
export async function getBoardData(boardId) {
  const { data: lists, error } = await supabase
    .from("lists")
    .select("*, tasks(*)")
    .eq("board_id", boardId)
    .order("position", { ascending: true });

  if (error) throw error;
  return lists;
}

// Add new task
export async function addTask(listId, content, position) {
  const { data, error } = await supabase
    .from("tasks")
    .insert([{ list_id: listId, content, position }])
    .select();

  if (error) throw error;
  return data[0];
}
