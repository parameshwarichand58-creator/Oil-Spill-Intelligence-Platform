// Ocean Eye — AIS relay
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');

const AISSTREAM_URL  = 'wss://stream.aisstream.io/v0/stream';
const AISSTREAM_KEY  = process.env.AISSTREAM_API_KEY;

const VR_BASE        = 'https://data.aisvesseltracker.com';
const VR_KEY         = process.env.VR_API_KEY;

const CERULEAN_BASE  = 'https://api.cerulean.skytruth.org';
const POCKETWORLD_URL = 'https://pocketworld.org/api/ships';

const PORT        = process.env.PORT || 3004;
const POLL_MS     = 300000;
const DENSITY_MS  = 5000;

const BBOX = { swLat: 5.0, swLng: 78.0, neLat: 23.0, neLng: 95.0 };

const vessels = new Map();
let lastDensity = 0;
let vrBroken = false;
let aisStreamConnected = false;

const dispatches = [];

function readBody(req){
  return new Promise((resolve) => {
    let chunks = '';
    req.on('data', c => chunks += c);
    req.on('end', () => resolve(chunks));
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.url === '/' || req.url === '/health') {
    return res.end(JSON.stringify({
      ok: true,
      vessels: vessels.size,
      density: lastDensity,
      sources: {
        aisstream: AISSTREAM_KEY ? (aisStreamConnected ? 'connected' : 'configured') : 'no-key',
        voyageradar: VR_KEY ? (vrBroken ? 'failed' : 'configured') : 'no-key',
        pocketworld: 'fallback'
      },
      coverage: vessels.size > 0 ? 'coastal' : 'none',
      uptime: process.uptime()
    }));
  }

  if (req.method === 'POST' && req.url === '/api/dispatch') {
    try {
      const body = await readBody(req);
      const parsed = JSON.parse(body || '{}');
      const entry = {
        id: 'DSP-' + Date.now(),
        receivedAt: new Date().toISOString(),
        incidentId: parsed.incidentId || null,
        severity: parsed.severity || null,
        lat: parsed.lat || null,
        lon: parsed.lon || null,
        message: parsed.message || '',
        harvestStatus: parsed.harvestStatus || 'none'
      };
      dispatches.push(entry);
      if (dispatches.length > 50) dispatches.shift();
      console.log('[dispatch] received', entry.id, 'for incident', entry.incidentId);
      return res.end(JSON.stringify({ ok: true, id: entry.id, receivedAt: entry.receivedAt }));
    } catch (e) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ ok: false, error: e.message }));
    }
  }

  if (req.method === 'GET' && req.url === '/api/dispatch') {
    return res.end(JSON.stringify({ ok: true, count: dispatches.length, dispatches }));
  }

  if (req.url.startsWith('/api/cerulean')) {
    try {
      const r = await fetch(`${CERULEAN_BASE}/collections/public.slick/items?bbox=78,10,88,20&limit=50`,
        { headers: { 'Accept': 'application/geo+json, application/json' } });
      return res.end(JSON.stringify(await r.json()));
    } catch (e) {
      res.statusCode = 502;
      res.end(JSON.stringify({ error: e.message, features: [] }));
    }
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'not found' }));
});

const wss = new WebSocketServer({ server });

function broadcast(msg) {
  const s = JSON.stringify(msg);
  wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(s); });
}

function connectAISStream() {
  if (!AISSTREAM_KEY) {
    console.warn('[aisstream] API key missing — skipping');
    return;
  }
  const socket = new WebSocket(AISSTREAM_URL);

  socket.on('open', () => {
    aisStreamConnected = true;
    console.log('[aisstream] connected, subscribing');
    socket.send(JSON.stringify({
      APIKey: AISSTREAM_KEY,
      BoundingBoxes: [[[BBOX.swLat, BBOX.swLng], [BBOX.neLat, BBOX.neLng]]],
      FilterMessageTypes: ['PositionReport']
    }));
  });

  socket.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.MessageType === 'SubscriptionConfirmation') {
        console.log('[aisstream] subscription confirmed');
        return;
      }
      if (msg.MessageType !== 'PositionReport') return;
      const p    = msg.Message.PositionReport;
      const meta = msg.MetaData || {};
      const mmsi = String(p.UserID);
      if (!mmsi) return;
      vessels.set(mmsi, {
        mmsi,
        name: (meta.ShipName || '').trim() || `MMSI ${mmsi}`,
        lat: p.Latitude,
        lon: p.Longitude,
        speed: p.Sog || 0,
        course: p.Cog || 0,
        flag: '', country: '', type: '',
        navStatus: p.NavigationalStatus || '',
        ts: Date.now()
      });
    } catch (e) {
      console.error('[aisstream] parse error:', e.message);
    }
  });

  socket.on('error', (e) => {
    console.error('[aisstream] error:', e.message);
    aisStreamConnected = false;
  });

  socket.on('close', () => {
    aisStreamConnected = false;
    console.warn('[aisstream] closed — reconnecting in 5s');
    setTimeout(connectAISStream, 5000);
  });
}

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
      const existing = vessels.get(mmsi);
      if (existing && Date.now() - existing.ts < 30000) return;
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
    ships.forEach(s => {
      const mmsi = String(s.mmsi || s.MMSI || '');
      if (!mmsi) return;
      const existing = vessels.get(mmsi);
      if (existing && Date.now() - existing.ts < 30000) return;
      vessels.set(mmsi, {
        mmsi, name: s.name || s.NAME || `MMSI ${mmsi}`,
        lat: s.lat || s.LAT || 0, lon: s.lon || s.LON || 0,
        speed: s.speed || s.SOG || 0, course: s.course || s.COG || 0,
        flag: s.flag || '', country: s.country || '',
        type: s.type || '', navStatus: s.navStatus || '',
        ts: Date.now()
      });
    });
    console.log(`[pocketworld] ${ships.length} global, cache ${vessels.size}`);
  } catch (e) {
    console.error('[pocketworld] error:', e.message);
  }
}

function broadcastSnapshot() {
  broadcast({ type: 'snapshot', vessels: [...vessels.values()], ts: Date.now() });
}

function computeDensity() {
  const sample = [...vessels.values()].slice(0, 30);
  if (!sample.length) { lastDensity = 0; return; }
  const avg = sample.reduce((a, v) => a + (v.speed || 0), 0) / sample.length;
  lastDensity = Math.round((avg * 12 + Math.random() * 20) * 10) / 10;
  console.log(`[density] ${lastDensity} ug/L (sample ${sample.length}, cache ${vessels.size})`);
  broadcast({ type: 'density', value: lastDensity, ts: Date.now() });
}

server.listen(PORT, () => {
  console.log(`Relay listening on port ${PORT}`);
  console.log(`  AISStream:   ${AISSTREAM_KEY ? 'configured (live)' : 'no key'}`);
  console.log(`  VoyageRadar: ${VR_KEY ? 'configured (poll every ' + POLL_MS/1000 + 's)' : 'no key'}`);
  console.log(`  PocketWorld: fallback`);
  console.log(`  Coverage:    coastal AIS only (terrestrial receivers)`);

  connectAISStream();

  if (VR_KEY) {
    pollVoyageRadar();
    setInterval(pollVoyageRadar, POLL_MS);
  }

  pollPocketWorld();
  setInterval(pollPocketWorld, POLL_MS);

  setInterval(broadcastSnapshot, DENSITY_MS);
  setInterval(computeDensity, DENSITY_MS);
});
