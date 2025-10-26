// frontend/remote-work-collaborate-suite/src/pages/Settings.jsx

import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { getUserSettings, updateUserSettings, updateUserPassword, updateUserEmail } from "../api";

export default function Settings() {
  const [theme, setTheme] = useState("light");
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Load settings and subscribe to realtime changes
  useEffect(() => {
    loadUserSettings();
    let subscription;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        subscription = supabase
          .from(`user_settings:user_id=eq.${user.id}`)
          .on("*", () => {
            loadUserSettings();
          })
          .subscribe();
      }
    })();
    return () => {
      if (subscription) supabase.removeSubscription(subscription);
    };
    // eslint-disable-next-line
  }, []);

  // Push theme change to html class
  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    if (theme && theme !== "system") {
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  const loadUserSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const settings = await getUserSettings(user.id);
      if (settings) {
        setTheme(settings.theme || "light");
        setNotifications(settings.notifications_enabled);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      setMessage({ text: "Failed to load settings", type: "error" });
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user logged in");
      await updateUserSettings(user.id, {
        theme,
        notifications,
      });
      setMessage({ text: "Settings saved successfully!", type: "success" });
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ text: "Failed to save settings", type: "error" });
    }
    setLoading(false);
  };

  const handleUpdateEmail = async () => {
    setLoading(true);
    try {
      await updateUserEmail(newEmail);
      setMessage({
        text: "Email updated successfully! Please check your new email for verification.",
        type: "success",
      });
      setShowEmailForm(false);
      setNewEmail("");
    } catch (error) {
      console.error("Error updating email:", error);
      setMessage({ text: "Failed to update email", type: "error" });
    }
    setLoading(false);
  };

  const handleUpdatePassword = async () => {
    setLoading(true);
    try {
      await updateUserPassword(newPassword);
      setMessage({ text: "Password updated successfully!", type: "success" });
      setShowPasswordForm(false);
      setNewPassword("");
    } catch (error) {
      console.error("Error updating password:", error);
      setMessage({ text: "Failed to update password", type: "error" });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto mt-14 p-10 rounded-2xl shadow-xl bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <h2 className="text-3xl font-extrabold mb-7 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600">
        Settings
      </h2>
      {/* Account */}
      {message.text && (
        <div
          className={`mb-4 p-3 rounded ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}
      <div className="mb-8">
        <h3 className="font-bold text-lg mb-2 text-purple-700">
          Account Preferences
        </h3>
        {!showPasswordForm ? (
          <button
            onClick={() => setShowPasswordForm(true)}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-400 to-pink-400 text-white font-semibold shadow mr-6 mt-2"
          >
            Change Password
          </button>
        ) : (
          <div className="mt-2 mb-4">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              className="p-2 rounded-lg border mr-2"
            />
            <button
              onClick={handleUpdatePassword}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-400 to-pink-400 text-white font-semibold shadow"
            >
              {loading ? "Updating..." : "Save Password"}
            </button>
            <button
              onClick={() => setShowPasswordForm(false)}
              className="ml-2 px-4 py-2 rounded-xl bg-gray-200 text-gray-700 font-semibold"
            >
              Cancel
            </button>
          </div>
        )}
        {!showEmailForm ? (
          <button
            onClick={() => setShowEmailForm(true)}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-400 to-purple-400 text-white font-semibold shadow mt-2"
          >
            Update Email
          </button>
        ) : (
          <div className="mt-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="New Email"
              className="p-2 rounded-lg border mr-2"
            />
            <button
              onClick={handleUpdateEmail}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-400 to-purple-400 text-white font-semibold shadow"
            >
              {loading ? "Updating..." : "Save Email"}
            </button>
            <button
              onClick={() => setShowEmailForm(false)}
              className="ml-2 px-4 py-2 rounded-xl bg-gray-200 text-gray-700 font-semibold"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      {/* Interface */}
      <div className="mb-8">
        <h3 className="font-bold text-lg mb-2 text-purple-700">Appearance</h3>
        <label className="font-medium mr-4">
          Theme:
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="ml-2 p-2 rounded-lg border"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </label>
      </div>
      {/* Notifications */}
      <div className="mb-8">
        <h3 className="font-bold text-lg mb-2 text-purple-700">
          Notifications
        </h3>
        <label className="flex items-center font-medium">
          <input
            type="checkbox"
            checked={notifications}
            onChange={(e) => setNotifications(e.target.checked)}
            className="mr-3"
          />
          Enable notifications
        </label>
      </div>
      {/* Save Button */}
      <button
        onClick={handleSaveSettings}
        disabled={loading}
        className="px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 text-white font-bold shadow-lg hover:scale-105 transition mt-5 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
