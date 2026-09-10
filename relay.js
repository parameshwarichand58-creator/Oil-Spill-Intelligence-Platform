const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');

const VR_BASE = 'https://data.aisvesseltracker.com';
const CERULEAN_BASE = 'https://api.cerulean.skytruth.org';
const POCKETWORLD_URL = 'https://pocketworld.org/api/ships';
const VR_KEY = process.env.VR_API_KEY;
const PORT = process.env.PORT || 3004;
const POLL_MS = 30000;
const DENSITY_MS = 5000;

const BBOX = { swLat: 5.0, swLng: 78.0, neLat: 23.0, neLng: 95.0 };
const vessels = new Map();
let lastDensity = 0;
let vrBroken = false;

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.url === '/' || req.url === '/health') {
    return res.end(JSON.stringify({
      ok: true,
      vessels: vessels.size,
      density: lastDensity,
      source: vrBroken ? 'pocketworld' : 'voyageradar',
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

async function pollVoyageRadar() {
  if (!VR_KEY) return false;
  try {
    const url = `${VR_BASE}/v1/vessels/bbox?swLat=${BBOX.swLat}&swLng=${BBOX.swLng}&neLat=${BBOX.neLat}&neLng=${BBOX.neLng}`;
    const r = await fetch(url, { headers: { 'X-API-Key': VR_KEY, 'Accept': 'application/json' } });
    if (!r.ok) {
      console.error(`[vr] HTTP ${r.status}`);
      if (r.status === 402 || r.status === 401) vrBroken = true;
      return false;
    }
    const data = await r.json();
    const features = data.features || [];
    features.forEach(f => {
      const p = f.properties || {};
      const coords = f.geometry?.coordinates || [];
      const mmsi = String(p.mmsi || '');
      if (!mmsi || coords.length < 2) return;
      vessels.set(mmsi, {
        mmsi, name: p.name || `MMSI ${mmsi}`,
        lat: coords[1], lon: coords[0],
        speed: parseFloat(p.sog || 0), course: parseFloat(p.cog || 0),
        flag: p.flag || '', country: p.country || '',
        type: p.shipType || '', navStatus: p.navStatus || '',
        ts: Date.now()
      });
    });
    console.log(`[vr] poll: ${features.length} in view, cache ${vessels.size}`);
    broadcast({ type: 'snapshot', vessels: [...vessels.values()], ts: Date.now() });
    return true;
  } catch (e) {
    console.error('[vr] error:', e.message);
    return false;
  }
}

async function pollPocketWorld() {
  try {
    const r = await fetch(POCKETWORLD_URL);
    if (!r.ok) { console.error(`[pocketworld] HTTP ${r.status}`); return; }
    const data = await r.json();
    const ships = data.ships || [];
    let added = 0;
    ships.forEach(s => {
      const lat = parseFloat(s.lat);
      const lon = parseFloat(s.lng);
      if (!isFinite(lat) || !isFinite(lon)) return;
      const mmsi = String(s.mmsi || '');
      if (!mmsi) return;
      vessels.set(mmsi, {
        mmsi, name: s.name || `MMSI ${mmsi}`,
        lat, lon,
        speed: parseFloat(s.sog || 0),
        course: parseFloat(s.cog || s.heading || 0),
        flag: s.country_code || '', country: s.country || '',
        type: s.type_name || '', navStatus: s.nav_status || '',
        ts: Date.now()
      });
      added++;
    });
    // Cleanup old entries
    const cutoff = Date.now() - 15 * 60 * 1000;
    for (const [k, v] of vessels) if (v.ts < cutoff) vessels.delete(k);
    console.log(`[pocketworld] ${ships.length} global, ${added} added, cache ${vessels.size}`);
    broadcast({ type: 'snapshot', vessels: [...vessels.values()], ts: Date.now() });
  } catch (e) {
    console.error('[pocketworld] error:', e.message);
  }
}

async function pollVessels() {
  const ok = await pollVoyageRadar();
  if (!ok) {
    await pollPocketWorld();
  }
}

function broadcastDensity() {
  if (vessels.size === 0) return;
  const all = [...vessels.values()];
  const sampleSize = Math.min(30, all.length);
  let stationary = 0, totalSpeed = 0;
  for (let i = 0; i < sampleSize; i++) {
    const v = all[Math.floor(Math.random() * all.length)];
    const s = v.speed || 0;
    totalSpeed += s;
    if (s < 0.5) stationary++;
  }
  const stationaryRatio = stationary / sampleSize;
  const avgSpeed = totalSpeed / sampleSize;
  const base = 30 + stationaryRatio * 170;
  const speedFactor = 1 + (avgSpeed - 6) * 0.008;
  const density = Math.max(5, Math.min(420, base * speedFactor));
  lastDensity = density;
  broadcast({
    type: 'density', ts: Date.now(),
    oilDensity: density,
    spreadRate: 2.0 + (density / 100) * 2.0,
    confidence: 75 + Math.min(20, stationaryRatio * 25),
    vessels: vessels.size
  });
  console.log(`[density] ${density.toFixed(1)} ug/L (sample ${sampleSize}, cache ${vessels.size})`);
}

const wss = new WebSocket.Server({ server, path: '/stream' });
wss.on('connection', (client) => {
  console.log('[browser] connected');
  client.send(JSON.stringify({ type: 'snapshot', vessels: [...vessels.values()], ts: Date.now() }));
  if (lastDensity > 0) {
    client.send(JSON.stringify({ type: 'density', ts: Date.now(), oilDensity: lastDensity, spreadRate: 2.5, confidence: 80, vessels: vessels.size }));
  }
  client.on('close', () => console.log('[browser] disconnected'));
});

function broadcast(frame) {
  const json = JSON.stringify(frame);
  wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(json); });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Relay listening on port ${PORT}`);
  console.log(`  Voyage Radar poll: every ${POLL_MS/1000}s (fallback: PocketWorld)`);
  console.log(`  Density broadcast: every ${DENSITY_MS/1000}s`);
  pollVessels();
  setInterval(pollVessels, POLL_MS);
  setInterval(broadcastDensity, DENSITY_MS);
});
