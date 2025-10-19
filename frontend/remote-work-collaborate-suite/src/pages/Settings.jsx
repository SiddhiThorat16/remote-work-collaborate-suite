import React, { useState } from "react";

export default function Settings() {
  const [theme, setTheme] = useState("light");
  const [notifications, setNotifications] = useState(true);

  // Add handlers for changing password, updating email, theme, etc.

  return (
    <div className="max-w-2xl mx-auto mt-14 p-10 rounded-2xl shadow-xl bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <h2 className="text-3xl font-extrabold mb-7 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600">Settings</h2>
      
      {/* Account */}
      <div className="mb-8">
        <h3 className="font-bold text-lg mb-2 text-purple-700">Account Preferences</h3>
        <button className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-400 to-pink-400 text-white font-semibold shadow mr-6 mt-2">Change Password</button>
        <button className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-400 to-purple-400 text-white font-semibold shadow mt-2">Update Email</button>
      </div>

      {/* Interface */}
      <div className="mb-8">
        <h3 className="font-bold text-lg mb-2 text-purple-700">Appearance</h3>
        <label className="font-medium mr-4">
          Theme:
          <select value={theme} onChange={e => setTheme(e.target.value)} className="ml-2 p-2 rounded-lg border">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </label>
      </div>

      {/* Notifications */}
      <div className="mb-8">
        <h3 className="font-bold text-lg mb-2 text-purple-700">Notifications</h3>
        <label className="flex items-center font-medium">
          <input type="checkbox" checked={notifications} onChange={e => setNotifications(e.target.checked)} className="mr-3" />
          Enable notifications
        </label>
      </div>

      {/* Save Button */}
      <button className="px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 text-white font-bold shadow-lg hover:scale-105 transition mt-5">
        Save Settings
      </button>
    </div>
  );
}
