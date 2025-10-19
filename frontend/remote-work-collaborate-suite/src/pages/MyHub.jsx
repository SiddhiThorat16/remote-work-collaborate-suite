// frontend/remote-work-collaborate-suite/src/pages/MyHub.jsx
import { supabase } from '../supabaseClient'; // Adjust path if needed
import React, { useEffect, useState } from 'react';
import QuickAccessWorkspaces from '../components/QuickAccessWorkspaces';
import NotificationsSidebar from '../components/NotificationsSidebar';
import MiniCalendar from '../components/MiniCalendar';
import axios from 'axios';

const MyHub = ({ user }) => { // Accept user as a prop
  const [recentWorkspaces, setRecentWorkspaces] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  // Mark user online on app load and manage cleanup
  useEffect(() => {
    if (!user || !user.id) return;

    const markOnline = async () => {
      await supabase.from('user_status').upsert({
        user_id: user.id,
        online: true,
        last_seen: new Date().toISOString()
      });
    };

    const markOffline = async () => {
      await supabase.from('user_status').update({ online: false }).eq('user_id', user.id);
    };

    markOnline();

    window.addEventListener('beforeunload', markOffline);

    return () => {
      window.removeEventListener('beforeunload', markOffline);
      markOffline();
    };
  }, [user]);

  const fetchEvents = async () => {
    if (!user) {
      console.log('User not authenticated');
      return;
    }

    const { data: events, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('fetch calendar events error:', error);
    } else {
      setCalendarEvents(events);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('fetch notifications error:', error);
    } else {
      console.log('Notifications fetched:', data);
      setNotifications(data);
    }
  };

  useEffect(() => {
    // run this effect only if user and user.id are available
    if (!user || !user.id) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Fetch recent workspaces
    axios
      .get('http://localhost:5000/api/workspaces/my', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setRecentWorkspaces(res.data.workspaces.slice(0, 3)))
      .catch(err => console.error('fetch recent workspaces error:', err));

    fetchEvents();
    fetchNotifications();

    // Set up real-time subscription for notifications
    const subscription = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log("Realtime notification received:", payload);
          setNotifications(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    // Setup periodic refresh for notifications every 1 minute
    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(subscription);
    };
  }, [user]);

  return (
    <div className="myhub-container flex flex-row gap-6 p-6">
      {/* Main Hub Content */}
      <main className="flex-grow">
        <h1 className="text-3xl font-bold mb-4">My Hub</h1>

        {/* Quick Access Workspace Cards */}
        <section className="mb-8">
          <QuickAccessWorkspaces workspaces={recentWorkspaces} />
        </section>
      </main>

      {/* Sidebar with Notifications and Calendar */}
      <aside className="w-80 flex flex-col gap-6">
        <NotificationsSidebar notifications={notifications} />
        <MiniCalendar
          events={calendarEvents}
          user={user}
          refreshEvents={fetchEvents}
        />
      </aside>
    </div>
  );
};

export default MyHub;
