const board = document.querySelector("#board");
const statusEl = document.querySelector("#status");
const resetGame = document.querySelector("#resetGame");
const onlinePanel = document.querySelector("#onlinePanel");
const onlineInfo = document.querySelector("#onlineInfo");
const roomCode = document.querySelector("#roomCode");
const hostRoom = document.querySelector("#hostRoom");
const joinRoom = document.querySelector("#joinRoom");

let mode = "move";
let gameMode = "ai";
let state = freshState();
let peer = null;
let conn = null;
let localSeat = 0;
let isHost = false;

function freshState() {
  return {
    players: [
      { name: "玩家 1", x: 4, y: 0, walls: 10 },
      { name: "电脑", x: 4, y: 8, walls: 10 },
    ],
    turn: 0,
    walls: [],
    winner: null,
  };
}

function setStatus(message, error = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("shake", error);
  if (error) setTimeout(() => statusEl.classList.remove("shake"), 300);
}

function showError(message) {
  setStatus(message, true);
}

function isBlocked(ax, ay, bx, by, source = state) {
  if (bx < 0 || bx > 8 || by < 0 || by > 8) return true;
  if (Math.abs(ax - bx) + Math.abs(ay - by) !== 1) return true;
  for (const wall of source.walls) {
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

function legalMoves(playerIndex, source = state) {
  const me = source.players[playerIndex];
  const other = source.players[1 - playerIndex];
  const moves = new Set();
  [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
    const nx = me.x + dx;
    const ny = me.y + dy;
    if (isBlocked(me.x, me.y, nx, ny, source)) return;
    if (nx !== other.x || ny !== other.y) {
      moves.add(`${nx},${ny}`);
      return;
    }
    const jx = other.x + dx;
    const jy = other.y + dy;
    if (!isBlocked(other.x, other.y, jx, jy, source)) {
      moves.add(`${jx},${jy}`);
    } else {
      const sides = dx ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]];
      sides.forEach(([sx, sy]) => {
        const tx = other.x + sx;
        const ty = other.y + sy;
        if (!isBlocked(other.x, other.y, tx, ty, source)) moves.add(`${tx},${ty}`);
      });
    }
  });
  return moves;
}

function hasPath(playerIndex, source = state) {
  const start = source.players[playerIndex];
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
      if (!seen.has(key) && !isBlocked(x, y, nx, ny, source)) {
        seen.add(key);
        queue.push([nx, ny]);
      }
    }
  }
  return false;
}

function validateWall(o, x, y, source = state) {
  if (x < 0 || x > 7 || y < 0 || y > 7) return "墙不能放出棋盘。";
  if (source.walls.some((w) => w.x === x && w.y === y)) return "墙不能重叠或交叉。";
  const overlaps = source.walls.some((w) => (
    (o === "h" && w.o === "h" && w.y === y && Math.abs(w.x - x) < 2) ||
    (o === "v" && w.o === "v" && w.x === x && Math.abs(w.y - y) < 2)
  ));
  if (overlaps) return "墙不能部分重叠。";
  const next = cloneState(source);
  next.walls.push({ o, x, y });
  return hasPath(0, next) && hasPath(1, next) ? "" : "不能把任一玩家完全堵死。";
}

function cloneState(source) {
  return JSON.parse(JSON.stringify(source));
}

function applyMove(playerIndex, x, y, source = state) {
  if (source.winner !== null) return "游戏已结束，请重开。";
  if (playerIndex !== source.turn) return "还没轮到这个玩家。";
  if (!legalMoves(playerIndex, source).has(`${x},${y}`)) return "这里不能走。";
  const player = source.players[playerIndex];
  player.x = x;
  player.y = y;
  if ((playerIndex === 0 && y === 8) || (playerIndex === 1 && y === 0)) {
    source.winner = playerIndex;
  } else {
    source.turn = 1 - source.turn;
  }
  return "";
}

function applyWall(playerIndex, o, x, y, source = state) {
  if (source.winner !== null) return "游戏已结束，请重开。";
  if (playerIndex !== source.turn) return "还没轮到这个玩家。";
  if (source.players[playerIndex].walls <= 0) return "没有墙了。";
  const error = validateWall(o, x, y, source);
  if (error) return error;
  source.walls.push({ o, x, y });
  source.players[playerIndex].walls -= 1;
  source.turn = 1 - source.turn;
  return "";
}

function canControlCurrentTurn() {
  if (state.winner !== null) return false;
  if (gameMode === "local") return true;
  if (gameMode === "ai") return state.turn === 0;
  return state.turn === localSeat;
}

function sendOnline(payload) {
  if (conn && conn.open) conn.send(payload);
}

function commitAction(action, fromRemote = false) {
  const playerIndex = action.player;
  const error = action.type === "move"
    ? applyMove(playerIndex, action.x, action.y)
    : applyWall(playerIndex, action.o, action.x, action.y);
  if (error) {
    if (!fromRemote) showError(error);
    return false;
  }
  render();
  if (gameMode === "online" && isHost && !fromRemote) sendOnline({ type: "state", state });
  if (gameMode === "online" && !isHost && !fromRemote) sendOnline({ type: "action", action });
  if (gameMode === "ai") queueComputer();
  return true;
}

