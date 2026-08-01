(() => {
  "use strict";

  const SIZE = 15;
  const TOTAL = SIZE * SIZE;
  const COLS = "ABCDEFGHJKLMNOP";
  const NAMES = ["黑方", "白方"];
  const el = (id) => document.getElementById(id);
  const boardEl = el("board");

  let board;
  let mines;
  let minesLeft;
  let player;
  let mode;
  let result;
  let handoff;
  let turn;
  let gameType = "local";
  let localPlayer = null;
  let aiThinking = false;
  let peer = null;
  let connection = null;
  let onlineConnected = false;
  let blastTimer;
  let aiTimer;

  function initialState() {
    window.clearTimeout(blastTimer);
    window.clearTimeout(aiTimer);
    board = Array(TOTAL).fill(0);
    mines = [Array(TOTAL).fill(false), Array(TOTAL).fill(false)];
    minesLeft = [10, 10];
    player = 0;
    mode = "stone";
    result = null;
    handoff = false;
    turn = 1;
    aiThinking = false;
    el("handoffOverlay").classList.add("hidden");
    el("resultOverlay").classList.add("hidden");
  }

  function reset(sendOnline = true) {
    if (sendOnline && gameType === "online" && connection?.open) {
      connection.send({ type: "reset" });
    }
    initialState();
    setMessage(gameType === "ai"
      ? "你执黑先手。电脑也会落子和埋雷。"
      : gameType === "online"
        ? `联机已就绪，你执${localPlayer === 0 ? "黑" : "白"}。`
        : "黑方先手。选择落子或埋雷，然后点击棋盘。");
    render();
  }

  function startGame(type, assignedPlayer = null) {
    gameType = type;
    localPlayer = assignedPlayer;
    el("setupOverlay").classList.add("hidden");
    el("onlinePanel").classList.add("hidden");
    el("blackName").textContent = type === "online" ? (assignedPlayer === 0 ? "你" : "对手") : "黑方";
    el("whiteName").textContent = type === "ai" ? "电脑" : type === "online" ? (assignedPlayer === 1 ? "你" : "对手") : "白方";
    reset(false);
  }

  function hasFive(target) {
    const stone = target + 1;
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        if (board[row * SIZE + col] !== stone) continue;
        for (const [dx, dy] of directions) {
          let count = 1;
          for (const sign of [-1, 1]) {
            let x = col + dx * sign;
            let y = row + dy * sign;
            while (x >= 0 && x < SIZE && y >= 0 && y < SIZE && board[y * SIZE + x] === stone) {
              count += 1;
              x += dx * sign;
              y += dy * sign;
            }
          }
          if (count >= 5) return true;
        }
      }
    }
    return false;
  }

  function setMessage(text, alert = false) {
    el("message").textContent = text;
    el("messageIcon").textContent = alert ? "!" : "i";
    el("messageIcon").className = alert ? "alert-icon" : "info-icon";
  }

  function canLocalAct() {
    if (result !== null || handoff || aiThinking) return false;
    if (gameType === "ai") return player === 0;
    if (gameType === "online") return onlineConnected && player === localPlayer;
    return true;
  }

  function sendAction(actionMode, index, actor) {
    if (gameType === "online" && connection?.open) {
      connection.send({ type: "action", mode: actionMode, index, player: actor });
    }
  }

  function finishTurn(text, alert = false, blast = []) {
    if (board.every(Boolean)) {
      result = "draw";
      showResult();
      return;
    }

    player = player === 0 ? 1 : 0;
    mode = "stone";
    turn += 1;
    handoff = gameType === "local";
    setMessage(text, alert);
    render(blast);

    if (blast.length) {
      blastTimer = window.setTimeout(() => {
        render();
        continueTurn();
      }, 850);
    } else {
      continueTurn();
    }
  }

  function continueTurn() {
    if (gameType === "local") {
      showHandoff();
    } else if (gameType === "ai" && player === 1 && result === null) {
      scheduleAi();
    } else if (gameType === "online" && player !== localPlayer) {
      setMessage("等待对手行动…");
    }
  }

  function showHandoff() {
    if (!handoff || result !== null) return;
    el("handoffStone").className = `stone large ${player === 0 ? "black-stone" : "white-stone"}`;
    el("handoffTitle").textContent = `请将设备交给${NAMES[player]}`;
    el("handoffCopy").textContent = `确认后只会显示${NAMES[player]}自己的地雷。`;
    el("handoffButton").textContent = `我是${NAMES[player]}，开始回合`;
    el("handoffOverlay").classList.remove("hidden");
    el("handoffButton").focus();
  }

  function showResult() {
    handoff = false;
    aiThinking = false;
    el("handoffOverlay").classList.add("hidden");
    if (result === "draw") {
      el("resultTitle").textContent = "棋逢对手，和棋收场";
      el("resultCopy").textContent = "棋盘已经落满。";
      setMessage("棋盘已满，本局和棋。");
    } else {
      const winner = gameType === "ai" && result === 1 ? "电脑" : NAMES[result];
      el("resultTitle").textContent = `${winner}五子连珠`;
      el("resultCopy").textContent = result === 0 && gameType === "ai"
        ? "你突破了电脑布下的雷阵。"
        : "避开雷阵，赢下这盘攻防。";
      setMessage(`${winner}连成五子，赢得本局！`);
    }
    render();
    el("resultOverlay").classList.remove("hidden");
    el("playAgainButton").focus();
  }

  function performAction(index, actionMode = mode, actor = player, source = "local") {
    if (actor !== player || result !== null || board[index] !== 0) return;
    if (source === "local" && !canLocalAct()) return;

    if (actionMode === "mine") {
      if (minesLeft[actor] === 0 || mines[actor][index]) return;
      mines[actor][index] = true;
      minesLeft[actor] -= 1;
      if (source === "local") sendAction("mine", index, actor);
      finishTurn(`${gameType === "ai" && actor === 1 ? "电脑" : NAMES[actor]}埋下一枚地雷。`);
      return;
    }

    const opponent = actor === 0 ? 1 : 0;
    board[index] = actor + 1;
    if (source === "local") sendAction("stone", index, actor);

    if (mines[opponent][index]) {
      const row = Math.floor(index / SIZE);
      const col = index % SIZE;
      const affected = [];
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const x = col + dx;
          const y = row + dy;
          if (x >= 0 && x < SIZE && y >= 0 && y < SIZE) {
            affected.push(y * SIZE + x);
          }
        }
      }
      affected.forEach((cell) => { board[cell] = 0; });
      mines[opponent][index] = false;
      const actorName = gameType === "ai" && actor === 1 ? "电脑" : NAMES[actor];
      finishTurn(`轰！${actorName}踩中地雷，九宫格范围内的棋子全部被炸掉。`, true, affected);
      return;
    }

    if (hasFive(actor)) {
      result = actor;
      showResult();
      return;
    }
    finishTurn(`${gameType === "ai" && actor === 1 ? "电脑" : NAMES[actor]}落下一子。`);
  }

  function wouldWin(index, target) {
    board[index] = target + 1;
    const wins = hasFive(target);
    board[index] = 0;
    return wins;
  }

  function lineScore(index, target) {
    const row = Math.floor(index / SIZE);
    const col = index % SIZE;
    const stone = target + 1;
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
    let score = 0;

    for (const [dx, dy] of directions) {
      let count = 1;
      let open = 0;
      for (const sign of [-1, 1]) {
        let x = col + dx * sign;
        let y = row + dy * sign;
        while (x >= 0 && x < SIZE && y >= 0 && y < SIZE && board[y * SIZE + x] === stone) {
          count += 1;
          x += dx * sign;
          y += dy * sign;
        }
        if (x >= 0 && x < SIZE && y >= 0 && y < SIZE && board[y * SIZE + x] === 0) open += 1;
      }
      score += count * count * 11 + open * 4;
    }
    score += 15 - Math.abs(row - 7) - Math.abs(col - 7);
    return score;
  }

  function chooseAiAction() {
    const empty = board.map((cell, index) => cell === 0 ? index : -1).filter((index) => index >= 0);
    const winning = empty.find((index) => wouldWin(index, 1));
    if (winning !== undefined) return { mode: "stone", index: winning };
    const blocking = empty.find((index) => wouldWin(index, 0));
    if (blocking !== undefined) return { mode: "stone", index: blocking };

    if (minesLeft[1] > 0 && turn > 3 && Math.random() < 0.27) {
      const candidates = empty.filter((index) => !mines[1][index]);
      candidates.sort((a, b) => lineScore(b, 0) - lineScore(a, 0));
      const pool = candidates.slice(0, Math.min(7, candidates.length));
      return { mode: "mine", index: pool[Math.floor(Math.random() * pool.length)] };
    }

    let best = empty[0];
    let bestScore = -Infinity;
    empty.forEach((index) => {
      const score = lineScore(index, 1) * 1.08 + lineScore(index, 0) + Math.random() * 5;
      if (score > bestScore) {
        bestScore = score;
        best = index;
      }
    });
    return { mode: "stone", index: best };
  }

  function scheduleAi() {
    aiThinking = true;
    setMessage("电脑正在观察棋局…");
    render();
    aiTimer = window.setTimeout(() => {
      if (gameType !== "ai" || player !== 1 || result !== null) return;
      aiThinking = false;
      const action = chooseAiAction();
      performAction(action.index, action.mode, 1, "ai");
    }, 620);
  }

  function visibleMineOwner() {
    if (gameType === "local") return player;
    if (gameType === "ai") return 0;
    return localPlayer;
  }

  function render(blast = []) {
    el("blackMines").textContent = minesLeft[0];
    el("whiteMines").textContent = minesLeft[1];
    el("turnLabel").textContent = result === null ? `第 ${turn} 回合` : "本局结束";
    const currentName = gameType === "ai" && player === 1 ? "电脑" : NAMES[player];
    el("statusText").textContent = result === "draw" ? "和棋" : result !== null ? `${NAMES[result]}胜利` : aiThinking ? "电脑思考中" : `${currentName}回合`;
    el("blackCard").classList.toggle("active", player === 0 && result === null);
    el("whiteCard").classList.toggle("active", player === 1 && result === null);
    el("stoneMode").className = mode === "stone" ? "selected" : "";
    el("mineMode").className = mode === "mine" ? "selected danger" : "";
    el("stoneMode").disabled = !canLocalAct();
    el("mineMode").disabled = !canLocalAct() || minesLeft[player] === 0;
    el("modeStone").className = `mini-stone ${player === 0 ? "black-stone" : "white-stone"}`;

    const sessionCopy = {
      local: ["本地双人", "同屏对战"],
      ai: ["单机模式", aiThinking ? "电脑思考中" : "你执黑棋"],
      online: ["联网对战", onlineConnected ? `你执${localPlayer === 0 ? "黑" : "白"}棋 · 已连接` : "连接已断开"]
    };
    el("sessionMode").textContent = sessionCopy[gameType][0];
    el("connectionText").textContent = sessionCopy[gameType][1];
    el("connectionDot").classList.toggle("online", gameType === "online" && onlineConnected);
    el("connectionDot").classList.toggle("thinking", gameType === "ai" && aiThinking);
    el("mineNote").textContent = gameType === "local" ? "只显示当前玩家埋下的地雷" : "只显示你埋下的地雷";

    const mineOwner = visibleMineOwner();
    boardEl.replaceChildren();
    board.forEach((cell, index) => {
      const row = Math.floor(index / SIZE);
      const col = index % SIZE;
      const ownMine = mineOwner !== null && mines[mineOwner][index];
      const button = document.createElement("button");
      button.className = `cell${blast.includes(index) ? " blast" : ""}`;
      button.type = "button";
      button.setAttribute("role", "gridcell");
      button.setAttribute("aria-label", `${COLS[col]}${row + 1}${cell ? `，${cell === 1 ? "黑子" : "白子"}` : ""}${ownMine ? "，己方地雷" : ""}`);
      button.disabled = !canLocalAct() || cell !== 0 || (mode === "mine" && (minesLeft[player] === 0 || mines[player][index]));
      button.addEventListener("click", () => performAction(index));
      if (cell) {
        const stone = document.createElement("span");
        stone.className = `stone ${cell === 1 ? "black-stone" : "white-stone"}`;
        stone.setAttribute("aria-hidden", "true");
        button.append(stone);
      } else if (ownMine) {
        const mine = document.createElement("span");
        mine.className = "mine-marker";
        mine.textContent = "✹";
        mine.setAttribute("aria-hidden", "true");
        button.append(mine);
      }
      boardEl.append(button);
    });
  }

  function cleanupNetwork() {
    onlineConnected = false;
    if (connection) {
      connection.close();
      connection = null;
    }
    if (peer) {
      peer.destroy();
      peer = null;
    }
  }

  function networkError(message) {
    el("networkStatus").textContent = message;
    el("networkStatus").classList.add("error");
  }

  function bindConnection(conn, isHost) {
    connection = conn;
    conn.on("open", () => {
      el("networkStatus").classList.remove("error");
      if (isHost) {
        const hostPlayer = Math.random() < 0.5 ? 0 : 1;
        onlineConnected = true;
        conn.send({ type: "start", player: hostPlayer === 0 ? 1 : 0 });
        startGame("online", hostPlayer);
      } else {
        el("networkStatus").textContent = "连接成功，正在随机分配黑白…";
      }
    });
    conn.on("data", (data) => {
      if (!data || typeof data !== "object") return;
      if (data.type === "start" && !isHost) {
        onlineConnected = true;
        startGame("online", Number(data.player));
      } else if (data.type === "action") {
        performAction(Number(data.index), data.mode, Number(data.player), "remote");
      } else if (data.type === "reset") {
        reset(false);
      }
    });
    conn.on("close", () => {
      onlineConnected = false;
      setMessage("对手已离开房间。返回模式选择可重新联机。", true);
      render();
    });
    conn.on("error", () => {
      onlineConnected = false;
      setMessage("联机发生错误，请返回模式选择后重试。", true);
      render();
    });
  }

  function requirePeerJs() {
    if (window.Peer) return true;
    networkError("联机组件未能加载，请检查网络后刷新页面。");
    return false;
  }

  function createRoom() {
    if (!requirePeerJs()) return;
    cleanupNetwork();
    const code = Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "X");
    el("roomCode").textContent = code;
    el("roomResult").classList.remove("hidden");
    el("networkStatus").textContent = "正在创建房间…";
    el("networkStatus").classList.remove("error");
    peer = new window.Peer(`leizhen-${code.toLowerCase()}`);
    peer.on("open", () => {
      el("networkStatus").textContent = "房间已创建，把房间码发给朋友，等待加入。";
    });
    peer.on("connection", (incoming) => {
      if (connection?.open) {
        incoming.close();
        return;
      }
      bindConnection(incoming, true);
    });
    peer.on("error", (error) => {
      if (error?.type === "unavailable-id") {
        networkError("房间码刚好被占用，请再点一次“创建房间”。");
      } else {
        networkError("房间创建失败，请检查网络后重试。");
      }
    });
  }

  function joinRoom() {
    if (!requirePeerJs()) return;
    const code = el("roomInput").value.trim().toLowerCase();
    if (!/^[a-z0-9]{6}$/.test(code)) {
      networkError("请输入 6 位房间码。");
      return;
    }
    cleanupNetwork();
    el("networkStatus").textContent = "正在加入房间…";
    el("networkStatus").classList.remove("error");
    peer = new window.Peer();
    peer.on("open", () => {
      const conn = peer.connect(`leizhen-${code}`, { reliable: true });
      bindConnection(conn, false);
    });
    peer.on("error", () => networkError("无法加入房间，请确认房间码和双方网络。"));
  }

  function openSetup() {
    cleanupNetwork();
    initialState();
    render();
    el("onlinePanel").classList.add("hidden");
    el("roomResult").classList.add("hidden");
    el("networkStatus").textContent = "连接成功后随机分配黑白双方。";
    el("networkStatus").classList.remove("error");
    el("setupOverlay").classList.remove("hidden");
    el("soloButton").focus();
  }

  function openRules() {
    el("rulesOverlay").classList.remove("hidden");
    el("closeRulesButton").focus();
  }

  el("topCoordinates").innerHTML = COLS.split("").map((value) => `<span>${value}</span>`).join("");
  el("sideCoordinates").innerHTML = Array.from({ length: SIZE }, (_, index) => `<span>${index + 1}</span>`).join("");
  el("stoneMode").addEventListener("click", () => { if (canLocalAct()) { mode = "stone"; render(); } });
  el("mineMode").addEventListener("click", () => { if (canLocalAct() && minesLeft[player] > 0) { mode = "mine"; render(); } });
  el("handoffButton").addEventListener("click", () => {
    handoff = false;
    el("handoffOverlay").classList.add("hidden");
    render();
  });
  el("resetButton").addEventListener("click", () => reset(true));
  el("playAgainButton").addEventListener("click", () => reset(true));
  el("modeButton").addEventListener("click", openSetup);
  el("resultModeButton").addEventListener("click", openSetup);
  el("soloButton").addEventListener("click", () => {
    cleanupNetwork();
    startGame("ai", 0);
  });
  el("localButton").addEventListener("click", () => {
    cleanupNetwork();
    startGame("local", null);
  });
  el("onlineButton").addEventListener("click", () => {
    el("onlinePanel").classList.remove("hidden");
    el("createRoomButton").focus();
  });
  el("createRoomButton").addEventListener("click", createRoom);
  el("joinRoomButton").addEventListener("click", joinRoom);
  el("roomInput").addEventListener("input", (event) => {
    event.target.value = event.target.value.replace(/[^a-z0-9]/gi, "").toUpperCase();
  });
  el("roomInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") joinRoom();
  });
  el("copyRoomButton").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(el("roomCode").textContent);
      el("copyRoomButton").textContent = "已复制";
    } catch {
      networkError(`请手动复制房间码：${el("roomCode").textContent}`);
    }
  });
  el("rulesButton").addEventListener("click", openRules);
  el("setupRulesButton").addEventListener("click", openRules);
  el("closeRulesButton").addEventListener("click", () => el("rulesOverlay").classList.add("hidden"));
  el("rulesOverlay").addEventListener("click", (event) => {
    if (event.target === el("rulesOverlay")) el("rulesOverlay").classList.add("hidden");
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") el("rulesOverlay").classList.add("hidden");
  });

  initialState();
  render();
})();
