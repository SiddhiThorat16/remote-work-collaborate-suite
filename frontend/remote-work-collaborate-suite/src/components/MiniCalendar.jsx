import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase } from '../supabaseClient'; // Adjust path if needed

const typeColors = {
  meeting: "bg-blue-400",
  deadline: "bg-pink-400",
  review: "bg-green-400"
};

const MiniCalendar = ({ events = [], user, refreshEvents }) => { // Accept refreshEvents callback
  const [selectedDate, setSelectedDate] = useState(null);
  const [newEvent, setNewEvent] = useState({ type: '', title: '' });

  const eventsForDay = selectedDate
    ? events.filter(ev => new Date(ev.date).toDateString() === selectedDate.toDateString())
    : [];

  const handleAddEvent = async () => {
    if (!selectedDate || !newEvent.title || !newEvent.type || !user) return;
    const eventDate = selectedDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format

    const { error } = await supabase.from('calendar_events').insert([{
      user_id: user.id,
      date: eventDate,
      type: newEvent.type,
      title: newEvent.title
    }]);

    if (!error) {
      setNewEvent({ type: '', title: '' });
      if (refreshEvents) refreshEvents(); // Refetch events after add
    }
  };

  return (
    <div className="bg-white/90 shadow-lg rounded-xl p-4 flex flex-col">
      <h2 className="text-lg font-bold mb-3">My Calendar</h2>
      <Calendar
        onClickDay={date => setSelectedDate(date)}
        tileContent={({ date }) => {
          const todaysEvents = events.filter(ev =>
            new Date(ev.date).toDateString() === date.toDateString()
          );
          return (
            <div className="flex flex-wrap items-center justify-center mt-1">
              {todaysEvents.map((ev, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 mx-0.5 rounded-full ${typeColors[ev.type] || "bg-purple-400"}`}
                  title={ev.type}
                />
              ))}
            </div>
          );
        }}
      />
      {selectedDate && (
        <div className="mt-4">
          <h3 className="font-semibold text-sm mb-2">
            Events on {selectedDate.toLocaleDateString()}:
          </h3>
          {eventsForDay.length > 0 ? (
            <ul className="space-y-1">
              {eventsForDay.map(ev => (
                <li key={ev.id} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${typeColors[ev.type] || "bg-purple-400"}`}></span>
                  <span className="text-xs">{ev.title}</span>
                  <span className="text-xs text-gray-400">({ev.type})</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-xs text-gray-400">No events due.</div>
          )}
          <div className="mt-4 border-t pt-3">
            <input
              type="text"
              placeholder="Title"
              value={newEvent.title}
              onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
              className="border p-1 text-xs rounded mr-2"
              disabled={!user}
            />
            <select
              value={newEvent.type}
              onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
              className="border p-1 text-xs rounded mr-2"
              disabled={!user}
            >
              <option value="">Type</option>
              <option value="meeting">Meeting</option>
              <option value="deadline">Deadline</option>
              <option value="review">Review</option>
            </select>
            <button
              onClick={handleAddEvent}
              className="bg-indigo-500 text-white px-2 py-1 rounded text-xs font-semibold"
              disabled={!user}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniCalendar;