function handleMove(x, y) {
  if (!canControlCurrentTurn()) return showError("现在不能操作这个回合。");
  commitAction({ type: "move", player: state.turn, x, y });
}

function handleWall(o, x, y) {
  if (!canControlCurrentTurn()) return showError("现在不能操作这个回合。");
  commitAction({ type: "wall", player: state.turn, o, x, y });
}

function shortestPathDistance(playerIndex, source = state) {
  const start = source.players[playerIndex];
  const goalY = playerIndex === 0 ? 8 : 0;
  const seen = new Set([`${start.x},${start.y}`]);
  const queue = [{ x: start.x, y: start.y, d: 0 }];
  for (let i = 0; i < queue.length; i += 1) {
    const current = queue[i];
    if (current.y === goalY) return current.d;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const key = `${nx},${ny}`;
      if (!seen.has(key) && !isBlocked(current.x, current.y, nx, ny, source)) {
        seen.add(key);
        queue.push({ x: nx, y: ny, d: current.d + 1 });
      }
    }
  }
  return 99;
}

function scoreBoard(source) {
  const myDistance = shortestPathDistance(1, source);
  const humanDistance = shortestPathDistance(0, source);
  const myWalls = source.players[1].walls;
  const humanWalls = source.players[0].walls;
  const laneBonus = -Math.abs(4 - source.players[1].x) * 0.08;
  return humanDistance * 1.65 - myDistance * 2.15 + (myWalls - humanWalls) * 0.18 + laneBonus;
}

function scoreMove(playerIndex, key, source = state) {
  const [x, y] = key.split(",").map(Number);
  const next = cloneState(source);
  const error = applyMove(playerIndex, x, y, next);
  if (error) return -999;
  const win = next.winner === playerIndex ? 1000 : 0;
  return scoreBoard(next) + win + Math.random() * 0.08;
}

function candidateWallsNearHuman() {
  const human = state.players[0];
  const candidates = [];
  for (let y = Math.max(0, human.y - 2); y <= Math.min(7, human.y + 2); y += 1) {
    for (let x = Math.max(0, human.x - 3); x <= Math.min(7, human.x + 2); x += 1) {
      candidates.push({ type: "wall", player: 1, o: "h", x, y });
      candidates.push({ type: "wall", player: 1, o: "v", x, y });
    }
  }
  return candidates;
}

function scoreWall(action) {
  if (state.players[1].walls <= 0) return -999;
  const beforeHuman = shortestPathDistance(0);
  const beforeComputer = shortestPathDistance(1);
  const next = cloneState(state);
  const error = applyWall(1, action.o, action.x, action.y, next);
  if (error) return -999;
  const afterHuman = shortestPathDistance(0, next);
  const afterComputer = shortestPathDistance(1, next);
  const humanSlowdown = afterHuman - beforeHuman;
  const computerSlowdown = afterComputer - beforeComputer;
  if (humanSlowdown <= 0) return -999;
  return scoreBoard(next) + humanSlowdown * 3.4 - computerSlowdown * 2.7 - 0.45 + Math.random() * 0.05;
}

function chooseComputerAction() {
  const moveActions = [...legalMoves(1)].map((key) => {
    const [x, y] = key.split(",").map(Number);
    return { type: "move", player: 1, x, y, score: scoreMove(1, key) };
  });
  const bestMove = moveActions.sort((a, b) => b.score - a.score)[0];
  const myDistance = shortestPathDistance(1);
  const humanDistance = shortestPathDistance(0);
  const shouldConsiderWall = state.players[1].walls > 0 && (humanDistance <= myDistance + 2 || humanDistance <= 5);
  if (!shouldConsiderWall) return bestMove;
  const bestWall = candidateWallsNearHuman()
    .map((action) => ({ ...action, score: scoreWall(action) }))
    .sort((a, b) => b.score - a.score)[0];
  if (bestWall && bestWall.score > bestMove.score + 0.35) return bestWall;
  return bestMove;
}

function queueComputer() {
  if (gameMode !== "ai" || state.turn !== 1 || state.winner !== null) return;
  setStatus("电脑思考中...");
  setTimeout(() => {
    const action = chooseComputerAction();
    if (!action) return;
    commitAction(action);
  }, 520);
}

function resetState(sync = true) {
  state = freshState();
  if (gameMode === "local") state.players[1].name = "玩家 2";
  if (gameMode === "online") {
    state.players[1].name = "玩家 2";
    if (sync && isHost) sendOnline({ type: "state", state });
    if (sync && !isHost) sendOnline({ type: "resetRequest" });
  }
  mode = "move";
  document.querySelectorAll(".mode").forEach((b) => b.classList.toggle("active", b.dataset.mode === "move"));
  render();
}

