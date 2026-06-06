import http from "node:http";
import { WebSocketServer } from "ws";
import fs from "node:fs";
import path from "node:path";

const PORT = Number(process.env.PORT || 3107);

const state = {
  homeName: "NGỌC GIÀU",
  awayName: "HẢI ĐĂNG",
  homeScore: 1,
  awayScore: 3,
  clockSeconds: 0,
  period: "1ST",
  running: false,
  addedMinutes: 0,
  showOverlay: false,
  overlayTeam: "home",
  homeLogo: null,
  awayLogo: null,
  updatedAt: Date.now(),
};

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/api/state" && req.method === "GET") {
    json(res, getState());
    return;
  }

  if (req.url.startsWith("/uploads/") && req.method === "GET") {
    const filePath = path.join(process.cwd(), req.url);
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { "Content-Type": "image/png" });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end();
    }
    return;
  }

  if (req.url === "/api/control" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        handleMessage(JSON.parse(body || "{}"));
        json(res, { ok: true, state: getState() });
      } catch (error) {
        json(res, { ok: false, error: error.message }, 400);
      }
    });
    return;
  }

  json(res, { ok: true, websocket: `ws://localhost:${PORT}` });
});

const wss = new WebSocketServer({ server });

wss.on("connection", (socket) => {
  socket.send(JSON.stringify({ type: "state", payload: getState() }));
  socket.on("message", (raw) => {
    try {
      handleMessage(JSON.parse(raw.toString()));
    } catch (error) {
      socket.send(JSON.stringify({ type: "error", message: error.message }));
    }
  });
});

function json(res, payload, status = 200) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function getState() {
  const now = Date.now();
  const elapsed = state.running ? Math.floor((now - state.updatedAt) / 1000) : 0;
  return { ...state, clockSeconds: state.clockSeconds + elapsed, serverTime: now };
}

function commitClock() {
  const next = getState();
  state.clockSeconds = next.clockSeconds;
  state.updatedAt = Date.now();
}

function broadcast(type, payload) {
  const packet = JSON.stringify({ type, payload });
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(packet);
  }
}

function pushState(event = null) {
  const snapshot = getState();
  broadcast("state", snapshot);
  if (event) broadcast("event", event);
}

function maybeAutoPeriod() {
  if (state.period === "1ST" && state.clockSeconds >= 45 * 60) {
    state.period = "HT";
    state.running = false;
  } else if (state.period === "2ND" && state.clockSeconds >= 90 * 60) {
    state.period = "FT";
    state.running = false;
  }
}

function handleMessage(message) {
  const action = message.action || message.type;
  commitClock();

  if (action === "goal") {
    const side = message.side === "away" ? "away" : "home";
    if (side === "home") state.homeScore += 1;
    else state.awayScore += 1;
    pushState({ name: "goal", side });
    return;
  }

  if (action === "score") {
    if (Number.isFinite(Number(message.homeScore))) state.homeScore = Number(message.homeScore);
    if (Number.isFinite(Number(message.awayScore))) state.awayScore = Number(message.awayScore);
    pushState();
    return;
  }

  if (action === "teams") {
    if (message.homeName) state.homeName = String(message.homeName).toUpperCase();
    if (message.awayName) state.awayName = String(message.awayName).toUpperCase();
    
    const processLogo = (logoData, prefix) => {
      if (!logoData) return null;
      if (logoData.startsWith("data:image")) {
        const base64Data = logoData.replace(/^data:image\/\w+;base64,/, "");
        const fileName = `${prefix}_${Date.now()}.png`;
        const dir = path.join(process.cwd(), "uploads");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        fs.writeFileSync(path.join(dir, fileName), base64Data, 'base64');
        return `http://localhost:${PORT}/uploads/${fileName}`;
      }
      return logoData;
    };

    if (message.homeLogo !== undefined) state.homeLogo = processLogo(message.homeLogo, "home");
    if (message.awayLogo !== undefined) state.awayLogo = processLogo(message.awayLogo, "away");
    
    pushState();
    return;
  }

  if (action === "clock") {
    if (Number.isFinite(Number(message.seconds))) state.clockSeconds = Math.max(0, Number(message.seconds));
    if (message.time) state.clockSeconds = parseClock(message.time);
    maybeAutoPeriod();
    pushState();
    return;
  }

  if (action === "start") {
    state.running = true;
    state.updatedAt = Date.now();
    pushState();
    return;
  }

  if (action === "pause") {
    state.running = false;
    pushState();
    return;
  }

  if (action === "period") {
    state.period = String(message.period || state.period).toUpperCase();
    if (state.period === "2ND" && state.clockSeconds < 45 * 60) state.clockSeconds = 45 * 60;
    pushState();
    return;
  }

  if (action === "added") {
    state.addedMinutes = Math.max(0, Number(message.minutes || 0));
    pushState({ name: "added", minutes: state.addedMinutes });
    return;
  }

  if (action === "reset") {
    state.homeScore = 0;
    state.awayScore = 0;
    state.clockSeconds = 0;
    state.period = "1ST";
    state.running = false;
    state.addedMinutes = 0;
    pushState({ name: "reset" });
    return;
  }

  if (action === "toggle_overlay") {
    state.showOverlay = !!message.show;
    if (message.team) state.overlayTeam = message.team;
    pushState();
    return;
  }
}

function parseClock(value) {
  const match = String(value).trim().match(/^(\d{1,3}):([0-5]\d)$/);
  if (!match) return state.clockSeconds;
  return Number(match[1]) * 60 + Number(match[2]);
}

setInterval(() => {
  if (!state.running) return;
  commitClock();
  maybeAutoPeriod();
  pushState();
}, 1000);

server.listen(PORT, () => {
  console.log(`BTS scoreboard backend: http://localhost:${PORT}`);
});
