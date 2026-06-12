const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 4173);
const PUBLIC = path.join(__dirname, "public");
const ROOMS = new Map();

function freshState() {
  return {
    players: [
      { id: null, name: "Player 1", x: 4, y: 0, walls: 10 },
      { id: null, name: "Player 2", x: 4, y: 8, walls: 10 },
    ],
    turn: 0,
    walls: [],
    winner: null,
    message: "Waiting for players.",
    revision: 0,
  };
}

function roomFor(code) {
  const key = (code || "lobby").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) || "LOBBY";
  if (!ROOMS.has(key)) ROOMS.set(key, { code: key, state: freshState(), clients: new Set() });
  return ROOMS.get(key);
}

function publicState(room, clientId) {
  const state = room.state;
  const seat = state.players.findIndex((p) => p.id === clientId);
  return { room: room.code, you: seat, ...state };
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1e6) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

function broadcast(room) {
  room.state.revision += 1;
  for (const client of room.clients) {
    client.write(`event: state\ndata: ${JSON.stringify(publicState(room, client.clientId))}\n\n`);
  }
}

function isBlocked(state, ax, ay, bx, by) {
  if (bx < 0 || bx > 8 || by < 0 || by > 8) return true;
  if (Math.abs(ax - bx) + Math.abs(ay - by) !== 1) return true;
  for (const wall of state.walls) {
    if (wall.o === "h") {
      const crosses = (ay === wall.y && by === wall.y + 1) || (ay === wall.y + 1 && by === wall.y);
      if (crosses && (ax === wall.x || ax === wall.x + 1)) return true;
    } else {
      const crosses = (ax === wall.x && bx === wall.x + 1) || (ax === wall.x + 1 && bx === wall.x);
      if (crosses && (ay === wall.y || ay === wall.y + 1)) return true;
    }
  }
  return false;
}

function hasPath(state, playerIndex) {
  const start = state.players[playerIndex];
  const goalY = playerIndex === 0 ? 8 : 0;
  const seen = new Set([`${start.x},${start.y}`]);
  const queue = [[start.x, start.y]];
  for (let i = 0; i < queue.length; i += 1) {
    const [x, y] = queue[i];
    if (y === goalY) return true;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (!seen.has(key) && !isBlocked(state, x, y, nx, ny)) {
        seen.add(key);
        queue.push([nx, ny]);
      }
    }
  }
  return false;
}

function legalMoves(state, playerIndex) {
  const me = state.players[playerIndex];
  const other = state.players[1 - playerIndex];
  const moves = new Set();
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = me.x + dx;
    const ny = me.y + dy;
    if (isBlocked(state, me.x, me.y, nx, ny)) continue;
    if (nx !== other.x || ny !== other.y) {
      moves.add(`${nx},${ny}`);
      continue;
    }
    const jx = other.x + dx;
    const jy = other.y + dy;
    if (!isBlocked(state, other.x, other.y, jx, jy)) {
      moves.add(`${jx},${jy}`);
    } else {
      const sideDirs = dx ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]];
      for (const [sx, sy] of sideDirs) {
        const tx = other.x + sx;
        const ty = other.y + sy;
        if (!isBlocked(state, other.x, other.y, tx, ty)) moves.add(`${tx},${ty}`);
      }
    }
  }
  return moves;
}

function validateWall(state, wall) {
  const o = wall.o === "v" ? "v" : "h";
  const x = Number(wall.x);
  const y = Number(wall.y);
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x > 7 || y < 0 || y > 7) {
    return { ok: false, message: "Wall is outside the board." };
  }
  if (state.walls.some((w) => w.x === x && w.y === y)) {
    return { ok: false, message: "Walls cannot overlap or cross at the same slot." };
  }
  const overlaps = state.walls.some((w) => (
    (o === "h" && w.o === "h" && w.y === y && Math.abs(w.x - x) < 2) ||
    (o === "v" && w.o === "v" && w.x === x && Math.abs(w.y - y) < 2)
  ));
  if (overlaps) {
    return { ok: false, message: "Walls cannot partially overlap." };
  }
  const next = { ...state, walls: [...state.walls, { o, x, y }] };
  if (!hasPath(next, 0) || !hasPath(next, 1)) {
    return { ok: false, message: "A wall must leave both players at least one path." };
  }
  return { ok: true, wall: { o, x, y } };
}