function setGameMode(nextMode) {
  gameMode = nextMode;
  localSeat = 0;
  isHost = false;
  if (conn) conn.close();
  if (peer) peer.destroy();
  conn = null;
  peer = null;
  onlinePanel.classList.toggle("hidden", gameMode !== "online");
  document.querySelectorAll(".gameMode").forEach((b) => b.classList.toggle("active", b.dataset.gameMode === gameMode));
  resetState(false);
  if (gameMode === "ai") {
    state.players[1].name = "电脑";
    setStatus("人机模式：玩家 1 的回合");
  } else if (gameMode === "local") {
    state.players[1].name = "玩家 2";
    setStatus("双人模式：玩家 1 的回合");
  } else {
    state.players[1].name = "玩家 2";
    onlineInfo.textContent = "创建后把房间号发给朋友；朋友输入房间号点加入。";
    setStatus("联机模式：先创建或加入房间");
  }
  render();
}

function roomId(value) {
  return `quoridor-${value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12)}`;
}

function ensurePeerAvailable() {
  if (!window.Peer) {
    showError("联机库还没加载好，请刷新或检查网络。");
    return false;
  }
  return true;
}

function setupConnection(connection) {
  conn = connection;
  conn.on("open", () => {
    onlineInfo.textContent = isHost ? "朋友已加入。你是玩家 1。" : "已加入房间。你是玩家 2。";
    if (isHost) sendOnline({ type: "state", state });
    render();
  });
  conn.on("data", (message) => {
    if (message.type === "state") {
      state = message.state;
      render();
      return;
    }
    if (message.type === "action" && isHost) {
      const ok = commitAction(message.action, true);
      if (ok) sendOnline({ type: "state", state });
      return;
    }
    if (message.type === "resetRequest" && isHost) resetState(true);
  });
  conn.on("close", () => {
    onlineInfo.textContent = "连接已断开。";
    render();
  });
}

function createRoom() {
  if (!ensurePeerAvailable()) return;
  const code = (roomCode.value || Math.random().toString(36).slice(2, 8)).toUpperCase().replace(/[^A-Z0-9]/g, "");
  roomCode.value = code;
  isHost = true;
  localSeat = 0;
  if (peer) peer.destroy();
  peer = new Peer(roomId(code));
  peer.on("open", () => {
    onlineInfo.textContent = `房间号：${code}。等待朋友加入...`;
    render();
  });
  peer.on("connection", setupConnection);
  peer.on("error", (err) => showError(err.type === "unavailable-id" ? "这个房间号已被占用。" : "联机连接失败。"));
}

function joinRoomByCode() {
  if (!ensurePeerAvailable()) return;
  const code = roomCode.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!code) return showError("先输入房间号。");
  isHost = false;
  localSeat = 1;
  if (peer) peer.destroy();
  peer = new Peer();
  peer.on("open", () => {
    onlineInfo.textContent = "正在加入房间...";
    setupConnection(peer.connect(roomId(code)));
  });
  peer.on("error", () => showError("加入失败，请检查房间号。"));
}

function cellRect(x, y) {
  const b = board.getBoundingClientRect();
  const gap = parseFloat(getComputedStyle(board).gap);
  const pad = parseFloat(getComputedStyle(board).paddingLeft);
  const size = (b.width - pad * 2 - gap * 8) / 9;
  return { left: pad + x * (size + gap), top: pad + y * (size + gap), size, gap };
}

function addWallSlot(o, x, y) {
  const btn = document.createElement("button");
  btn.className = `wallSlot ${o}`;
  btn.type = "button";
  btn.title = o === "h" ? "横墙" : "竖墙";
  const a = cellRect(x, y);
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
    if (mode === o) handleWall(o, x, y);
  });
  board.append(btn);
}

function statusText() {
  if (state.winner !== null) return `${state.players[state.winner].name} 获胜！`;
  const prefix = gameMode === "online" ? (localSeat === state.turn ? "轮到你" : "等待对方") : `${state.players[state.turn].name} 的回合`;
  return prefix;
}

function render() {
  board.innerHTML = "";
  const moves = mode === "move" && canControlCurrentTurn() ? legalMoves(state.turn) : new Set();
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
        if (mode === "move") handleMove(x, y);
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
    el.querySelector("strong").textContent = gameMode === "online" && localSeat === i ? `${p.name}（你）` : p.name;
    el.querySelector("small").textContent = `墙：${p.walls}`;
  });
  setStatus(statusText());
}

document.querySelectorAll(".mode").forEach((btn) => {
  btn.addEventListener("click", () => {
    mode = btn.dataset.mode;
    document.querySelectorAll(".mode").forEach((b) => b.classList.toggle("active", b === btn));
    render();
  });
});

document.querySelectorAll(".gameMode").forEach((btn) => {
  btn.addEventListener("click", () => setGameMode(btn.dataset.gameMode));
});

resetGame.addEventListener("click", () => resetState(true));
hostRoom.addEventListener("click", createRoom);
joinRoom.addEventListener("click", joinRoomByCode);
roomCode.addEventListener("input", () => {
  roomCode.value = roomCode.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
});

addEventListener("resize", render);
render();
