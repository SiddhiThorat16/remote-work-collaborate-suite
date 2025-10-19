// frontend/remote-work-collaborate-suite/src/components/NotificationsSidebar.jsx
import React from 'react';

// Sample icons for notification types
const typeIcons = {
  message: "💬",
  invite: "📩",
  mention: "🔔",
  file: "📎",
  task: "✅"
};

// Accepts notifications: [{id, type, text, time, unread}]
const NotificationsSidebar = ({ notifications = [] }) => {
  return (
    <div className="bg-white/90 shadow-lg rounded-xl p-4 min-h-[220px] flex flex-col">
      <h2 className="text-lg font-bold mb-3">Notifications</h2>
      <div className="flex-1 overflow-auto">
        {notifications.length === 0 ? (
          <div className="text-gray-400 text-center py-8">No notifications</div>
        ) : (
          <ul className="space-y-3">
            {notifications.slice(0, 5).map(notif => (
              <li
                key={notif.id}
                className={`flex items-center gap-3 p-2 rounded-lg transition ${
                  notif.read ? "" : "bg-purple-50"
                }`}
              >
                <span className="text-2xl">{typeIcons[notif.type] || "🔔"}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold">
                    {notif.text}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(notif.created_at).toLocaleString()}
                  </div>
                </div>
                {!notif.read && (
                  <span className="inline-block w-2 h-2 bg-purple-400 rounded-full" />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Optional: View all notifications link */}
      <button
        onClick={() => {
          // Example: navigate or trigger callback
          // For now, we just log to console
          console.log("View all notifications clicked");
        }}
        className="mt-4 text-xs text-purple-700 font-semibold hover:underline cursor-pointer select-none"
        disabled={notifications.length === 0}
      >
        View all
      </button>
    </div>
  );
};

export default NotificationsSidebar;