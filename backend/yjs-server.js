import http from 'http';
import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import { setupWSConnection } from 'y-websocket/bin/utils.js'; // ✅ Correct ESM import
import { supabase } from './supabaseClient.js';
import { Buffer } from 'buffer';
import 'dotenv/config';

const PORT = process.env.YJS_PORT || 1234;

// --- helper to get UUID from human-readable doc name ---
async function getDocumentId(humanId) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('id')
      .eq('human_id', humanId)
      .maybeSingle();

    if (error) {
      console.error(`[yjs] Error looking up document "${humanId}"`, error);
      return null;
    }

    if (!data) {
      console.warn(`[yjs] Document "${humanId}" not found, creating a new UUID`);
      const { data: newDoc, error: insertError } = await supabase
        .from('documents')
        .insert({ human_id: humanId, title: humanId })
        .select('id')
        .maybeSingle();

      if (insertError) {
        console.error('[yjs] Failed to create new document:', insertError);
        return null;
      }

      return newDoc.id;
    }

    return data.id;
  } catch (err) {
    console.error('[yjs] getDocumentId failed:', err);
    return null;
  }
}

// --- persistence functions ---
async function loadSnapshot(docId, ydoc) {
  try {
    const { data, error } = await supabase
      .from('yjs_snapshots')
      .select('snapshot')
      .eq('document_id', docId)
      .maybeSingle();

    if (error) {
      console.error('[yjs] Supabase read error', error);
      return;
    }

    if (data && data.snapshot) {
      const buf = Buffer.from(data.snapshot, 'base64');
      Y.applyUpdate(ydoc, new Uint8Array(buf));
      console.log(`[yjs] Loaded snapshot for ${docId}`);
    }
  } catch (err) {
    console.error('[yjs] Snapshot load failed', err);
  }
}

async function saveSnapshot(docId, ydoc) {
  try {
    const update = Y.encodeStateAsUpdate(ydoc);
    const base64 = Buffer.from(update).toString('base64');
    const { error } = await supabase
      .from('yjs_snapshots')
      .upsert({
        document_id: docId,
        snapshot: base64,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[yjs] Supabase write error', error);
    } else {
      console.log(`[yjs] Saved snapshot for ${docId}`);
    }
  } catch (err) {
    console.error('[yjs] Snapshot save failed', err);
  }
}

// --- HTTP + WebSocket server ---
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Yjs WebSocket server is alive\n');
});

const wss = new WebSocketServer({ server });

wss.on('connection', async (conn, req) => {
  const humanId = req.url.slice(1) || 'default-doc';
  const docId = await getDocumentId(humanId);

  if (!docId) {
    conn.close();
    return;
  }

  const ydoc = new Y.Doc();
  await loadSnapshot(docId, ydoc);

  setupWSConnection(conn, req, {
    docName: docId,
    gc: true,
    onDisconnect: async () => {
      await saveSnapshot(docId, ydoc);
    },
  });
});

server.listen(PORT, () => {
  console.log(`[yjs] Server listening on port ${PORT}`);
});
