const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');

const VERSION = 'v2-fixed';
const VR_BASE = 'https://data.aisvesseltracker.com';
const CERULEAN_BASE = 'https://api.cerulean.skytruth.org';
const VR_KEY = process.env.VR_API_KEY;
const PORT = process.env.PORT || 3004;
const POLL_MS = 30000;
const BBOX = { swLat: 5.0, swLng: 78.0, neLat: 23.0, neLng: 95.0 };

const vessels = new Map();
let lastDensity = null;

if (!VR_KEY) { console.error('VR_API_KEY missing'); process.exit(1); }

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/' || req.url === '/health') {
    const sample = [...vessels.values()][0];
    return res.end(JSON.stringify({
      ok: true, version: VERSION,
      vessels: vessels.size,
      sampleName: sample ? sample.name : null,
      density: lastDensity,
      uptime: process.uptime()
    }));
  }

  if (req.url.startsWith('/api/cerulean')) {
    try {
      const r = await fetch(`${CERULEAN_BASE}/collections/public.slick/items?bbox=78,10,88,20&limit=50`,
        { headers: { 'Accept': 'application/geo+json, application/json' } });
      return res.end(JSON.stringify(await r.json()));
    } catch (e) { res.statusCode = 502; res.end(JSON.stringify({ error: e.message, features: [] })); }
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'not found' }));
});

async function pollVessels() {
  try {
    const url = `${VR_BASE}/v1/vessels/bbox?swLat=${BBOX.swLat}&swLng=${BBOX.swLng}&neLat=${BBOX.neLat}&neLng=${BBOX.neLng}`;
    const r = await fetch(url, { headers: { 'X-API-Key': VR_KEY, 'Accept': 'application/json' } });
    if (!r.ok) { console.error(`[vr] HTTP ${r.status}`); return; }

    const data = await r.json();
    const features = data.features || [];
    let stationary = 0;

    features.forEach(f => {
      const p = f.properties || {};
      const coords = f.geometry?.coordinates || [];
      const mmsi = String(p.mmsi || '');
      if (!mmsi || coords.length < 2) return;
      const sog = parseFloat(p.sog || 0);
      if (sog < 0.5) stationary++;
      vessels.set(mmsi, {
        mmsi,
        name: p.name || `MMSI ${mmsi}`,
        lat: coords[1], lon: coords[0],
        speed: sog, course: parseFloat(p.cog || 0),
        flag: p.flag || '', country: p.country || '',
        type: p.shipType || '', navStatus: p.navStatus || '',
        ts: Date.now()
      });
    });

    const cutoff = Date.now() - 15 * 60 * 1000;
    for (const [k, v] of vessels) if (v.ts < cutoff) vessels.delete(k);

    lastDensity = 30 + (stationary / Math.max(1, features.length)) * 170;

    console.log(`[vr] ${features.length} in view, cache ${vessels.size}, stationary ${stationary}, density ${lastDensity.toFixed(1)}`);

    broadcast({ type: 'snapshot', vessels: [...vessels.values()], ts: Date.now() });
    broadcast({
      type: 'density', ts: Date.now(),
      oilDensity: lastDensity,
      spreadRate: 2.0 + Math.random() * 1.5,
      confidence: 70 + Math.random() * 20,
      vessels: vessels.size
    });
  } catch (e) { console.error('[vr] error:', e.message); }
}

const wsServer = new WebSocketServer({ server, path: '/stream' });

wsServer.on('connection', (client) => {
  console.log('[browser] connected');
  client.send(JSON.stringify({ type: 'snapshot', vessels: [...vessels.values()], ts: Date.now() }));
  if (lastDensity != null) {
    client.send(JSON.stringify({
      type: 'density', ts: Date.now(),
      oilDensity: lastDensity, spreadRate: 2.5, confidence: 75,
      vessels: vessels.size
    }));
  }
  client.on('close', () => console.log('[browser] disconnected'));
});

function broadcast(frame) {
  const json = JSON.stringify(frame);
  wsServer.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(json); });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Relay ${VERSION} listening on port ${PORT}`);
  pollVessels();
  setInterval(pollVessels, POLL_MS);
});
