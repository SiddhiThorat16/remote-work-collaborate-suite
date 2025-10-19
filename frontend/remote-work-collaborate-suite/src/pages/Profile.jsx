import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient"; // create this using your API keys


function Profile() {
  const [user, setUser] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", avatar: "" });

  useEffect(() => {
    // Fetch user data from Supabase
    async function fetchUser() {
      const { data: userData } = await supabase.auth.getUser(); // Auth fetch
      setUser(userData?.user);
      setForm({
        name: userData?.user?.user_metadata?.name || "",
        email: userData?.user?.email || "",
        avatar: userData?.user?.user_metadata?.avatar || "",
      });
    }
    fetchUser();
  }, []);

  const handleSave = async () => {
    // Update profile in Supabase
    await supabase.auth.updateUser({
      data: { name: form.name, avatar: form.avatar },
    });
    setEdit(false);
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="max-w-xl mx-auto mt-12 p-8 rounded-2xl shadow bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <h2 className="text-3xl font-extrabold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600">Profile</h2>
      <div className="flex flex-col items-center gap-5">
        <img
          src={form.avatar || "/default-avatar.png"}
          alt="Avatar"
          className="w-28 h-28 rounded-full border-4 border-purple-300 shadow-lg object-cover"
        />
        {edit && (
          <input
            type="text"
            placeholder="Avatar URL"
            value={form.avatar}
            onChange={e => setForm({ ...form, avatar: e.target.value })}
            className="rounded-lg px-3 py-2 border mt-2"
          />
        )}
        <div className="mt-3 flex flex-col items-center gap-1 w-full">
          {edit ? (
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="rounded-lg px-3 py-2 border w-2/3"
            />
          ) : (
            <span className="text-xl font-bold">{form.name}</span>
          )}
          <span className="text-purple-500 font-medium">{form.email}</span>
        </div>
        <div className="mt-6 flex gap-4">
          {!edit ? (
            <button onClick={() => setEdit(true)} className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow hover:scale-105 transition">
              Edit
            </button>
          ) : (
            <button onClick={handleSave} className="px-6 py-2 rounded-xl bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold shadow hover:scale-105 transition">
              Save
            </button>
          )}
          <button className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-400 to-purple-400 text-white font-semibold shadow">
            Change Password
          </button>
        </div>
        <span className="mt-8 text-sm text-gray-500">
          Account created: {new Date(user.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

export default Profile;