function takeSeat(state, clientId, name) {
  let seat = state.players.findIndex((p) => p.id === clientId);
  if (seat !== -1) return seat;
  seat = state.players.findIndex((p) => !p.id);
  if (seat === -1) return -1;
  state.players[seat].id = clientId;
  state.players[seat].name = (name || `Player ${seat + 1}`).toString().slice(0, 20);
  state.message = state.players.every((p) => p.id) ? `${state.players[state.turn].name}'s turn.` : "Waiting for another player.";
  return seat;
}

function advanceTurn(state) {
  state.turn = 1 - state.turn;
  state.message = `${state.players[state.turn].name}'s turn.`;
}

async function handleApi(req, res, url) {
  try {
    if (req.method === "GET" && url.pathname === "/events") {
      const room = roomFor(url.searchParams.get("room"));
      const clientId = url.searchParams.get("client") || cryptoId();
      takeSeat(room.state, clientId, url.searchParams.get("name"));
      res.writeHead(200, {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
      });
      res.clientId = clientId;
      room.clients.add(res);
      res.write(`event: hello\ndata: ${JSON.stringify({ clientId })}\n\n`);
      res.write(`event: state\ndata: ${JSON.stringify(publicState(room, clientId))}\n\n`);
      req.on("close", () => room.clients.delete(res));
      return;
    }

    if (req.method !== "POST") return sendJson(res, 404, { error: "Not found" });
    const body = await readJson(req);
    const room = roomFor(body.room);
    const state = room.state;
    const seat = state.players.findIndex((p) => p.id === body.clientId);

    if (url.pathname === "/api/join") {
      takeSeat(state, body.clientId || cryptoId(), body.name);
      broadcast(room);
      return sendJson(res, 200, { ok: true });
    }

    if (url.pathname === "/api/reset") {
      const oldPlayers = state.players.map((p) => ({ id: p.id, name: p.name }));
      room.state = freshState();
      room.state.players[0].id = oldPlayers[0].id;
      room.state.players[0].name = oldPlayers[0].name || "Player 1";
      room.state.players[1].id = oldPlayers[1].id;
      room.state.players[1].name = oldPlayers[1].name || "Player 2";
      room.state.message = "New game started.";
      broadcast(room);
      return sendJson(res, 200, { ok: true });
    }

    if (seat < 0) return sendJson(res, 403, { error: "This room already has two players. You are watching." });
    if (state.winner !== null) return sendJson(res, 409, { error: "Game over. Start a new game." });
    if (seat !== state.turn) return sendJson(res, 409, { error: "It is not your turn." });

    if (url.pathname === "/api/move") {
      const x = Number(body.x);
      const y = Number(body.y);
      if (!legalMoves(state, seat).has(`${x},${y}`)) return sendJson(res, 400, { error: "Illegal move." });
      state.players[seat].x = x;
      state.players[seat].y = y;
      if ((seat === 0 && y === 8) || (seat === 1 && y === 0)) {
        state.winner = seat;
        state.message = `${state.players[seat].name} wins!`;
      } else {
        advanceTurn(state);
      }
      broadcast(room);
      return sendJson(res, 200, { ok: true });
    }

    if (url.pathname === "/api/wall") {
      if (state.players[seat].walls <= 0) return sendJson(res, 400, { error: "No walls left." });
      const verdict = validateWall(state, body);
      if (!verdict.ok) return sendJson(res, 400, { error: verdict.message });
      state.walls.push(verdict.wall);
      state.players[seat].walls -= 1;
      advanceTurn(state);
      broadcast(room);
      return sendJson(res, 200, { ok: true });
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}

function cryptoId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function serveStatic(res, pathname) {
  const clean = pathname === "/" ? "/index.html" : pathname;
  const file = path.normalize(path.join(PUBLIC, clean));
  if (!file.startsWith(PUBLIC)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(file);
    const type = ext === ".js" ? "text/javascript" : ext === ".css" ? "text/css" : "text/html";
    res.writeHead(200, { "content-type": `${type}; charset=utf-8` });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith("/api/") || url.pathname === "/events") return handleApi(req, res, url);
  serveStatic(res, url.pathname);
});

server.listen(PORT, () => {
  console.log(`Quoridor Online running at http://localhost:${PORT}`);
});
