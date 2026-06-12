const params = new URLSearchParams(location.search);
const randomRoom = Math.random().toString(36).slice(2, 7).toUpperCase();
const room = (params.get("room") || randomRoom).toUpperCase();
const clientKey = `quoridor-client-${room}`;
const clientId = localStorage.getItem(clientKey) || Math.random().toString(36).slice(2) + Date.now().toString(36);
localStorage.setItem(clientKey, clientId);
if (!params.get("room")) history.replaceState(null, "", `?room=${room}`);

const board = document.querySelector("#board");
const statusEl = document.querySelector("#status");
const roomInput = document.querySelector("#roomInput");
const copyLink = document.querySelector("#copyLink");
const resetGame = document.querySelector("#resetGame");
let state = null;
let mode = "move";

roomInput.value = room;

function api(path, payload) {
  return fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ room, clientId, ...payload }),
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  });
}

function blocked(ax, ay, bx, by) {
  if (!state || bx < 0 || bx > 8 || by < 0 || by > 8) return true;
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

function legalMoves(playerIndex) {
  const me = state.players[playerIndex];
  const other = state.players[1 - playerIndex];
  const moves = new Set();
  [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
    const nx = me.x + dx;
    const ny = me.y + dy;
    if (blocked(me.x, me.y, nx, ny)) return;
    if (nx !== other.x || ny !== other.y) {
      moves.add(`${nx},${ny}`);
      return;
    }
    const jx = other.x + dx;
    const jy = other.y + dy;
    if (!blocked(other.x, other.y, jx, jy)) {
      moves.add(`${jx},${jy}`);
    } else {
      const sides = dx ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]];
      sides.forEach(([sx, sy]) => {
        const tx = other.x + sx;
        const ty = other.y + sy;
        if (!blocked(other.x, other.y, tx, ty)) moves.add(`${tx},${ty}`);
      });
    }
  });
  return moves;
}

function cellRect(x, y) {
  const b = board.getBoundingClientRect();
  const gap = parseFloat(getComputedStyle(board).gap);
  const pad = parseFloat(getComputedStyle(board).paddingLeft);
  const size = (b.width - pad * 2 - gap * 8) / 9;
  return {
    left: pad + x * (size + gap),
    top: pad + y * (size + gap),
    size,
    gap,
  };
}

function addWallSlot(o, x, y) {
  const btn = document.createElement("button");
  btn.className = `wallSlot ${o}`;
  btn.type = "button";
  btn.title = o === "h" ? "横墙" : "竖墙";
  btn.dataset.o = o;
  btn.dataset.x = x;
  btn.dataset.y = y;
  const a = cellRect(x, y);
  const b = o === "h" ? cellRect(x + 1, y) : cellRect(x, y + 1);
  if (o === "h") {
    btn.style.left = `${a.left}px`;
    btn.style.top = `${a.top + a.size + a.gap * 0.06}px`;
    btn.style.width = `${a.size * 2 + a.gap}px`;
  } else {
    btn.style.left = `${a.left + a.size + a.gap * 0.06}px`;
    btn.style.top = `${a.top}px`;
    btn.style.height = `${a.size * 2 + a.gap}px`;
  }
  if (state.walls.some((w) => w.o === o && w.x === x && w.y === y)) btn.classList.add("placed");
  btn.addEventListener("click", () => {
    if (mode !== o) return;
    api("/api/wall", { o, x, y }).catch(showError);
  });
  board.append(btn);
}

function render() {
  if (!state) return;
  board.innerHTML = "";
  const mine = state.you;
  const moves = mine === state.turn && mode === "move" && state.winner === null ? legalMoves(mine) : new Set();

  for (let y = 0; y < 9; y += 1) {
    for (let x = 0; x < 9; x += 1) {
      const cell = document.createElement("button");
      cell.className = "cell";
      cell.type = "button";
      cell.dataset.x = x;
      cell.dataset.y = y;
      if (moves.has(`${x},${y}`)) cell.classList.add("legal");
      const player = state.players.findIndex((p) => p.x === x && p.y === y);
      if (player >= 0) {
        const pawn = document.createElement("span");
        pawn.className = `pawn ${player === 0 ? "gold" : "teal"}`;
        cell.append(pawn);
      }
      cell.addEventListener("click", () => {
        if (mode === "move") api("/api/move", { x, y }).catch(showError);
      });
      board.append(cell);
    }
  }

  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      addWallSlot("h", x, y);
      addWallSlot("v", x, y);
    }
  }

  state.players.forEach((p, i) => {
    const el = document.querySelector(`#p${i}`);
    el.classList.toggle("turn", state.turn === i && state.winner === null);
    el.querySelector("strong").textContent = p.name + (state.you === i ? "（你）" : "");
    el.querySelector("small").textContent = `墙：${p.walls}`;
  });

  const role = state.you >= 0 ? `你是玩家 ${state.you + 1}` : "你在观战";
  statusEl.textContent = `${role} · ${state.message}`;
}

function showError(err) {
  statusEl.textContent = err.message;
  statusEl.classList.add("shake");
  setTimeout(() => statusEl.classList.remove("shake"), 300);
}

document.querySelectorAll(".mode").forEach((btn) => {
  btn.addEventListener("click", () => {
    mode = btn.dataset.mode;
    document.querySelectorAll(".mode").forEach((b) => b.classList.toggle("active", b === btn));
    render();
  });
});

roomInput.addEventListener("change", () => {
  const next = roomInput.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  if (next) location.href = `?room=${next}`;
});

copyLink.addEventListener("click", async () => {
  await navigator.clipboard.writeText(location.href);
  copyLink.textContent = "已复制";
  setTimeout(() => (copyLink.textContent = "复制链接"), 900);
});

resetGame.addEventListener("click", () => api("/api/reset", {}).catch(showError));

const events = new EventSource(`/events?room=${room}&client=${clientId}&name=${encodeURIComponent("Player")}`);
events.addEventListener("hello", (event) => {
  const data = JSON.parse(event.data);
  localStorage.setItem(clientKey, data.clientId);
});
events.addEventListener("state", (event) => {
  state = JSON.parse(event.data);
  render();
});
events.onerror = () => {
  statusEl.textContent = "连接断开，正在重连...";
};

addEventListener("resize", render);
