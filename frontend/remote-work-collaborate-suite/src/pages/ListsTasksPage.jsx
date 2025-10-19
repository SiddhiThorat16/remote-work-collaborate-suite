// frontend/remote-work-collaborate-suite/src/pages/ListsTasksPage.jsx
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import {
  PlusCircle,
  Edit3,
  Trash2,
  List as ListIcon,
  CheckCircle2,
  BookOpen,
} from "lucide-react";

export default function ListsTasksPage({ currentWorkspaceId }) {
  const [lists, setLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newListTitle, setNewListTitle] = useState("");
  const [editingListId, setEditingListId] = useState(null);
  const [editingListTitle, setEditingListTitle] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [editingTaskDesc, setEditingTaskDesc] = useState("");

  useEffect(() => {
    if (!currentWorkspaceId) return;
    fetchLists(currentWorkspaceId);
  }, [currentWorkspaceId]);

 async function fetchLists(workspaceId) {
  if (!workspaceId) {
    console.warn("Invalid workspaceId:", workspaceId);
    return; // Prevent API call if invalid
  }
  const { data, error } = await supabase
    .from("lists")
    .select()
    .eq("workspace_id", workspaceId);
  if (error) {
    console.error("Error fetching lists:", error);
    return;
  }
  if (data) setLists(data);
}

  async function fetchTasks(listId) {
    const { data } = await supabase
      .from("board_tasks")
      .select()
      .eq("list_id", listId);
    if (data) setTasks(data);
  }

async function addList() {
  if (!newListTitle.trim() || !currentWorkspaceId) return;
  const { data, error } = await supabase.from('lists').insert({ title: newListTitle, workspace_id: currentWorkspaceId }).single();
  if (error) {
    alert('Error adding list: ' + error.message);
    return;
  }
  setNewListTitle('');
  fetchLists(currentWorkspaceId);
}

  async function updateList(id) {
    await supabase.from("lists").update({ title: editingListTitle }).eq("id", id);
    setEditingListId(null);
    setEditingListTitle("");
    fetchLists(currentWorkspaceId);
  }

  async function deleteList(id) {
    await supabase.from("lists").delete().eq("id", id);
    setSelectedListId(null);
    fetchLists(currentWorkspaceId);
    setTasks([]);
  }

  async function addTask() {
    if (!newTaskTitle.trim()) return;
    await supabase
      .from("board_tasks")
      .insert({ list_id: selectedListId, title: newTaskTitle, description: newTaskDesc });
    setNewTaskTitle("");
    setNewTaskDesc("");
    fetchTasks(selectedListId);
  }

  async function updateTask(id) {
    await supabase
      .from("board_tasks")
      .update({ title: editingTaskTitle, description: editingTaskDesc })
      .eq("id", id);
    setEditingTaskId(null);
    setEditingTaskTitle("");
    setEditingTaskDesc("");
    fetchTasks(selectedListId);
  }

  async function deleteTask(id) {
    await supabase.from("board_tasks").delete().eq("id", id);
    fetchTasks(selectedListId);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-pink-100 py-16 px-2">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-purple-700 mb-2 flex items-center justify-center gap-2">
            <ListIcon className="w-8 h-8 text-pink-500" />
            Workspace Lists & Tasks
          </h1>
          <p className="text-gray-600 text-lg">
            Organize your collaborative projects and break down tasks with ease.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Lists */}
          <div>
            <div className="bg-white/80 backdrop-blur-md border border-purple-100 shadow-2xl rounded-2xl p-6 relative mb-4">
              <h2 className="text-xl font-bold text-purple-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" /> Your Lists
              </h2>
              <div className="flex gap-2 mb-6">
                <input
                  className="border border-purple-300 px-4 py-2 rounded-lg flex-1 bg-white/80 focus:ring-2 focus:ring-purple-400 transition"
                  placeholder="Create new list..."
                  value={newListTitle}
                  onChange={e => setNewListTitle(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addList()}
                />
                <button
                  className="bg-purple-600 hover:bg-pink-600 text-white font-bold px-4 py-2 rounded-lg shadow-lg transition focus:ring-2 focus:ring-purple-400"
                  onClick={addList}
                  aria-label="Add List"
                >
                  <PlusCircle className="w-6 h-6" />
                </button>
              </div>
              <ul className="space-y-2">
                {lists.length === 0 && (
                  <li className="text-gray-400 italic text-center">No lists yet. Add your first list!</li>
                )}
                {lists.map(list => (
                  <li
                    key={list.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer shadow-sm ${
                      selectedListId === list.id
                        ? "bg-gradient-to-r from-indigo-50 to-pink-50 border-2 border-purple-200"
                        : "hover:bg-gradient-to-r hover:from-indigo-50 hover:to-pink-50"
                    }`}
                  >
                    {editingListId === list.id ? (
                      <>
                        <input
                          className="border px-2 rounded bg-white/70 focus:ring-2 focus:ring-purple-200"
                          value={editingListTitle}
                          onChange={e => setEditingListTitle(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && updateList(list.id)}
                          autoFocus
                        />
                        <button
                          className="p-2 rounded-full bg-green-600 hover:bg-green-500 focus:ring-2 focus:ring-green-400 flex items-center justify-center shadow-lg transition"
                          onClick={() => updateList(list.id)}
                          aria-label="Save"
                        >
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        </button>
                        <button
                          className="px-2 py-1 text-gray-500 font-bold"
                          onClick={() => setEditingListId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span
                          className={`flex-1 font-semibold ${
                            selectedListId === list.id ? "text-purple-800" : ""
                          }`}
                          onClick={() => {
                            setSelectedListId(list.id);
                            fetchTasks(list.id);
                          }}
                        >
                          {list.title}
                        </span>
                        <button
                          className="p-2 rounded-full bg-yellow-500 hover:bg-yellow-400 focus:ring-2 focus:ring-yellow-300 flex items-center justify-center shadow-lg transition"
                          onClick={() => {
                            setEditingListId(list.id);
                            setEditingListTitle(list.title);
                          }}
                          aria-label="Rename"
                        >
                          <Edit3 className="w-6 h-6 text-white" />
                        </button>
                        <button
                          className="p-2 rounded-full bg-red-600 hover:bg-red-500 focus:ring-2 focus:ring-red-400 flex items-center justify-center shadow-lg transition"
                          onClick={() => deleteList(list.id)}
                          aria-label="Delete"
                        >
                          <Trash2 className="w-6 h-6 text-white" />
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {/* Tasks */}
          <div>
            <div className="bg-white/80 backdrop-blur-md border border-pink-100 shadow-2xl rounded-2xl p-6 relative h-full">
              <h2 className="text-xl font-bold mb-4 text-pink-700 flex items-center gap-2">
                <ListIcon className="w-5 h-5 text-purple-400" /> List Tasks
              </h2>
              {!selectedListId && (
                <div className="text-gray-400 text-center mt-10 mb-20">
                  Select a list to view its tasks.
                </div>
              )}
              {selectedListId && (
                <>
                  <div className="flex gap-2 mb-6">
                    <input
                      className="border border-pink-300 px-4 py-2 rounded-lg w-1/2 bg-white/80 focus:ring-2 focus:ring-pink-400 transition"
                      placeholder="Task title"
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addTask()}
                    />
                    <input
                      className="border border-pink-300 px-4 py-2 rounded-lg w-1/2 bg-white/80 focus:ring-2 focus:ring-pink-300 transition"
                      placeholder="Task description"
                      value={newTaskDesc}
                      onChange={e => setNewTaskDesc(e.target.value)}
                    />
                    <button
                      className="bg-pink-600 hover:bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg transition focus:ring-2 focus:ring-pink-400"
                      onClick={addTask}
                      aria-label="Add Task"
                    >
                      <PlusCircle className="w-6 h-6" />
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {tasks.length === 0 && (
                      <li className="text-gray-400 italic text-center">
                        No tasks for this list yet.
                      </li>
                    )}
                    {tasks.map((task) => (
                      <li
                        key={task.id}
                        className="flex items-center gap-3 px-4 py-3 border border-pink-100 rounded-xl bg-white/70 shadow-md"
                      >
                        {editingTaskId === task.id ? (
                          <>
                            <input
                              className="border px-2 py-1 rounded bg-pink-100 text-pink-900 mr-1"
                              value={editingTaskTitle}
                              onChange={(e) => setEditingTaskTitle(e.target.value)}
                              onKeyDown={e => e.key === "Enter" && updateTask(task.id)}
                              autoFocus
                            />
                            <input
                              className="border px-2 py-1 rounded bg-pink-100 text-pink-800"
                              value={editingTaskDesc}
                              onChange={(e) => setEditingTaskDesc(e.target.value)}
                            />
                            <button
                              className="p-2 rounded-full bg-green-600 hover:bg-green-500 focus:ring-2 focus:ring-green-400 flex items-center justify-center shadow-lg transition ml-2"
                              onClick={() => updateTask(task.id)}
                              aria-label="Save"
                            >
                              <CheckCircle2 className="w-6 h-6 text-white" />
                            </button>
                            <button
                              className="px-2 py-1 text-gray-500 font-bold"
                              onClick={() => setEditingTaskId(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 font-semibold">{task.title}</span>
                            <span className="text-gray-500 text-sm">{task.description}</span>
                            <button
                              className="p-2 rounded-full bg-yellow-500 hover:bg-yellow-400 focus:ring-2 focus:ring-yellow-300 flex items-center justify-center shadow-lg transition"
                              onClick={() => {
                                setEditingTaskId(task.id);
                                setEditingTaskTitle(task.title);
                                setEditingTaskDesc(task.description);
                              }}
                              aria-label="Rename"
                            >
                              <Edit3 className="w-6 h-6 text-white" />
                            </button>
                            <button
                              className="p-2 rounded-full bg-red-600 hover:bg-red-500 focus:ring-2 focus:ring-red-400 flex items-center justify-center shadow-lg transition"
                              onClick={() => deleteTask(task.id)}
                              aria-label="Delete"
                            >
                              <Trash2 className="w-6 h-6 text-white" />
                            </button>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
