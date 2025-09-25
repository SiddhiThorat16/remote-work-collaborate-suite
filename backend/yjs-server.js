// backend/yjs-server.js
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import { supabase } from './supabaseClient.js';
import { Buffer } from 'buffer';

// Import setup helpers from y-websocket
import { setupWSConnection, setPersistence } from 'y-websocket/bin/utils.cjs';

const PORT = process.env.YJS_PORT || 1234;

// ------------------------
// Persistence using Supabase
// ------------------------
setPersistence({
  bindState: async (docName, ydoc) => {
    try {
      const { data, error } = await supabase
        .from('yjs_snapshots')
        .select('snapshot')
        .eq('id', docName)       // docName corresponds to snapshot.id
        .maybeSingle();

      if (error) {
        console.error('Supabase bindState read error', error);
        return;
      }

      if (data?.snapshot) {
        const buf = Buffer.from(data.snapshot, 'base64');
        Y.applyUpdate(ydoc, new Uint8Array(buf));
        console.log(`[yjs] Loaded snapshot for ${docName} (${buf.length} bytes)`);
      } else {
        console.log(`[yjs] No snapshot found for ${docName} (new doc)`);
      }
    } catch (e) {
      console.error('bindState exception', e);
    }
  },

  writeState: async (docName, ydoc) => {
    try {
      const update = Y.encodeStateAsUpdate(ydoc);
      const base64 = Buffer.from(update).toString('base64');

      const payload = {
        id: docName,
        snapshot: base64,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('yjs_snapshots')
        .upsert(payload, { returning: 'minimal' });

      if (error) console.error('Supabase writeState upsert error', error);
      else console.log(`[yjs] Wrote snapshot for ${docName} (${update.length} bytes)`);
    } catch (e) {
      console.error('writeState exception', e);
    }
  }
});

// ------------------------
// HTTP + WebSocket server
// ------------------------
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Yjs websocket server alive\n');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (conn, req) => {
  // setupWSConnection handles Yjs protocol (sync + awareness)
  // clients connect to ws://HOST:PORT/<docName>
  setupWSConnection(conn, req);
});

server.listen(PORT, () => {
  console.log(`[yjs] server listening on port ${PORT}`);
  console.log(`[yjs] use ws://<host>:${PORT}/<docName> to connect`);
});
