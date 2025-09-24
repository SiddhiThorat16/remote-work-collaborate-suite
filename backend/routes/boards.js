// backend/routes/boards.js
import express from 'express';
import { supabase } from '../supabaseClient.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * Helper to generate human-readable ID
 */
const generateHumanId = () => crypto.randomUUID(); // simple UUID for now

/**
 * GET /api/boards/workspace/:workspaceId
 * Returns boards -> lists -> tasks for a workspace
 */
router.get('/workspace/:workspaceId', authMiddleware, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    if (!workspaceId) return res.status(400).json({ error: 'workspaceId required' });

    const { data: boards = [], error: bErr } = await supabase
      .from('boards')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true });
    if (bErr) throw bErr;

    const boardsWithChildren = [];
    for (const board of boards) {
      const { data: lists = [], error: lErr } = await supabase
        .from('lists')
        .select('*')
        .eq('board_id', board.id)
        .order('position', { ascending: true });
      if (lErr) throw lErr;

      for (const list of lists) {
        const { data: tasks = [], error: tErr } = await supabase
          .from('board_tasks')
          .select('*')
          .eq('list_id', list.id)
          .order('position', { ascending: true });
        if (tErr) throw tErr;

        list.tasks = tasks;
      }
      board.lists = lists;
      boardsWithChildren.push(board);
    }

    return res.json({ boards: boardsWithChildren });
  } catch (err) {
    console.error('GET boards error', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch boards' });
  }
});

/**
 * POST /api/boards/:boardId/lists
 */
router.post('/:boardId/lists', authMiddleware, async (req, res) => {
  try {
    const { boardId } = req.params;
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });

    const { data: maxPosRes } = await supabase
      .from('lists')
      .select('position')
      .eq('board_id', boardId)
      .order('position', { ascending: false })
      .limit(1);
    const nextPos = (maxPosRes && maxPosRes[0]) ? (maxPosRes[0].position + 1) : 0;

    const human_id = generateHumanId();
    const { data: list, error } = await supabase
      .from('lists')
      .insert([{ board_id: boardId, title, position: nextPos, human_id }])
      .select()
      .maybeSingle();
    if (error) throw error;

    const io = req.app.get('io');
    io?.emit('board_updated', { boardId, type: 'list_created', list });

    return res.json({ list });
  } catch (err) {
    console.error('Create list error', err);
    return res.status(500).json({ error: err.message || 'Failed to create list' });
  }
});

/**
 * POST /api/boards/lists/:listId/tasks
 */
router.post('/lists/:listId/tasks', authMiddleware, async (req, res) => {
  try {
    const { listId } = req.params;
    const { title, description, assigned_to, due_date } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });

    const { data: maxPosRes } = await supabase
      .from('board_tasks')
      .select('position')
      .eq('list_id', listId)
      .order('position', { ascending: false })
      .limit(1);
    const nextPos = (maxPosRes && maxPosRes[0]) ? (maxPosRes[0].position + 1) : 0;

    const human_id = generateHumanId();
    const { data: task, error } = await supabase
      .from('board_tasks')
      .insert([{
        list_id: listId,
        title,
        description: description || null,
        assigned_to: assigned_to || null,
        due_date: due_date || null,
        position: nextPos,
        human_id: `TASK-${uuidv4()}`
      }])
      .select()
      .maybeSingle();
    if (error) throw error;

    const io = req.app.get('io');
    io?.emit('board_updated', { listId, type: 'task_created', task });

    return res.json({ task });
  } catch (err) {
    console.error('Create task error', err);
    return res.status(500).json({ error: err.message || 'Failed to create task' });
  }
});

/**
 * Reorder lists
 */
router.post('/lists/reorder', authMiddleware, async (req, res) => {
  try {
    const { boardId, orderedListIds } = req.body;
    if (!boardId || !Array.isArray(orderedListIds)) return res.status(400).json({ error: 'Missing data' });

    for (let i = 0; i < orderedListIds.length; i++) {
      const id = orderedListIds[i];
      await supabase.from('lists').update({ position: i }).eq('id', id);
    }

    const io = req.app.get('io');
    io?.emit('board_updated', { boardId, type: 'lists_reordered', orderedListIds });

    return res.json({ message: 'Lists reordered' });
  } catch (err) {
    console.error('Reorder lists error', err);
    return res.status(500).json({ error: 'Failed to reorder lists' });
  }
});

/**
 * Reorder tasks
 */
router.post('/tasks/reorder', authMiddleware, async (req, res) => {
  try {
    const { listId, orderedTaskIds } = req.body;
    if (!listId || !Array.isArray(orderedTaskIds)) return res.status(400).json({ error: 'Missing data' });

    for (let i = 0; i < orderedTaskIds.length; i++) {
      await supabase.from('board_tasks').update({ position: i }).eq('id', orderedTaskIds[i]);
    }

    const io = req.app.get('io');
    io?.emit('board_updated', { listId, type: 'tasks_reordered', orderedTaskIds });

    return res.json({ message: 'Tasks reordered' });
  } catch (err) {
    console.error('Reorder tasks error', err);
    return res.status(500).json({ error: 'Failed to reorder tasks' });
  }
});

/**
 * Update / Delete lists
 */
router.put('/lists/:listId', authMiddleware, async (req, res) => {
  try {
    const { listId } = req.params;
    const { title } = req.body;
    const { data, error } = await supabase.from('lists').update({ title }).eq('id', listId).select().maybeSingle();
    if (error) throw error;
    req.app.get('io')?.emit('board_updated', { listId, type: 'list_updated', list: data });
    return res.json({ list: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update list' });
  }
});

router.delete('/lists/:listId', authMiddleware, async (req, res) => {
  try {
    const { listId } = req.params;
    const { data, error } = await supabase.from('lists').delete().eq('id', listId).select().maybeSingle();
    if (error) throw error;
    req.app.get('io')?.emit('board_updated', { listId, type: 'list_deleted' });
    return res.json({ message: 'List deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete list' });
  }
});

/**
 * Update / Delete tasks
 */
router.put('/tasks/:taskId', authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;
    const changes = req.body; // title, description, status, assigned_to, due_date
    const { data, error } = await supabase.from('board_tasks').update(changes).eq('id', taskId).select().maybeSingle();
    if (error) throw error;
    req.app.get('io')?.emit('board_updated', { taskId, type: 'task_updated', task: data });
    return res.json({ task: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.delete('/tasks/:taskId', authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { data, error } = await supabase.from('board_tasks').delete().eq('id', taskId).select().maybeSingle();
    if (error) throw error;
    req.app.get('io')?.emit('board_updated', { taskId, type: 'task_deleted' });
    return res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;


