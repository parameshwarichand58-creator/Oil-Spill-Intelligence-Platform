// relay.js — Voyage Radar AIS poller + Cerulean proxy + WebSocket for dashboard
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');

const VR_BASE       = 'https://data.aisvesseltracker.com';
const CERULEAN_BASE = 'https://api.cerulean.skytruth.org';
const VR_KEY        = process.env.VR_API_KEY;
const PORT          = process.env.PORT || 3004;
const POLL_MS       = 30000;

// Bay of Bengal bounding box
const BBOX = { swLat: 5.0, swLng: 78.0, neLat: 23.0, neLng: 95.0 };

const vessels = new Map();

if (!VR_KEY) {
  console.error('ERROR: VR_API_KEY environment variable is not set.');
  process.exit(1);
}

// ---------- HTTP server ----------
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/' || req.url === '/health') {
    return res.end(JSON.stringify({
      ok: true,
      vessels: vessels.size,
      uptime: process.uptime()
    }));
  }

  if (req.url.startsWith('/api/cerulean')) {
    try {
      const r = await fetch(
        `${CERULEAN_BASE}/collections/public.slick/items?bbox=78,10,88,20&limit=50`,
        { headers: { 'Accept': 'application/geo+json, application/json' } }
      );
      const data = await r.json();
      return res.end(JSON.stringify(data));
    } catch (e) {
      res.statusCode = 502;
      return res.end(JSON.stringify({ error: e.message, features: [] }));
    }
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'not found' }));
});

// ---------- Voyage Radar polling ----------
async function pollVessels() {
  try {
    const url = `${VR_BASE}/v1/vessels/bbox?swLat=${BBOX.swLat}&swLng=${BBOX.swLng}&neLat=${BBOX.neLat}&neLng=${BBOX.neLng}`;
    const r = await fetch(url, {
      headers: { 'X-API-Key': VR_KEY, 'Accept': 'application/json' }
    });

    if (!r.ok) {
      console.error(`[vr] HTTP ${r.status}`);
      return;
    }

    const data = await r.json();
    const features = data.features || [];

    features.forEach(f => {
      const p = f.properties || {};
      const coords = f.geometry?.coordinates || [];
      const mmsi = String(p.id || p.mmsi || '');
      if (!mmsi || coords.length < 2) return;

      vessels.set(mmsi, {
        mmsi,
        name: p.ship_name || `MMSI ${mmsi}`,
        lat: coords[1],
        lon: coords[0],
        speed: parseFloat(p.sog || 0),
        course: parseFloat(p.cog || 0),
        flag: p.flag || '',
        type: p.ship_type || '',
        ts: Date.now()
      });
    });

    const cutoff = Date.now() - 15 * 60 * 1000;
    for (const [k, v] of vessels) if (v.ts < cutoff) vessels.delete(k);

    console.log(`[vr] ${features.length} in view, cache ${vessels.size}`);
    broadcast({ type: 'snapshot', vessels: [...vessels.values()], ts: Date.now() });
  } catch (e) {
    console.error('[vr] error:', e.message);
  }
}

// ---------- Browser WebSocket ----------
const wsServer = new WebSocketServer({ server, path: '/stream' });

wsServer.on('connection', (client) => {
  console.log('[browser] connected');
  client.send(JSON.stringify({
    type: 'snapshot',
    vessels: [...vessels.values()],
    ts: Date.now()
  }));
  client.on('close', () => console.log('[browser] disconnected'));
});

function broadcast(frame) {
  const json = JSON.stringify(frame);
  wsServer.clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) c.send(json);
  });
}

// ---------- Boot ----------
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Relay listening on port ${PORT}`);
  console.log(`  WebSocket : /stream`);
  console.log(`  Cerulean  : /api/cerulean`);
  console.log(`  Polling Voyage Radar every ${POLL_MS / 1000}s`);
  pollVessels();
  setInterval(pollVessels, POLL_MS);
});
