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
  let blastTimer;

  function reset() {
    window.clearTimeout(blastTimer);
    board = Array(TOTAL).fill(0);
    mines = [Array(TOTAL).fill(false), Array(TOTAL).fill(false)];
    minesLeft = [10, 10];
    player = 0;
    mode = "stone";
    result = null;
    handoff = false;
    turn = 1;
    el("handoffOverlay").classList.add("hidden");
    el("resultOverlay").classList.add("hidden");
    setMessage("黑方先手。选择落子或埋雷，然后点击棋盘。", false);
    render();
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

  function setMessage(text, alert) {
    el("message").textContent = text;
    el("messageIcon").textContent = alert ? "!" : "i";
    el("messageIcon").className = alert ? "alert-icon" : "info-icon";
  }

  function finishTurn(text, alert = false, delayOverlay = false) {
    if (board.every(Boolean)) {
      result = "draw";
      showResult();
      return;
    }
    player = player === 0 ? 1 : 0;
    mode = "stone";
    handoff = true;
    turn += 1;
    setMessage(`${text} 请将设备交给${NAMES[player]}。`, alert);
    render();
    if (delayOverlay) {
      blastTimer = window.setTimeout(showHandoff, 850);
    } else {
      showHandoff();
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
    el("handoffOverlay").classList.add("hidden");
    if (result === "draw") {
      el("resultTitle").textContent = "棋逢对手，和棋收场";
      el("resultCopy").textContent = "棋盘已经落满。";
      setMessage("棋盘已满，本局和棋。", false);
    } else {
      el("resultTitle").textContent = `${NAMES[result]}五子连珠`;
      el("resultCopy").textContent = "避开雷阵，赢下这盘攻防。";
      setMessage(`${NAMES[result]}连成五子，赢得本局！`, false);
    }
    render();
    el("resultOverlay").classList.remove("hidden");
    el("playAgainButton").focus();
  }

  function play(index) {
    if (result !== null || handoff || board[index] !== 0) return;

    if (mode === "mine") {
      if (minesLeft[player] === 0 || mines[player][index]) return;
      mines[player][index] = true;
      minesLeft[player] -= 1;
      finishTurn(`${NAMES[player]}埋下一枚地雷。`);
      return;
    }

    const opponent = player === 0 ? 1 : 0;
    board[index] = player + 1;
    if (mines[opponent][index]) {
      const row = Math.floor(index / SIZE);
      const col = index % SIZE;
      const affected = [
        index,
        row > 0 ? index - SIZE : -1,
        row < SIZE - 1 ? index + SIZE : -1,
        col > 0 ? index - 1 : -1,
        col < SIZE - 1 ? index + 1 : -1
      ].filter((cell) => cell >= 0);
      affected.forEach((cell) => { board[cell] = 0; });
      mines[opponent][index] = false;
      render(affected);
      finishTurn(`轰！${NAMES[player]}踩中地雷，十字范围内的棋子全部被炸掉。`, true, true);
      return;
    }

    if (hasFive(player)) {
      result = player;
      showResult();
      return;
    }
    finishTurn(`${NAMES[player]}落下一子。`);
  }

  function render(blast = []) {
    el("blackMines").textContent = minesLeft[0];
    el("whiteMines").textContent = minesLeft[1];
    el("turnLabel").textContent = result === null ? `第 ${turn} 回合` : "本局结束";
    el("statusText").textContent = result === "draw" ? "和棋" : result !== null ? `${NAMES[result]}胜利` : `${NAMES[player]}回合`;
    el("blackCard").classList.toggle("active", player === 0 && result === null);
    el("whiteCard").classList.toggle("active", player === 1 && result === null);
    el("stoneMode").className = mode === "stone" ? "selected" : "";
    el("mineMode").className = mode === "mine" ? "selected danger" : "";
    el("stoneMode").disabled = handoff || result !== null;
    el("mineMode").disabled = handoff || result !== null || minesLeft[player] === 0;
    el("modeStone").className = `mini-stone ${player === 0 ? "black-stone" : "white-stone"}`;

    boardEl.replaceChildren();
    board.forEach((cell, index) => {
      const row = Math.floor(index / SIZE);
      const col = index % SIZE;
      const ownMine = mines[player][index];
      const button = document.createElement("button");
      button.className = `cell${blast.includes(index) ? " blast" : ""}`;
      button.type = "button";
      button.setAttribute("role", "gridcell");
      button.setAttribute("aria-label", `${COLS[col]}${row + 1}${cell ? `，${cell === 1 ? "黑子" : "白子"}` : ""}${ownMine ? "，己方地雷" : ""}`);
      button.disabled = result !== null || handoff || cell !== 0 || (mode === "mine" && (minesLeft[player] === 0 || ownMine));
      button.addEventListener("click", () => play(index));
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

  el("topCoordinates").innerHTML = COLS.split("").map((value) => `<span>${value}</span>`).join("");
  el("sideCoordinates").innerHTML = Array.from({ length: SIZE }, (_, index) => `<span>${index + 1}</span>`).join("");
  el("stoneMode").addEventListener("click", () => { mode = "stone"; render(); });
  el("mineMode").addEventListener("click", () => { if (minesLeft[player] > 0) { mode = "mine"; render(); } });
  el("handoffButton").addEventListener("click", () => {
    handoff = false;
    el("handoffOverlay").classList.add("hidden");
    render();
  });
  el("resetButton").addEventListener("click", reset);
  el("playAgainButton").addEventListener("click", reset);
  el("rulesButton").addEventListener("click", () => {
    el("rulesOverlay").classList.remove("hidden");
    el("closeRulesButton").focus();
  });
  el("closeRulesButton").addEventListener("click", () => el("rulesOverlay").classList.add("hidden"));
  el("rulesOverlay").addEventListener("click", (event) => {
    if (event.target === el("rulesOverlay")) el("rulesOverlay").classList.add("hidden");
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") el("rulesOverlay").classList.add("hidden");
  });

  reset();
})();
