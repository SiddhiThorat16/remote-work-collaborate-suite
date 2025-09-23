// backend/routes/workspaces.js
import express from 'express';
import { supabase } from '../supabaseClient.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper: make a readable slug + short random suffix
function generateHumanId(name) {
  const slug = name.trim().toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 30); // limit length
  const rand = Math.floor(1000 + Math.random() * 9000); // 4-digit
  return `${slug}_${rand}`;
}

// POST /api/workspaces/create
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Workspace name is required' });

    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // fetch user's info
    const { data: user, error: uErr } = await supabase
      .from('users')
      .select('id, human_id')
      .eq('id', userId)
      .maybeSingle();
    if (uErr) throw uErr;
    if (!user) return res.status(404).json({ error: 'User not found' });

    // generate unique workspace human_id
    let workspaceHumanId;
    let attempts = 0;
    const maxAttempts = 6;
    while (attempts < maxAttempts) {
      workspaceHumanId = generateHumanId(name);
      const { data: exists, error: exErr } = await supabase
        .from('workspaces')
        .select('id')
        .eq('human_id', workspaceHumanId)
        .maybeSingle();
      if (exErr) throw exErr;
      if (!exists) break;
      attempts++;
    }
    if (attempts >= maxAttempts) return res.status(500).json({ error: 'Failed to generate workspace code; try again' });

    // Insert workspace
    const { data: workspace, error: wErr } = await supabase
      .from('workspaces')
      .insert([{ name, human_id: workspaceHumanId, owner_id: userId }])
      .select()
      .maybeSingle();
    if (wErr) throw wErr;

    // Insert owner into WorkspaceMembers (⚡ removed unique human_id restriction)
    const { data: member, error: mErr } = await supabase
      .from('workspacemembers')
      .insert([{
        workspace_id: workspace.id,
        user_id: user.id,
        // keep user's human_id as reference only
        human_id: user.human_id,
        role: 'owner'
      }])
      .select()
      .maybeSingle();

    if (mErr) {
      await supabase.from('workspaces').delete().eq('id', workspace.id);
      throw mErr;
    }

    return res.json({ message: 'Workspace created', workspace });
  } catch (err) {
    console.error('Create workspace error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST /api/workspaces/join
router.post('/join', authMiddleware, async (req, res) => {
  try {
    const { human_id } = req.body;
    if (!human_id) return res.status(400).json({ error: 'workspace human_id is required' });

    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // find workspace
    const { data: workspace, error: wErr } = await supabase
      .from('workspaces')
      .select('*')
      .eq('human_id', human_id)
      .maybeSingle();
    if (wErr) throw wErr;
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    // fetch user's info
    const { data: user, error: uErr } = await supabase
      .from('users')
      .select('id, human_id')
      .eq('id', userId)
      .maybeSingle();
    if (uErr) throw uErr;
    if (!user) return res.status(404).json({ error: 'User not found' });

    // check if already a member (workspace_id + user_id ensures uniqueness)
    const { data: existing, error: eErr } = await supabase
      .from('workspacemembers')
      .select('id')
      .eq('workspace_id', workspace.id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (eErr) throw eErr;
    if (existing) return res.status(400).json({ error: 'Already a member of this workspace' });

    // Insert member (⚡ multiple memberships allowed now)
    const { data: member, error: mErr } = await supabase
      .from('workspacemembers')
      .insert([{
        workspace_id: workspace.id,
        user_id: user.id,
        human_id: user.human_id,
        role: 'member'
      }])
      .select()
      .maybeSingle();
    if (mErr) throw mErr;

    return res.json({ message: 'Joined workspace', workspace });
  } catch (err) {
    console.error('Join workspace error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET /api/workspaces/my
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { data: members, error: mErr } = await supabase
      .from('workspacemembers')
      .select('workspace_id, role, joined_at')
      .eq('user_id', userId);
    if (mErr) throw mErr;

    const workspaceIds = members.map(m => m.workspace_id);
    if (workspaceIds.length === 0) return res.json({ workspaces: [] });

    const { data: workspaces, error: wErr } = await supabase
      .from('workspaces')
      .select('*')
      .in('id', workspaceIds);
    if (wErr) throw wErr;

    const roleMap = {};
    members.forEach(m => { roleMap[m.workspace_id] = { role: m.role, joined_at: m.joined_at }; });

    const result = workspaces.map(w => ({
      ...w,
      role: roleMap[w.id]?.role || 'member',
      joined_at: roleMap[w.id]?.joined_at || null,
      chatInitiated: w.chat_initiated || false // ⚡ added field
    }));

    return res.json({ workspaces: result });
  } catch (err) {
    console.error('Get my workspaces error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST /api/workspaces/:id/start-chat
router.post('/:id/start-chat', authMiddleware, async (req, res) => {
  try {
    const workspaceId = req.params.id;
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Check if user is owner of workspace
    const { data: member, error: mErr } = await supabase
      .from('workspacemembers')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .maybeSingle();
    if (mErr) throw mErr;
    if (!member || member.role !== 'owner') return res.status(403).json({ error: 'Only owner can start chat' });

    // Update workspace to start chat
    const { data: workspace, error: wErr } = await supabase
      .from('workspaces')
      .update({ chat_initiated: true })
      .eq('id', workspaceId)
      .select()
      .maybeSingle();
    if (wErr) throw wErr;

    return res.json({ message: 'Chat started', workspace });
  } catch (err) {
    console.error('Start chat error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
