// src/pages/BoardPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react'; // icons

const BoardPage = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const { workspaceId } = useParams(); 
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [currentListId, setCurrentListId] = useState(null);
  const [currentBoardId, setCurrentBoardId] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    if (workspaceId) fetchBoards();
  }, [workspaceId]);

  const fetchBoards = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(
        `http://localhost:5000/api/boards/workspace/${workspaceId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBoards(res.data.boards || []);
    } catch (err) {
      console.error('Failed to fetch boards:', err);
      setBoards([]);
    } finally {
      setLoading(false);
    }
  };

  const openTaskModal = (listId, boardId) => {
    setCurrentListId(listId);
    setCurrentBoardId(boardId);
    setNewTaskTitle('');
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `http://localhost:5000/api/boards/lists/${currentListId}/tasks`,
        { title: newTaskTitle.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedBoards = boards.map((b) => {
        if (b.id !== currentBoardId) return b;
        return {
          ...b,
          lists: b.lists.map((l) =>
            l.id === currentListId
              ? { ...l, tasks: [...l.tasks, res.data.task] }
              : l
          ),
        };
      });
      setBoards(updatedBoards);
      setShowTaskModal(false);
    } catch (err) {
      console.error('Failed to add task:', err);
      alert('Failed to add task.');
    }
  };

  const handleAddList = async (boardId) => {
    const title = prompt('Enter list title:');
    if (!title) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `http://localhost:5000/api/boards/${boardId}/lists`,
        { title },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newBoards = boards.map((b) =>
        b.id === boardId ? { ...b, lists: [...b.lists, res.data.list] } : b
      );
      setBoards(newBoards);
    } catch (err) {
      console.error('Failed to add list:', err);
      alert('Failed to add list.');
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId, listId, boardId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/boards/tasks/${taskId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedBoards = boards.map((b) => {
        if (b.id !== boardId) return b;
        return {
          ...b,
          lists: b.lists.map((l) =>
            l.id === listId
              ? { ...l, tasks: l.tasks.filter((t) => t.id !== taskId) }
              : l
          ),
        };
      });
      setBoards(updatedBoards);
    } catch (err) {
      console.error('Failed to delete task:', err);
      alert('Failed to delete task.');
    }
  };

  // Delete List
  const handleDeleteList = async (listId, boardId) => {
    if (!window.confirm('Are you sure you want to delete this list? All its tasks will be removed.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/boards/lists/${listId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedBoards = boards.map((b) => {
        if (b.id !== boardId) return b;
        return {
          ...b,
          lists: b.lists.filter((l) => l.id !== listId),
        };
      });
      setBoards(updatedBoards);
    } catch (err) {
      console.error('Failed to delete list:', err);
      alert('Failed to delete list.');
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination, type } = result;
    if (!destination) return;

    const newBoards = JSON.parse(JSON.stringify(boards));

    try {
      if (type === 'LIST') {
        const boardId = source.droppableId.replace('board-', '');
        const boardIndex = newBoards.findIndex((b) => b.id === boardId);
        const [movedList] = newBoards[boardIndex].lists.splice(source.index, 1);
        newBoards[boardIndex].lists.splice(destination.index, 0, movedList);
        setBoards(newBoards);

        const token = localStorage.getItem('token');
        await axios.post(
          'http://localhost:5000/api/boards/lists/reorder',
          {
            boardId: newBoards[boardIndex].id,
            orderedListIds: newBoards[boardIndex].lists.map((l) => l.id),
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (type === 'TASK') {
        const sourceListId = source.droppableId.replace('list-', '');
        const destinationListId = destination.droppableId.replace('list-', '');
        const sourceBoard = newBoards.find((b) =>
          b.lists.some((l) => l.id === sourceListId)
        );
        const destinationBoard = newBoards.find((b) =>
          b.lists.some((l) => l.id === destinationListId)
        );
        const sourceList = sourceBoard.lists.find((l) => l.id === sourceListId);
        const destinationList = destinationBoard.lists.find(
          (l) => l.id === destinationListId
        );
        const [movedTask] = sourceList.tasks.splice(source.index, 1);
        destinationList.tasks.splice(destination.index, 0, movedTask);
        setBoards(newBoards);

        const token = localStorage.getItem('token');
        await axios.post(
          'http://localhost:5000/api/boards/tasks/reorder',
          {
            listId: destinationList.id,
            orderedTaskIds: destinationList.tasks.map((t) => t.id),
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (err) {
      console.error('Failed to reorder:', err);
      alert('Failed to save new order. Try again.');
      fetchBoards();
    }
  };

  if (loading) return <p className="text-center text-gray-500 mt-10">Loading boards...</p>;
  if (!workspaceId) return <p className="text-center text-red-500 mt-10">Workspace ID not found.</p>;

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <DragDropContext onDragEnd={handleDragEnd}>
        {boards.map((board) => (
          <div key={board.id} className="mb-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold text-gray-800">{board.name}</h2>
              <button
                onClick={() => handleAddList(board.id)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
              >
                <Plus size={18} /> New List
              </button>
            </div>

            <Droppable droppableId={`board-${board.id}`} type="LIST" direction="horizontal">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex space-x-6 overflow-x-auto pb-4"
                >
                  {board.lists.map((list, index) => (
                    <Draggable key={list.id} draggableId={list.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-white shadow-md rounded-xl w-72 flex-shrink-0 border transition-transform duration-200 ${
                            snapshot.isDragging ? 'shadow-2xl scale-105 border-blue-400' : ''
                          }`}
                        >
                          <div className="flex justify-between items-center px-4 py-3 border-b bg-gray-100 rounded-t-xl">
                            <h3 className="font-semibold text-gray-700">{list.title}</h3>
                            <button
                              onClick={() => handleDeleteList(list.id, board.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <Droppable droppableId={`list-${list.id}`} type="TASK">
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`p-3 min-h-[60px] rounded-b-xl transition-colors ${
                                  snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-white'
                                }`}
                              >
                                {list.tasks.map((task, tIndex) => (
                                  <Draggable key={task.id} draggableId={task.id} index={tIndex}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`bg-gray-50 border rounded-lg px-3 py-2 mb-3 shadow-sm cursor-pointer flex justify-between items-center transition-transform duration-150 ${
                                          snapshot.isDragging ? 'shadow-lg scale-105 border-blue-300' : ''
                                        }`}
                                      >
                                        <span className="text-gray-700 text-sm font-medium">{task.title}</span>
                                        <button
                                          onClick={() => handleDeleteTask(task.id, list.id, board.id)}
                                          className="text-red-400 hover:text-red-600"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                                <button
                                  onClick={() => openTaskModal(list.id, board.id)}
                                  className="mt-2 w-full text-left text-blue-600 hover:underline text-sm font-medium"
                                >
                                  + Add Task
                                </button>
                              </div>
                            )}
                          </Droppable>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </DragDropContext>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black-200 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-96 animate-fadeIn">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Add New Task</h2>
            <input
              type="text"
              placeholder="Task title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full border px-3 py-2 rounded-lg mb-4 focus:ring-2 focus:ring-blue-400 outline-none"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowTaskModal(false)}
                className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleTaskSubmit}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardPage;
