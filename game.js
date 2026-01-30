(() => {
  "use strict";

  const SIZE = 8;
  let currentSize = SIZE;
  const CELL_NORMAL_MAX = 99; // 0..99 普通（颜色）
  const CELL_BOMB_BASE = 100; // 100..199 炸弹（颜色）
  const CELL_RAINBOW = 200; // 彩虹球（无颜色）

  const TYPES = [
    { id: 0, a: "#ff4d6d", b: "#ff8fab" },
    { id: 1, a: "#7c5cff", b: "#b49bff" },
    { id: 2, a: "#00d9ff", b: "#7df2ff" },
    { id: 3, a: "#ffd166", b: "#ffe7a6" },
    { id: 4, a: "#06d6a0", b: "#87f5da" },
    { id: 5, a: "#ff8c42", b: "#ffc49b" },
  ];

  const boardEl = document.getElementById("board");
  const subTitleEl = document.getElementById("subTitle");
  const levelEl = document.getElementById("level");
  const movesEl = document.getElementById("moves");
  const timerEl = document.getElementById("timer");
  const timerStatEl = document.getElementById("timerStat");
  const goalEl = document.getElementById("goal");
  const progressFillEl = document.getElementById("progressFill");
  const scoreEl = document.getElementById("score");
  const comboEl = document.getElementById("combo");
  const restartBtn = document.getElementById("restartBtn");
  const settingsBtn = document.getElementById("settingsBtn");
  const hintBtn = document.getElementById("hintBtn");
  const bombBtn = document.getElementById("bombBtn");
  const rainbowBtn = document.getElementById("rainbowBtn");
  const bombCountEl = document.getElementById("bombCount");
  const rainbowCountEl = document.getElementById("rainbowCount");
  const hintEl = document.getElementById("hint");

  const toastEl = document.getElementById("toast");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const loginOverlay = document.getElementById("loginOverlay");
  const nameInput = document.getElementById("nameInput");
  const loginBtn = document.getElementById("loginBtn");
  const resultOverlay = document.getElementById("resultOverlay");
  const resultTitle = document.getElementById("resultTitle");
  const resultText = document.getElementById("resultText");
  const nextBtn = document.getElementById("nextBtn");
  const retryBtn = document.getElementById("retryBtn");
  const settingsOverlay = document.getElementById("settingsOverlay");
  const soundToggle = document.getElementById("soundToggle");
  const vibrateToggle = document.getElementById("vibrateToggle");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");
  const menuBtn = document.getElementById("menuBtn");
  const menuOverlay = document.getElementById("menuOverlay");
  const continueBtn = document.getElementById("continueBtn");
  const levelSelectBtn = document.getElementById("levelSelectBtn");
  const restartGameBtn = document.getElementById("restartGameBtn");
  const levelSelectOverlay = document.getElementById("levelSelectOverlay");
  const levelGrid = document.getElementById("levelGrid");
  const closeLevelSelectBtn = document.getElementById("closeLevelSelectBtn");
  const levelConfirmOverlay = document.getElementById("levelConfirmOverlay");
  const levelConfirmTitle = document.getElementById("levelConfirmTitle");
  const levelConfirmText = document.getElementById("levelConfirmText");
  const cancelLevelBtn = document.getElementById("cancelLevelBtn");
  const enterLevelBtn = document.getElementById("enterLevelBtn");

  /** @type {number[][]} */
  let grid = [];
  /** @type {boolean[][]} */
  let mask = [];

  let score = 0;
  let combo = 0;
  let locked = false;
  let timeLeft = 0;
  let timerInterval = null;

  // 关卡/进度
  const STORAGE = {
    name: "match3_name",
    settings: "match3_settings_v1",
    level: "match3_level_v1",
    levelProgress: "match3_level_progress_v1",
  };

  const DEFAULT_SETTINGS = {
    sound: true,
    vibrate: true,
  };

  /** @type {{sound:boolean,vibrate:boolean}} */
  let settings = { ...DEFAULT_SETTINGS };

  /** @type {{levelIndex:number, movesLeft:number, goal:any, inv:{bomb:number,rainbow:number}, goalProgress:number}} */
  let state = {
    levelIndex: 0,
    movesLeft: 0,
    goal: null,
    inv: { bomb: 0, rainbow: 0 },
    goalProgress: 0,
  };

  /** @type {Map<number, {completed:boolean, stars:number, bestScore:number}>} */
  let levelProgress = new Map();

  const LEVELS = [
    // 初级关卡 - 容易上手
    { moves: 25, goal: { type: "score", value: 500 }, reward: { bomb: 2, rainbow: 1 }, shape: "full", size: 5 },
    { moves: 28, goal: { type: "clearColor", color: 0, value: 8 }, reward: { bomb: 2, rainbow: 1 }, shape: "full", size: 6 },
    { moves: 25, goal: { type: "clearAny", value: 25 }, reward: { bomb: 2, rainbow: 2 }, shape: "full", size: 6 },
    { moves: 26, goal: { type: "score", value: 900 }, reward: { bomb: 3, rainbow: 2 }, shape: "full", size: 6 },
    // 中级关卡 - 难度提升
    { moves: 24, goal: { type: "clearColor", color: 1, value: 18 }, reward: { bomb: 3, rainbow: 2 }, shape: "full", size: 6 },
    { moves: 26, goal: { type: "clearAny", value: 45 }, reward: { bomb: 3, rainbow: 2 }, shape: "full", size: 7 },
    { moves: 25, goal: { type: "score", value: 1500 }, reward: { bomb: 4, rainbow: 3 }, shape: "full", size: 7 },
    { moves: 24, goal: { type: "clearColor", color: 2, value: 22 }, reward: { bomb: 4, rainbow: 3 }, shape: "full", size: 7 },
    // 高级关卡 - 更有挑战性
    { moves: 28, goal: { type: "clearAny", value: 55 }, reward: { bomb: 4, rainbow: 3 }, shape: "full", size: 8 },
    { moves: 30, goal: { type: "score", value: 2200 }, reward: { bomb: 5, rainbow: 4 }, shape: "full", size: 8 },
    // 缓冲关卡 - 稍微容易一些
    { moves: 30, goal: { type: "clearColor", color: 3, value: 20 }, reward: { bomb: 5, rainbow: 4 }, shape: "full", size: 7 },
    { moves: 28, goal: { type: "clearAny", value: 50 }, reward: { bomb: 5, rainbow: 4 }, shape: "full", size: 7 },
    { moves: 32, goal: { type: "score", value: 2000 }, reward: { bomb: 5, rainbow: 4 }, shape: "full", size: 7 },
    // 挑战关卡 - 更高难度
    { moves: 26, goal: { type: "clearColor", color: 4, value: 28 }, reward: { bomb: 6, rainbow: 5 }, shape: "full", size: 8 },
    { moves: 28, goal: { type: "clearAny", value: 65 }, reward: { bomb: 6, rainbow: 5 }, shape: "full", size: 8 },
    { moves: 30, goal: { type: "score", value: 2800 }, reward: { bomb: 6, rainbow: 5 }, shape: "full", size: 8 },
    // 限时关卡 - 棋子数目较多
    { timeLimit: 120, goal: { type: "clearAny", value: 80 }, reward: { bomb: 7, rainbow: 6 }, shape: "full", size: 8 },
    { timeLimit: 150, goal: { type: "clearColor", color: 0, value: 40 }, reward: { bomb: 7, rainbow: 6 }, shape: "full", size: 8 },
    { timeLimit: 120, goal: { type: "score", value: 3500 }, reward: { bomb: 7, rainbow: 6 }, shape: "full", size: 8 },
    { timeLimit: 180, goal: { type: "clearAny", value: 100 }, reward: { bomb: 8, rainbow: 7 }, shape: "full", size: 8 },
    { timeLimit: 150, goal: { type: "clearColor", color: 1, value: 50 }, reward: { bomb: 8, rainbow: 7 }, shape: "full", size: 8 },
    { timeLimit: 120, goal: { type: "score", value: 4000 }, reward: { bomb: 8, rainbow: 7 }, shape: "full", size: 8 },
    { timeLimit: 200, goal: { type: "clearAny", value: 120 }, reward: { bomb: 9, rainbow: 8 }, shape: "full", size: 8 },
    { timeLimit: 180, goal: { type: "clearColor", color: 2, value: 60 }, reward: { bomb: 9, rainbow: 8 }, shape: "full", size: 8 },
    { timeLimit: 150, goal: { type: "score", value: 4500 }, reward: { bomb: 9, rainbow: 8 }, shape: "full", size: 8 },
    { timeLimit: 220, goal: { type: "clearAny", value: 140 }, reward: { bomb: 10, rainbow: 9 }, shape: "full", size: 8 },
    { timeLimit: 200, goal: { type: "clearColor", color: 3, value: 70 }, reward: { bomb: 10, rainbow: 9 }, shape: "full", size: 8 },
    { timeLimit: 180, goal: { type: "score", value: 5000 }, reward: { bomb: 10, rainbow: 9 }, shape: "full", size: 8 },
    { timeLimit: 240, goal: { type: "clearAny", value: 160 }, reward: { bomb: 11, rainbow: 10 }, shape: "full", size: 8 },
    { timeLimit: 220, goal: { type: "clearColor", color: 4, value: 80 }, reward: { bomb: 11, rainbow: 10 }, shape: "full", size: 8 },
    { timeLimit: 200, goal: { type: "score", value: 5500 }, reward: { bomb: 11, rainbow: 10 }, shape: "full", size: 8 },
  ];

  /** @type {null|"bomb"|"rainbow"} */
  let pendingTool = null;
  /** @type {string|null} */
  let currentShape = null;

  /** pointer interaction */
  let pointerDown = false;
  /** @type {{r:number,c:number,x:number,y:number}|null} */
  let downInfo = null;

  let toastTimer = 0;
  let lastActivateTs = 0;

  // 统一的“点击/触摸/触控笔”激活事件绑定
  // - 优先使用 Pointer Events（现代浏览器/Windows/Android 最稳）
  // - 兜底 click
  // - 去重：避免一次操作触发多次
  function bindActivate(el, handler) {
    if (!el) return;
    const wrapped = (e) => {
      const now = Date.now();
      if (now - lastActivateTs < 220) return;
      lastActivateTs = now;
      handler(e);
    };

    // 尽量稳：pointerdown/pointerup/click 三重兜底
    // 注意：这里不要 preventDefault，避免某些浏览器/文件协议下把后续事件链搞乱
    el.addEventListener("pointerdown", wrapped);
    el.addEventListener("pointerup", wrapped);

    // 兜底 click（某些旧环境可能不支持 Pointer Events）
    el.addEventListener("click", wrapped);

    // 键盘无障碍兜底（Enter/Space）
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") wrapped(e);
    });
  }

  // 兜底：把运行时错误显示出来，避免“看起来卡住”
  window.addEventListener("error", (e) => {
    try {
      const msg = e?.error?.message || e?.message || "未知错误";
      showToast(`出错：${msg}`, 3000);
    } catch (_) {}
  });
  window.addEventListener("unhandledrejection", (e) => {
    try {
      const msg = e?.reason?.message || String(e?.reason || "未知错误");
      showToast(`Promise出错：${msg}`, 3000);
    } catch (_) {}
  });

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function idxToRC(index) {
    const r = Math.floor(index / currentSize);
    const c = index % currentSize;
    return { r, c };
  }

  function rcToIdx(r, c) {
    return r * currentSize + c;
  }

  function inBounds(r, c) {
    return r >= 0 && r < currentSize && c >= 0 && c < currentSize;
  }

  function cellKind(v) {
    if (v === CELL_RAINBOW) return "rainbow";
    if (v >= CELL_BOMB_BASE && v < CELL_RAINBOW) return "bomb";
    return "normal";
  }

  function cellColorIndex(v) {
    const kind = cellKind(v);
    if (kind === "rainbow") return -1;
    if (kind === "bomb") return v - CELL_BOMB_BASE;
    return v;
  }

  function cellMatchesColor(a, b) {
    // 仅用于普通匹配：炸弹算作其颜色；彩虹球不参与自然匹配（只通过交换触发）
    const ka = cellKind(a);
    const kb = cellKind(b);
    if (ka === "rainbow" || kb === "rainbow") return false;
    return cellColorIndex(a) === cellColorIndex(b);
  }

  // 替换为本地水果图片（0=apple 1=lanmei 2=ningmeng 3=orange 4=putao 5=banana）
  function tileColorByIndex(colorIdx) {
    const fruitNames = ["apple", "lanmei", "ningmeng", "orange", "putao", "banana"];
    const fruitName = fruitNames[colorIdx % fruitNames.length];
    return `url(./${fruitName}.png)`; // 图片和html/js同目录，直接引用
  }

  function setHud() {
    scoreEl.textContent = String(score);
    comboEl.textContent = String(combo);
    levelEl.textContent = String(state.levelIndex + 1);
    movesEl.textContent = String(state.movesLeft);
    
    // 显示或隐藏计时器
    if (timeLeft > 0) {
      timerStatEl.style.display = "";
      timerEl.textContent = String(Math.ceil(timeLeft));
    } else {
      timerStatEl.style.display = "none";
    }
    
    bombCountEl.textContent = String(state.inv.bomb);
    rainbowCountEl.textContent = String(state.inv.rainbow);

    const goal = state.goal;
    if (!goal) {
      goalEl.textContent = "-";
      progressFillEl.style.width = "0%";
      updateStars(0);
    } else if (goal.type === "score") {
      goalEl.textContent = `得分 ≥ ${goal.value}`;
      const progress = Math.min(100, (score / goal.value) * 100);
      progressFillEl.style.width = `${progress}%`;
      updateStars(progress);
    } else if (goal.type === "clearAny") {
      goalEl.textContent = `消除任意 ${state.goalProgress}/${goal.value}`;
      const progress = Math.min(100, (state.goalProgress / goal.value) * 100);
      progressFillEl.style.width = `${progress}%`;
      updateStars(progress);
    } else if (goal.type === "clearColor") {
      goalEl.textContent = `消除${colorName(goal.color)} ${state.goalProgress}/${goal.value}`;
      const progress = Math.min(100, (state.goalProgress / goal.value) * 100);
      progressFillEl.style.width = `${progress}%`;
      updateStars(progress);
    }
  }

  function colorName(idx) {
    const names = ["苹果", "蓝莓", "柠檬", "橙子", "葡萄", "香蕉"];
    return names[idx] ?? `水果#${idx}`;
  }

  function updateStars(progress) {
    const star1 = document.querySelector(".star1");
    const star2 = document.querySelector(".star2");
    const star3 = document.querySelector(".star3");
    
    // 目标对应1星的最低要求
    if (progress >= 100) {
      star1.classList.add("active");
      star2.classList.add("active");
      star3.classList.add("active");
    } else if (progress >= 66.67) {
      star1.classList.add("active");
      star2.classList.add("active");
      star3.classList.remove("active");
    } else if (progress >= 33.33) {
      star1.classList.add("active");
      star2.classList.remove("active");
      star3.classList.remove("active");
    } else {
      star1.classList.remove("active");
      star2.classList.remove("active");
      star3.classList.remove("active");
    }
  }

  function showToast(text, ms = 1200) {
    clearTimeout(toastTimer);
    toastEl.textContent = text;
    toastEl.classList.add("show");
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms);
  }

  function setOverlay(el, on) {
    el.hidden = !on;
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE.settings);
      if (!raw) return;
      const obj = JSON.parse(raw);
      settings = { ...DEFAULT_SETTINGS, ...obj };
    } catch (_) {}
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE.settings, JSON.stringify(settings));
    } catch (_) {}
  }

  function loadLevelIndex() {
    try {
      const raw = localStorage.getItem(STORAGE.level);
      const n = raw ? Number(raw) : 0;
      if (Number.isFinite(n) && n >= 0) state.levelIndex = Math.floor(n);
    } catch (_) {}
  }

  function saveLevelIndex() {
    try {
      localStorage.setItem(STORAGE.level, String(state.levelIndex));
    } catch (_) {}
  }

  function loadLevelProgress() {
    try {
      const raw = localStorage.getItem(STORAGE.levelProgress);
      if (!raw) return;
      const obj = JSON.parse(raw);
      levelProgress = new Map(Object.entries(obj).map(([k, v]) => [Number(k), v]));
    } catch (_) {}
  }

  function saveLevelProgress() {
    try {
      const obj = Object.fromEntries(levelProgress.entries());
      localStorage.setItem(STORAGE.levelProgress, JSON.stringify(obj));
    } catch (_) {}
  }

  function getLevelProgress(levelIndex) {
    return levelProgress.get(levelIndex) || { completed: false, stars: 0, bestScore: 0 };
  }

  function updateLevelProgress(levelIndex, completed, stars, bestScore) {
    const current = getLevelProgress(levelIndex);
    levelProgress.set(levelIndex, {
      completed: completed || current.completed,
      stars: Math.max(stars, current.stars),
      bestScore: Math.max(bestScore, current.bestScore),
    });
    saveLevelProgress();
  }

  function vibrate(ms) {
    try {
      if (settings.vibrate && navigator.vibrate) navigator.vibrate(ms);
    } catch (_) {}
  }

  // 极简音效：WebAudio beep（无需资源文件）
  let audioCtx = null;
  function beep(freq = 440, duration = 0.06, type = "sine", gain = 0.05) {
    if (!settings.sound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
      osc.connect(g);
      g.connect(audioCtx.destination);
      osc.start(t0);
      osc.stop(t0 + duration);
    } catch (_) {}
  }

  function showLoading(on) {
    setOverlay(loadingOverlay, on);
  }

  function isMaskedIn(r, c) {
    return inBounds(r, c) && mask[r]?.[c] === true;
  }

  function pickTypeAvoiding(r, c) {
    // 目标：生成时避免立即产生 3 连（横/竖）。
    const maxTry = 20;
    for (let t = 0; t < maxTry; t++) {
      const type = Math.floor(Math.random() * TYPES.length);
      // check horizontal
      if (c >= 2) {
        if (isMaskedIn(r, c - 1) && isMaskedIn(r, c - 2)) {
          const a = grid[r][c - 1];
          const b = grid[r][c - 2];
          if (cellMatchesColor(a, type) && cellMatchesColor(b, type)) continue;
        }
      }
      // check vertical
      if (r >= 2) {
        if (isMaskedIn(r - 1, c) && isMaskedIn(r - 2, c)) {
          const a = grid[r - 1][c];
          const b = grid[r - 2][c];
          if (cellMatchesColor(a, type) && cellMatchesColor(b, type)) continue;
        }
      }
      return type;
    }
    return Math.floor(Math.random() * TYPES.length);
  }

  function makeMask(shapeName) {
    const m = Array.from({ length: currentSize }, () => Array.from({ length: currentSize }, () => true));
    if (shapeName === "full") return m;
    if (shapeName === "diamond") {
      // 菱形
      const mid = (currentSize - 1) / 2;
      for (let r = 0; r < currentSize; r++) {
        for (let c = 0; c < currentSize; c++) {
          const dist = Math.abs(r - mid) + Math.abs(c - mid);
          m[r][c] = dist <= mid + 1; // 稍微饱满
        }
      }
      return m;
    }
    if (shapeName === "holes") {
      // 角落挖洞 + 少量随机洞（保证不太碎）
      for (let r = 0; r < currentSize; r++) {
        for (let c = 0; c < currentSize; c++) {
          m[r][c] = true;
        }
      }
      const holes = [
        [0, 0],
        [0, currentSize - 1],
        [currentSize - 1, 0],
        [currentSize - 1, currentSize - 1],
      ];
      for (const [r, c] of holes) m[r][c] = false;
      for (let i = 0; i < 7; i++) {
        const r = 1 + Math.floor(Math.random() * (currentSize - 2));
        const c = 1 + Math.floor(Math.random() * (currentSize - 2));
        // 避免邻接过多导致断裂：简单限制
        const mid = Math.floor(currentSize / 2);
        if ((r === mid && c === mid) || (r === mid + 1 && c === mid + 1)) continue;
        m[r][c] = Math.random() < 0.28 ? false : true;
      }
      // 兜底：确保至少一定数量的格子可用
      let count = 0;
      const minCount = Math.floor(currentSize * currentSize * 0.6);
      for (let r = 0; r < currentSize; r++) for (let c = 0; c < currentSize; c++) if (m[r][c]) count++;
      if (count < minCount) return makeMask("diamond");
      return m;
    }
    return m;
  }

  function initGrid() {
    const level = LEVELS[state.levelIndex % LEVELS.length];
    // 每一局/每次重开都变化：在关卡预设形状基础上随机挑一个变体
    const variants = ["full", "diamond", "holes"];
    const preferred = level.shape;
    const shape = Math.random() < 0.5 ? preferred : variants[Math.floor(Math.random() * variants.length)];
    currentShape = shape;
    mask = makeMask(shape);
    grid = Array.from({ length: currentSize }, () => Array.from({ length: currentSize }, () => -1));
    for (let r = 0; r < currentSize; r++) {
      for (let c = 0; c < currentSize; c++) {
        if (!mask[r][c]) {
          grid[r][c] = -1;
          continue;
        }
        grid[r][c] = pickTypeAvoiding(r, c);
      }
    }
  }

  function buildBoardDom() {
    boardEl.style.gridTemplateColumns = `repeat(${currentSize}, 1fr)`;
    boardEl.innerHTML = "";
    for (let i = 0; i < currentSize * currentSize; i++) {
      const { r, c } = idxToRC(i);
      const tile = document.createElement("div");
      tile.className = "tile pop";
      tile.dataset.r = String(r);
      tile.dataset.c = String(c);
      tile.setAttribute("role", "button");
      tile.setAttribute("aria-label", `第${r + 1}行第${c + 1}列`);

      const inner = document.createElement("div");
      inner.className = "tileInner";
      if (mask[r][c]) inner.style.background = tileColorByIndex(cellColorIndex(grid[r][c]));
      tile.appendChild(inner);

      boardEl.appendChild(tile);
    }
  }

  function tileElAt(r, c) {
    return boardEl.children[rcToIdx(r, c)];
  }

  function renderTiles() {
    for (let r = 0; r < currentSize; r++) {
      for (let c = 0; c < currentSize; c++) {
        const tile = tileElAt(r, c);
        const inner = tile.firstElementChild;
        tile.classList.remove("hole", "specialBomb", "specialRainbow");
        if (!mask[r][c]) {
          tile.classList.add("hole");
          continue;
        }

        const v = grid[r][c];
        const kind = cellKind(v);
        if (kind === "rainbow") {
          tile.classList.add("specialRainbow");
        } else if (kind === "bomb") {
          tile.classList.add("specialBomb");
        }

        const colorIdx = cellColorIndex(v);
        if (colorIdx >= 0) inner.style.background = tileColorByIndex(colorIdx);
      }
    }
  }

  function clearSelection() {
    for (const el of boardEl.querySelectorAll(".selected")) el.classList.remove("selected");
  }

  function showLevelConfirm(levelIndex) {
    const progress = getLevelProgress(levelIndex);
    const level = LEVELS[levelIndex % LEVELS.length];

    // 设置卡片内容
    levelConfirmTitle.textContent = `关卡 ${levelIndex + 1}`;

    // 显示关卡类型
    let levelTypeText = level.timeLimit ? `限时 ${level.timeLimit}秒` : `步数 ${level.moves}`;

    // 显示最高记录
    if (progress.bestScore > 0) {
      levelConfirmText.textContent = `${levelTypeText} | 最高记录：${progress.bestScore}分`;
    } else {
      levelConfirmText.textContent = `${levelTypeText} | 暂无记录`;
    }

    // 保存当前选择的关卡索引
    levelConfirmOverlay.dataset.levelIndex = levelIndex;

    // 显示确认卡片
    setOverlay(levelSelectOverlay, false);
    setOverlay(levelConfirmOverlay, true);
  }

  function renderLevelSelect() {
    levelGrid.innerHTML = "";
    const maxUnlockedLevel = Math.max(
      ...Array.from(levelProgress.keys())
        .filter(idx => levelProgress.get(idx)?.completed)
        .map(idx => idx + 1),
      0
    );

    for (let i = 0; i < LEVELS.length; i++) {
      const levelBtn = document.createElement("div");
      const progress = getLevelProgress(i);
      const isUnlocked = i <= maxUnlockedLevel;
      const level = LEVELS[i];
      
      levelBtn.className = "levelBtn";
      if (!isUnlocked) levelBtn.classList.add("locked");
      if (progress.completed) levelBtn.classList.add("completed");
      
      const levelNum = document.createElement("div");
      levelNum.textContent = i + 1;
      levelBtn.appendChild(levelNum);

      // 添加关卡类型标识
      const levelType = document.createElement("div");
      levelType.className = "levelType";
      if (level.timeLimit) {
        levelType.textContent = "限时";
        levelType.classList.add("timeLimit");
      } else {
        levelType.textContent = "步数";
        levelType.classList.add("movesLimit");
      }
      levelBtn.appendChild(levelType);
      
      const stars = document.createElement("div");
      stars.className = "stars";
      for (let s = 0; s < 3; s++) {
        const star = document.createElement("span");
        star.className = "star";
        star.textContent = "★";
        if (s < progress.stars) star.classList.add("active");
        stars.appendChild(star);
      }
      levelBtn.appendChild(stars);
      
      if (isUnlocked) {
        levelBtn.addEventListener("click", () => {
          showLevelConfirm(i);
        });
      }
      
      levelGrid.appendChild(levelBtn);
    }
  }

  function clearHintTargets() {
    for (const el of boardEl.querySelectorAll(".hintTarget")) el.classList.remove("hintTarget");
  }

  function setHintTarget(r, c, on) {
    const el = tileElAt(r, c);
    if (!el) return;
    if (on) el.classList.add("hintTarget");
    else el.classList.remove("hintTarget");
  }

  function setSelected(r, c, on) {
    const el = tileElAt(r, c);
    if (!el) return;
    if (on) el.classList.add("selected");
    else el.classList.remove("selected");
  }

  function adjacent(a, b) {
    const dr = Math.abs(a.r - b.r);
    const dc = Math.abs(a.c - b.c);
    return dr + dc === 1;
  }

  function swap(rc1, rc2) {
    const tmp = grid[rc1.r][rc1.c];
    grid[rc1.r][rc1.c] = grid[rc2.r][rc2.c];
    grid[rc2.r][rc2.c] = tmp;
  }

  function hasImmediateMatches() {
    const { matched } = findMatchesWithRuns();
    return matched.size > 0;
  }

  /** @returns {{a:{r:number,c:number},b:{r:number,c:number}}|null} */
  function findAnyPossibleMove() {
    // 先扫右/下相邻，模拟交换判断是否可消或可触发道具
    for (let r = 0; r < currentSize; r++) {
      for (let c = 0; c < currentSize; c++) {
        if (!mask[r][c]) continue;
        const a = { r, c };
        const candidates = [
          { r, c: c + 1 },
          { r: r + 1, c },
        ];
        for (const b of candidates) {
          if (!isMaskedIn(b.r, b.c)) continue;
          const va = grid[a.r][a.c];
          const vb = grid[b.r][b.c];
          const ka = cellKind(va);
          const kb = cellKind(vb);
          // 交换涉及彩虹/炸弹，必然可触发
          if (ka === "rainbow" || kb === "rainbow" || ka === "bomb" || kb === "bomb") {
            return { a, b };
          }
          swap(a, b);
          const { matched } = findMatchesWithRuns();
          swap(a, b);
          if (matched.size > 0) return { a, b };
        }
      }
    }
    return null;
  }

  async function ensureSolvableOrShuffle() {
    // 若无可移动步，自动重洗到“无立即消除且有解”
    let move = findAnyPossibleMove();
    if (move) return true;
    // 静默重洗，不显示提示
    const wasLocked = locked;
    locked = true;

    const cells = [];
    for (let r = 0; r < currentSize; r++) for (let c = 0; c < currentSize; c++) if (mask[r][c]) cells.push({ r, c });
    const values = cells.map((p) => grid[p.r][p.c]);

    function shuffleArray(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = arr[i];
        arr[i] = arr[j];
        arr[j] = t;
      }
    }

    let ok = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      shuffleArray(values);
      for (let i = 0; i < cells.length; i++) {
        const p = cells[i];
        grid[p.r][p.c] = values[i];
      }
      // 允许有立即消除，只要有可移动的步就行
      move = findAnyPossibleMove();
      if (move) {
        ok = true;
        break;
      }
    }

    if (!ok) {
      // 兜底：完全重开本关卡棋盘（保留步数/目标/道具/分数）
      initGrid();
      buildBoardDom();
      renderTiles();
      await resolveMatchesLoop({ allowPraise: false });
    } else {
      renderTiles();
    }

    locked = wasLocked;
    return true;
  }

  async function showHint() {
    if (locked) return;
    clearHintTargets();
    const move = findAnyPossibleMove();
    if (!move) {
      await ensureSolvableOrShuffle();
      return;
    }
    setHintTarget(move.a.r, move.a.c, true);
    setHintTarget(move.b.r, move.b.c, true);
    // 不显示提示词
    beep(560, 0.05, "triangle", 0.04);
    await sleep(850);
    clearHintTargets();
  }

  /**
   * @returns {{matched:Set<string>, runs:Array<{cells:Array<{r:number,c:number}>,len:number,dir:"h"|"v",color:number}>}}
   */
  function findMatchesWithRuns() {
    const matched = new Set();
    /** @type {Array<{cells:Array<{r:number,c:number}>,len:number,dir:"h"|"v",color:number}>} */
    const runs = [];

    // horizontal
    for (let r = 0; r < currentSize; r++) {
      let runStart = -1;
      let runColor = -1;
      let runLen = 0;
      for (let c = 0; c <= currentSize; c++) {
        const isEnd = c === currentSize;
        const ok = !isEnd && mask[r][c] && cellKind(grid[r][c]) !== "rainbow";
        const color = ok ? cellColorIndex(grid[r][c]) : -999;

        if (!ok) {
          if (runLen >= 3) {
            const cells = [];
            for (let k = runStart; k < runStart + runLen; k++) {
              matched.add(`${r},${k}`);
              cells.push({ r, c: k });
            }
            runs.push({ cells, len: runLen, dir: "h", color: runColor });
          }
          runStart = -1;
          runColor = -1;
          runLen = 0;
          continue;
        }

        if (runLen === 0) {
          runStart = c;
          runColor = color;
          runLen = 1;
        } else if (color === runColor) {
          runLen += 1;
        } else {
          if (runLen >= 3) {
            const cells = [];
            for (let k = runStart; k < runStart + runLen; k++) {
              matched.add(`${r},${k}`);
              cells.push({ r, c: k });
            }
            runs.push({ cells, len: runLen, dir: "h", color: runColor });
          }
          runStart = c;
          runColor = color;
          runLen = 1;
        }
      }
    }

    // vertical
    for (let c = 0; c < currentSize; c++) {
      let runStart = -1;
      let runColor = -1;
      let runLen = 0;
      for (let r = 0; r <= currentSize; r++) {
        const isEnd = r === currentSize;
        const ok = !isEnd && mask[r][c] && cellKind(grid[r][c]) !== "rainbow";
        const color = ok ? cellColorIndex(grid[r][c]) : -999;

        if (!ok) {
          if (runLen >= 3) {
            const cells = [];
            for (let k = runStart; k < runStart + runLen; k++) {
              matched.add(`${k},${c}`);
              cells.push({ r: k, c });
            }
            runs.push({ cells, len: runLen, dir: "v", color: runColor });
          }
          runStart = -1;
          runColor = -1;
          runLen = 0;
          continue;
        }

        if (runLen === 0) {
          runStart = r;
          runColor = color;
          runLen = 1;
        } else if (color === runColor) {
          runLen += 1;
        } else {
          if (runLen >= 3) {
            const cells = [];
            for (let k = runStart; k < runStart + runLen; k++) {
              matched.add(`${k},${c}`);
              cells.push({ r: k, c });
            }
            runs.push({ cells, len: runLen, dir: "v", color: runColor });
          }
          runStart = r;
          runColor = color;
          runLen = 1;
        }
      }
    }

    // 检测交叉的五连消（T形、L形、十字形）
    const horizontalRuns = runs.filter(r => r.dir === "h" && r.len >= 3);
    const verticalRuns = runs.filter(r => r.dir === "v" && r.len >= 3);
    
    for (const hRun of horizontalRuns) {
      for (const vRun of verticalRuns) {
        if (hRun.color !== vRun.color) continue;
        
        // 检查是否有交叉点
        for (const hCell of hRun.cells) {
          for (const vCell of vRun.cells) {
            if (hCell.r === vCell.r && hCell.c === vCell.c) {
              // 找到交叉点，计算总长度
              const totalLen = hRun.len + vRun.len - 1;
              if (totalLen >= 5) {
                // 标记为特殊的五连消
                hRun.isFiveMatch = true;
                vRun.isFiveMatch = true;
                hRun.crossPoint = { r: hCell.r, c: hCell.c };
                vRun.crossPoint = { r: hCell.r, c: hCell.c };
              }
            }
          }
        }
      }
    }

    return { matched, runs };
  }

  function sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  function flashMatched(matched) {
    for (const key of matched) {
      const [r, c] = key.split(",").map((n) => Number(n));
      const el = tileElAt(r, c);
      el.classList.add("shake", "explode", "flash");
      
      // 添加波纹效果
      const ripple = document.createElement("div");
      ripple.className = "ripple";
      el.appendChild(ripple);
      
      // 动画结束后移除波纹元素
      setTimeout(() => {
        if (ripple.parentNode === el) {
          el.removeChild(ripple);
        }
      }, 500);
    }
    // 清理动画类
    setTimeout(() => {
      for (const el of boardEl.querySelectorAll(".shake")) el.classList.remove("shake");
      for (const el of boardEl.querySelectorAll(".explode")) el.classList.remove("explode");
      for (const el of boardEl.querySelectorAll(".flash")) el.classList.remove("flash");
    }, 400);
  }

  function removeMatched(matched, keepKeyToValue = null) {
    for (const key of matched) {
      if (keepKeyToValue && Object.prototype.hasOwnProperty.call(keepKeyToValue, key)) continue;
      const [r, c] = key.split(",").map((n) => Number(n));
      if (!mask[r][c]) continue;
      grid[r][c] = -1;
    }
    if (keepKeyToValue) {
      for (const [key, val] of Object.entries(keepKeyToValue)) {
        const [r, c] = key.split(",").map((n) => Number(n));
        if (!mask[r][c]) continue;
        grid[r][c] = val;
      }
    }
  }

  function collapseAndRefillFixed() {
    for (let c = 0; c < currentSize; c++) {
      const col = [];
      for (let r = currentSize - 1; r >= 0; r--) {
        if (!mask[r][c]) continue;
        if (grid[r][c] !== -1) col.push(grid[r][c]);
      }
      let need = 0;
      for (let r = 0; r < currentSize; r++) if (mask[r][c]) need++;

      // 从底部向上填充，使用pickTypeAvoiding避免生成三个相同的元素
      let idx = 0;
      for (let r = currentSize - 1; r >= 0; r--) {
        if (!mask[r][c]) continue;
        if (idx < col.length) {
          grid[r][c] = col[idx++];
        } else {
          // 新生成的元素使用pickTypeAvoiding来避免三个相同的元素
          grid[r][c] = pickTypeAvoiding(r, c);
        }
      }
    }
  }

  function applyClearToGoal(matched) {
    const goal = state.goal;
    if (!goal) return;
    if (goal.type === "score") return;

    // 只统计被消除的非空格
    let clearedAny = 0;
    let clearedColor = 0;
    for (const key of matched) {
      const [r, c] = key.split(",").map((n) => Number(n));
      if (!mask[r][c]) continue;
      const v = grid[r][c];
      if (v === -1) continue;
      const kind = cellKind(v);
      if (kind === "rainbow") continue;
      const color = cellColorIndex(v);
      clearedAny += 1;
      if (goal.type === "clearColor" && color === goal.color) clearedColor += 1;
    }
    if (goal.type === "clearAny") state.goalProgress += clearedAny;
    if (goal.type === "clearColor") state.goalProgress += clearedColor;
  }

  function goalCompleted() {
    const goal = state.goal;
    if (!goal) return false;
    if (goal.type === "score") return score >= goal.value;
    if (goal.type === "clearAny") return state.goalProgress >= goal.value;
    if (goal.type === "clearColor") return state.goalProgress >= goal.value;
    return false;
  }

  function praiseForCombo(k) {
    const list = ["漂亮！", "太强了！", "连消高手！", "继续保持！", "神操作！"];
    return list[(k - 2) % list.length];
  }

  async function resolveMatchesLoop({ allowPraise = true } = {}) {
    combo = 0;
    setHud();
    let anyResolved = false;

    while (true) {
      const { matched, runs } = findMatchesWithRuns();
      if (matched.size === 0) break;
      anyResolved = true;

      combo += 1;
      if (allowPraise && combo >= 2) showToast(praiseForCombo(combo), 900);

      // 检查是否需要生成特殊道具
      let keep = null;
      let rainbowGenerated = false;
      
      // 检查是否有五连消（直线五连或交叉五连）
      for (const run of runs) {
        // 任何五个或更多相同颜色的格子连成直线都生成彩虹球
        if (run.len >= 5) {
          const randomCell = run.cells[Math.floor(Math.random() * run.cells.length)];
          keep = { [`${randomCell.r},${randomCell.c}`]: CELL_RAINBOW };
          showToast("彩虹球！", 900);
          rainbowGenerated = true;
          break;
        }
        // 检查是否有交叉的五连消（T形、L形、十字形）
        if (run.isFiveMatch && run.crossPoint) {
          keep = { [`${run.crossPoint.r},${run.crossPoint.c}`]: CELL_RAINBOW };
          showToast("彩虹球！", 900);
          rainbowGenerated = true;
          break;
        }
      }

      // 如果没有生成彩虹球，检查是否需要生成炸弹
      if (!rainbowGenerated) {
        for (const run of runs) {
          if (run.len === 4) {
            const randomCell = run.cells[Math.floor(Math.random() * run.cells.length)];
            keep = { [`${randomCell.r},${randomCell.c}`]: CELL_BOMB_BASE + run.color };
            showToast("炸弹！", 900);
            break;
          }
        }
      }
      

      
      // 如果没有找到交叉情况，检查单个run（任何五个或更多相同颜色的格子连成直线都生成彩虹球）
      if (!keep) {
        console.log("检查runs:", runs); // 调试信息
        for (const run of runs) {
          console.log("run.len:", run.len, "run.color:", run.color); // 调试信息
          // 任何五个或更多相同颜色的格子连成直线都生成彩虹球
          if (run.len >= 5) {
            const randomCell = run.cells[Math.floor(Math.random() * run.cells.length)];
            keep = { [`${randomCell.r},${randomCell.c}`]: CELL_RAINBOW };
            showToast("彩虹球！", 900);
            break;
          } else if (run.len === 4 && !keep) {
            const randomCell = run.cells[Math.floor(Math.random() * run.cells.length)];
            keep = { [`${randomCell.r},${randomCell.c}`]: CELL_BOMB_BASE + run.color };
            showToast("炸弹！", 900);
          }
        }
      }

      // 检查matched中是否有炸弹，如果有则触发爆炸
      for (const key of matched) {
        const [r, c] = key.split(",").map((n) => Number(n));
        const v = grid[r][c];
        if (cellKind(v) === "bomb") {
          const affected = activateBombAt(r, c);
          for (const affectedKey of affected) {
            matched.add(affectedKey);
          }
        }
      }

      applyClearToGoal(matched);
      const gained = matched.size * 10 * combo;
      score += gained;
      setHud();
      flashMatched(matched);
      beep(520 + combo * 40, 0.05, "triangle", 0.05);
      vibrate(10);
      await sleep(350); // 增加停顿时间，让爆炸效果更明显
      removeMatched(matched, keep);
      collapseAndRefillFixed();
      renderTiles();
      await sleep(180); // 增加填充后的停顿时间
    }

    combo = 0;
    setHud();
    return anyResolved;
  }

  async function applyOneClearStep(matched, { keep = null, comboMul = 1, sound = true } = {}) {
    if (!matched || matched.size === 0) return;
    applyClearToGoal(matched);
    const gained = matched.size * 10 * comboMul;
    score += gained;
    setHud();
    flashMatched(matched);
    if (sound) beep(520 + comboMul * 30, 0.05, "triangle", 0.05);
    vibrate(10);
    await sleep(350); // 增加停顿时间，让爆炸效果更明显
    removeMatched(matched, keep);
    collapseAndRefillFixed();
    renderTiles();
    await sleep(180); // 增加填充后的停顿时间
  }

  function activateBombAt(r, c) {
    const affected = new Set();
    // 随机选择三种爆炸效果之一：0=3x3范围，1=整行，2=整列
    const bombType = Math.floor(Math.random() * 3);
    
    if (bombType === 0) {
      // 3x3范围爆炸
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const rr = r + dr;
          const cc = c + dc;
          if (!isMaskedIn(rr, cc)) continue;
          affected.add(`${rr},${cc}`);
        }
      }
    } else if (bombType === 1) {
      // 整行爆炸
      for (let cc = 0; cc < currentSize; cc++) {
        if (!isMaskedIn(r, cc)) continue;
        affected.add(`${r},${cc}`);
      }
    } else {
      // 整列爆炸
      for (let rr = 0; rr < currentSize; rr++) {
        if (!isMaskedIn(rr, c)) continue;
        affected.add(`${rr},${c}`);
      }
    }
    
    return affected;
  }

  function activateRainbowWithNeighbor(r, c, neighborCellValue) {
    // 清掉邻居的颜色（炸弹按其颜色；邻居若也是彩虹，就全清）
    const affected = new Set();
    if (cellKind(neighborCellValue) === "rainbow") {
      for (let rr = 0; rr < currentSize; rr++) {
        for (let cc = 0; cc < currentSize; cc++) {
          if (!mask[rr][cc]) continue;
          affected.add(`${rr},${cc}`);
        }
      }
      return affected;
    }
    const color = cellColorIndex(neighborCellValue);
    for (let rr = 0; rr < currentSize; rr++) {
      for (let cc = 0; cc < currentSize; cc++) {
        if (!mask[rr][cc]) continue;
        const v = grid[rr][cc];
        if (cellKind(v) === "rainbow") continue;
        if (cellColorIndex(v) === color) affected.add(`${rr},${cc}`);
      }
    }
    return affected;
  }

  async function convertMovesToBombs() {
    const movesLeft = state.movesLeft;
    if (movesLeft <= 0) return;
    
    // showToast(`剩余${movesLeft}步变成炸弹！`, 1200);
    // await sleep(500);
    
    // 随机选择位置放置炸弹
    const positions = [];
    for (let r = 0; r < currentSize; r++) {
      for (let c = 0; c < currentSize; c++) {
        if (mask[r][c]) positions.push({ r, c });
      }
    }
    
    // 随机放置炸弹
    const bombPositions = [];
    for (let i = 0; i < movesLeft; i++) {
      const idx = Math.floor(Math.random() * positions.length);
      bombPositions.push(positions[idx]);
      positions.splice(idx, 1);
    }
    
    // 获取步数元素的位置
    const movesRect = movesEl.getBoundingClientRect();

    // 让剩余步数一个个快速飞出
    for (let i = 0; i < bombPositions.length; i++) {
      const pos = bombPositions[i];
      const el = tileElAt(pos.r, pos.c);
      if (el) {
        const targetRect = el.getBoundingClientRect();
        
        // 创建炸弹飞入元素
        const bombFly = document.createElement("div");
        bombFly.className = "bomb-fly";
        bombFly.style.left = movesRect.left + movesRect.width / 2 + "px";
        bombFly.style.top = movesRect.top + "px";
        document.body.appendChild(bombFly);
        
        // 设置目标位置
        setTimeout(() => {
          bombFly.style.left = targetRect.left + targetRect.width / 2 + "px";
          bombFly.style.top = targetRect.top + "px";
        }, 10);
        
        // 炸弹到达后引爆
        setTimeout(async () => {
          bombFly.remove();
          el.classList.add("bomb-appear");
          
          const affected = activateBombAt(pos.r, pos.c);
          
          // 创建分数飞入特效
          const scoreEl = document.createElement("div");
          scoreEl.className = "score-fly";
          scoreEl.textContent = `+${affected.size * 10}`;
          scoreEl.style.left = targetRect.left + targetRect.width / 2 + "px";
          scoreEl.style.top = targetRect.top + "px";
          document.body.appendChild(scoreEl);
          setTimeout(() => scoreEl.remove(), 1000);
          
          await applyOneClearStep(affected, { comboMul: 1, sound: true });
        }, 200);
        
        await sleep(200);
      }
    }
  }

  async function clearSetAndCascade(matched) {
    if (matched.size === 0) return;
    await applyOneClearStep(matched, { comboMul: 1, sound: true });
    await resolveMatchesLoop();
  }

  async function trySwapAndResolve(a, b) {
    if (locked) return;
    if (!adjacent(a, b)) return;
    if (!isMaskedIn(a.r, a.c) || !isMaskedIn(b.r, b.c)) return;

    locked = true;
    const va = grid[a.r][a.c];
    const vb = grid[b.r][b.c];

    // 特殊道具通过交换直接触发
    if (cellKind(va) === "bomb" && cellKind(vb) === "bomb") {
      // 双炸弹：清更大范围
      swap(a, b);
      renderTiles();
      await sleep(80);
      const matched = new Set();
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) if (isMaskedIn(a.r + dr, a.c + dc)) matched.add(`${a.r + dr},${a.c + dc}`);
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) if (isMaskedIn(b.r + dr, b.c + dc)) matched.add(`${b.r + dr},${b.c + dc}`);
      state.movesLeft = Math.max(0, state.movesLeft - 1);
      setHud();
      await clearSetAndCascade(matched);
      await afterMoveCheckEnd();
      await ensureSolvableOrShuffle();
      locked = false;
      return;
    }

    if (cellKind(va) === "rainbow" || cellKind(vb) === "rainbow") {
      swap(a, b);
      renderTiles();
      await sleep(80);
      const rainbowPos = cellKind(va) === "rainbow" ? a : b;
      const otherPos = rainbowPos === a ? b : a;
      const otherVal = grid[otherPos.r][otherPos.c];
      
      // 炸弹和彩虹球交换，触发特殊清屏效果
      if (cellKind(otherVal) === "bomb") {
        // 先显示提示，让玩家看清楚
        hintEl.textContent = "炸弹彩虹清屏！";
        await sleep(500);
        
        const matched = new Set();
        for (let rr = 0; rr < currentSize; rr++) {
          for (let cc = 0; cc < currentSize; cc++) {
            if (!mask[rr][cc]) continue;
            matched.add(`${rr},${cc}`);
          }
        }
        state.movesLeft = Math.max(0, state.movesLeft - 1);
        setHud();
        await clearSetAndCascade(matched);
        hintEl.textContent = "在格子上滑动（上下左右）交换";
        await afterMoveCheckEnd();
        await ensureSolvableOrShuffle();
        locked = false;
        return;
      }
      
      // 普通彩虹球交换
      // 先显示提示，让玩家看清楚
      hintEl.textContent = "彩虹爆发！";
      await sleep(400);
      
      const matched = activateRainbowWithNeighbor(rainbowPos.r, rainbowPos.c, otherVal);
      matched.add(`${rainbowPos.r},${rainbowPos.c}`);
      state.movesLeft = Math.max(0, state.movesLeft - 1);
      setHud();
      await clearSetAndCascade(matched);
      hintEl.textContent = "在格子上滑动（上下左右）交换";
      await afterMoveCheckEnd();
      await ensureSolvableOrShuffle();
      locked = false;
      return;
    }

    if (cellKind(va) === "bomb" || cellKind(vb) === "bomb") {
      const bombPos = cellKind(va) === "bomb" ? a : b;
      const otherPos = bombPos === a ? b : a;
      const bombVal = grid[bombPos.r][bombPos.c];
      const otherVal = grid[otherPos.r][otherPos.c];
      
      // 炸弹现在可以与任何元素交换并触发爆炸效果
      if (true) {
        swap(a, b);
        renderTiles();
        await sleep(80);
        const matched = activateBombAt(bombPos.r, bombPos.c);
        // 确保炸弹本身被加入到matched集合中，以便被移除
        const bombKey = `${bombPos.r},${bombPos.c}`;
        matched.add(bombKey);
        
        // 确保炸弹被移除，不保留
        state.movesLeft = Math.max(0, state.movesLeft - 1);
        setHud();
        hintEl.textContent = "炸弹爆炸！";
        await clearSetAndCascade(matched, { keep: null });
        hintEl.textContent = "在格子上滑动（上下左右）交换";
        await afterMoveCheckEnd();
        await ensureSolvableOrShuffle();
        locked = false;
        return;
      }
      

    }

    // 普通交换
    swap(a, b);
    renderTiles();
    beep(340, 0.04, "sine", 0.04);
    await sleep(80);

    const { matched, runs } = findMatchesWithRuns();
    if (matched.size === 0) {
      swap(a, b);
      renderTiles();
      vibrate(20);
      beep(180, 0.07, "sawtooth", 0.03);
      hintEl.textContent = "这步没有消除，已撤回";
      await sleep(220);
      hintEl.textContent = "在格子上滑动（上下左右）交换";
      await ensureSolvableOrShuffle();
      locked = false;
      return;
    }

    // 消耗步数（仅当这一步产生了有效消除）
    state.movesLeft = Math.max(0, state.movesLeft - 1);
    setHud();

    // 特殊生成：由本次交换产生的 4/5 连，在目标格生成炸弹/彩虹球（简化规则）
    // 优先把特殊生成在“参与消除的交换格”上
    const aKey = `${a.r},${a.c}`;
    const bKey = `${b.r},${b.c}`;
    let spawnKey = matched.has(bKey) ? bKey : matched.has(aKey) ? aKey : bKey;
    let special = null;
    for (const run of runs) {
      const includesB = run.cells.some((p) => p.r === b.r && p.c === b.c);
      const includesA = run.cells.some((p) => p.r === a.r && p.c === a.c);
      if (!includesA && !includesB) continue;
      // 检查是否是五连消（直线五连或交叉五连）
      if (run.len >= 5 || run.isFiveMatch) {
        // 如果是交叉五连，在交叉点生成彩虹球
        if (run.isFiveMatch && run.crossPoint) {
          spawnKey = `${run.crossPoint.r},${run.crossPoint.c}`;
        }
        special = { key: spawnKey, val: CELL_RAINBOW };
        break;
      }
      if (run.len === 4 && !special) {
        const color = run.color;
        special = { key: spawnKey, val: CELL_BOMB_BASE + color };
      }
    }

    hintEl.textContent = special?.val === CELL_RAINBOW ? "彩虹球！" : special ? "炸弹！" : "Nice!";
    await sleep(80);

    const keep = special ? { [special.key]: special.val } : null;
    await applyOneClearStep(matched, { keep, comboMul: 1, sound: true });
    await resolveMatchesLoop();

    await sleep(120);
    hintEl.textContent = "在格子上滑动（上下左右）交换";
    await afterMoveCheckEnd();
    await ensureSolvableOrShuffle();
    locked = false;
  }

  function getCellFromPoint(clientX, clientY) {
    const rect = boardEl.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, rect.width - 1);
    const y = clamp(clientY - rect.top, 0, rect.height - 1);

    // 计算格子位置（考虑 gap：用近似映射足够好）
    const cellW = rect.width / currentSize;
    const cellH = rect.height / currentSize;
    const c = clamp(Math.floor(x / cellW), 0, currentSize - 1);
    const r = clamp(Math.floor(y / cellH), 0, currentSize - 1);
    return { r, c };
  }

  function onPointerDown(e) {
    if (locked) return;
    pointerDown = true;
    const pt = e.touches ? e.touches[0] : e;
    const cell = getCellFromPoint(pt.clientX, pt.clientY);
    if (!isMaskedIn(cell.r, cell.c)) return;

    // 道具放置模式：点到任意可用格就放置并结束
    if (pendingTool) {
      const tool = pendingTool;
      pendingTool = null;
      if (tool === "bomb") {
        if (state.inv.bomb <= 0) {
          showToast("没有炸弹道具了", 900);
          return;
        }
        state.inv.bomb -= 1;
        // 放置炸弹：保留该格颜色（若该格是彩虹则随机色）
        const baseColor = cellKind(grid[cell.r][cell.c]) === "rainbow" ? Math.floor(Math.random() * TYPES.length) : cellColorIndex(grid[cell.r][cell.c]);
        const color = baseColor >= 0 ? baseColor : Math.floor(Math.random() * TYPES.length);
        grid[cell.r][cell.c] = CELL_BOMB_BASE + color;
        setHud();
        renderTiles();
        showToast("已放置炸弹", 900);
        beep(420, 0.07, "square", 0.05);
        vibrate(10);
        hintEl.textContent = "在格子上滑动（上下左右）交换";
        return;
      }
      if (tool === "rainbow") {
        if (state.inv.rainbow <= 0) {
          showToast("没有彩虹球道具了", 900);
          return;
        }
        state.inv.rainbow -= 1;
        grid[cell.r][cell.c] = CELL_RAINBOW;
        setHud();
        renderTiles();
        showToast("已放置彩虹球（交换触发）", 1100);
        beep(740, 0.06, "triangle", 0.05);
        vibrate(10);
        hintEl.textContent = "在格子上滑动（上下左右）交换";
        return;
      }
    }

    downInfo = { ...cell, x: pt.clientX, y: pt.clientY };
    clearSelection();
    setSelected(cell.r, cell.c, true);
  }

  async function onPointerMove(e) {
    if (!pointerDown || locked || !downInfo) return;
    const pt = e.touches ? e.touches[0] : e;

    const dx = pt.clientX - downInfo.x;
    const dy = pt.clientY - downInfo.y;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    // 超过阈值就判定一次滑动方向
    const threshold = 16; // px
    if (Math.max(adx, ady) < threshold) return;

    pointerDown = false; // 只处理一次
    const dir =
      adx > ady
        ? { dr: 0, dc: dx > 0 ? 1 : -1 }
        : { dr: dy > 0 ? 1 : -1, dc: 0 };

    const to = { r: downInfo.r + dir.dr, c: downInfo.c + dir.dc };
    if (!inBounds(to.r, to.c) || !isMaskedIn(to.r, to.c)) {
      clearSelection();
      downInfo = null;
      return;
    }

    setSelected(to.r, to.c, true);
    await trySwapAndResolve({ r: downInfo.r, c: downInfo.c }, to);
    clearSelection();
    downInfo = null;
  }

  function onPointerUp() {
    pointerDown = false;
    downInfo = null;
    clearSelection();
  }

  function cloneGoal(goal) {
    return JSON.parse(JSON.stringify(goal));
  }

  async function afterMoveCheckEnd() {
    if (state.movesLeft <= 0) {
      // 如果步数用完但目标已完成，将剩余步数变成炸弹并引爆
      if (goalCompleted()) {
        await convertMovesToBombs();
        await endLevel(true);
      } else {
        await endLevel(false);
      }
      return;
    }
    if (goalCompleted()) {
      await endLevel(true);
      return;
    }
  }

  async function endLevel(win) {
    locked = true;
    if (win) {
      // 如果有剩余步数，将步数变成炸弹并引爆
      if (state.movesLeft > 0) {
        await convertMovesToBombs();
      }
      
      const reward = LEVELS[state.levelIndex % LEVELS.length].reward;
      state.inv.bomb += reward.bomb || 0;
      state.inv.rainbow += reward.rainbow || 0;
      setHud();
      
      // 计算星级：根据得分和剩余步数
      const level = LEVELS[state.levelIndex % LEVELS.length];
      let stars = 0;

      // 根据目标类型计算星星
      if (level.goal.type === "score") {
        // 分数目标：基于分数倍数
        if (score >= level.goal.value * 1.5) stars = 3;
        else if (score >= level.goal.value * 1.2) stars = 2;
        else if (score >= level.goal.value) stars = 1;
      } else {
        // 消除目标：基于完成进度
        const progress = (state.goalProgress / level.goal.value) * 100;
        if (progress >= 100) stars = 3;
        else if (progress >= 66.67) stars = 2;
        else if (progress >= 33.33) stars = 1;
      }
      
      // 如果低于1星，算失败
      if (stars === 0) {
        resultTitle.textContent = "过关失败";
        if (level.goal.type === "score") {
          resultText.textContent = `得分：${score}。未达到目标，需要至少${level.goal.value}分才能过关。`;
        } else {
          resultText.textContent = `完成进度：${state.goalProgress}/${level.goal.value}。未达到目标，需要至少完成${Math.ceil(level.goal.value * 0.33)}才能过关。`;
        }
        nextBtn.hidden = true;
        updateLevelProgress(state.levelIndex, false, 0, score);
        locked = false;
        return;
      }

      // 更新关卡进度
      updateLevelProgress(state.levelIndex, true, stars, score);
      
      resultTitle.textContent = "过关成功";
      resultText.textContent = `得分：${score}。获得${stars}星。奖励：炸弹+${reward.bomb || 0}，彩虹球+${reward.rainbow || 0}。`;
      nextBtn.hidden = false;
    } else {
      resultTitle.textContent = "闯关失败";
      resultText.textContent = `步数用完了。得分：${score}。`;
      nextBtn.hidden = true;
    }
    setOverlay(resultOverlay, true);
  }

  async function startLevel(levelIndex, { resetScore = false } = {}) {
    locked = true;
    showLoading(true);
    await sleep(350);
    const level = LEVELS[levelIndex % LEVELS.length];
    state.levelIndex = levelIndex;
    state.movesLeft = level.moves;
    state.goal = cloneGoal(level.goal);
    state.goalProgress = 0;
    
    // 处理限时关卡
    if (level.timeLimit) {
      timeLeft = level.timeLimit;
      // 清除之前的计时器
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      // 启动新的计时器
      timerInterval = setInterval(() => {
        timeLeft -= 1;
        setHud();
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          timerInterval = null;
          // 时间到了，检查是否完成目标
          if (goalCompleted()) {
            showResult(true, "时间到！目标达成！");
          } else {
            showResult(false, "时间到！目标未达成！");
          }
        }
      }, 1000);
    } else {
      timeLeft = 0;
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }
    
    if (resetScore) score = 0;
    combo = 0;
    setHud();
    // 根据关卡配置设置棋盘大小
    if (level.size) {
      currentSize = level.size;
    } else {
      currentSize = 8;
    }
    initGrid();
    buildBoardDom();
    renderTiles();

    // 检查开局是否有立即消除，如果有则消除并重新填充
    let hasInitialMatches = true;
    while (hasInitialMatches) {
      const { matched } = findMatchesWithRuns();
      if (matched.size === 0) {
        hasInitialMatches = false;
      } else {
        // 消除匹配的元素并重新填充
        await clearSetAndCascade(matched);
        await sleep(200);
      }
    }

    // 确保棋盘有解
    await ensureSolvableOrShuffle();
    showLoading(false);
    locked = false;
  }

  async function restartRun() {
    score = 0;
    combo = 0;
    await startLevel(state.levelIndex, { resetScore: true });
    setOverlay(resultOverlay, false);
  }

  async function nextLevel() {
    state.levelIndex += 1;
    saveLevelIndex();
    score = 0;
    combo = 0;
    await startLevel(state.levelIndex, { resetScore: true });
    setOverlay(resultOverlay, false);
  }

  function getPlayerName() {
    try {
      return localStorage.getItem(STORAGE.name) || "";
    } catch (_) {
      return "";
    }
  }

  function setPlayerName(name) {
    try {
      localStorage.setItem(STORAGE.name, name);
    } catch (_) {}
  }

  function updateSubtitle() {
    const name = getPlayerName();
    subTitleEl.textContent = name ? `你好，${name}。滑动交换，连成三颗即可消除` : "滑动交换，连成三颗即可消除";
  }

  async function ensureLoginFlow() {
    const name = getPlayerName();
    if (name) {
      setOverlay(loginOverlay, false);
      updateSubtitle();
      return;
    }
    setOverlay(loginOverlay, true);
    nameInput.value = "";
    nameInput.focus();
  }

  async function doLogin() {
    const name = (nameInput.value || "").trim().slice(0, 12);
    if (!name) {
      showToast("请输入昵称", 900);
      vibrate(10);
      return;
    }
    setPlayerName(name);
    setOverlay(loginOverlay, false);
    updateSubtitle();
    showToast(`欢迎你，${name}`, 900);
    beep(520, 0.06, "triangle", 0.06);
    await sleep(200);
  }

  function openSettings() {
    soundToggle.checked = !!settings.sound;
    vibrateToggle.checked = !!settings.vibrate;
    setOverlay(settingsOverlay, true);
  }
  function closeSettings() {
    setOverlay(settingsOverlay, false);
  }
  function toggleSettings() {
    if (!settingsOverlay.hidden) closeSettings();
    else openSettings();
  }

  async function useInventoryBomb() {
    if (locked) return;
    if (state.inv.bomb <= 0) {
      showToast("没有炸弹道具了", 900);
      return;
    }
    // 再点一次取消
    if (pendingTool === "bomb") {
      pendingTool = null;
      hintEl.textContent = "在格子上滑动（上下左右）交换";
      showToast("已取消放置炸弹", 800);
      return;
    }
    pendingTool = "bomb";
    showToast("选择一个格子放置炸弹", 1100);
    hintEl.textContent = "点一个格子放置炸弹（再点“炸弹”可取消）";
    beep(360, 0.05, "square", 0.04);
  }

  async function useInventoryRainbow() {
    if (locked) return;
    if (state.inv.rainbow <= 0) {
      showToast("没有彩虹球道具了", 900);
      return;
    }
    if (pendingTool === "rainbow") {
      pendingTool = null;
      hintEl.textContent = "在格子上滑动（上下左右）交换";
      showToast("已取消放置彩虹球", 800);
      return;
    }
    pendingTool = "rainbow";
    showToast("选择一个格子放置彩虹球", 1100);
    hintEl.textContent = "点一个格子放置彩虹球（再点“彩虹球”可取消）";
    beep(520, 0.05, "triangle", 0.04);
  }

  function openMenu() {
    renderLevelSelect();
    setOverlay(menuOverlay, true);
  }

  function closeMenu() {
    setOverlay(menuOverlay, false);
  }

  function openLevelSelect() {
    console.log("Opening level select...");
    
    // 先关闭所有其他遮罩层
    const overlays = document.querySelectorAll('.overlay');
    overlays.forEach(overlay => {
      if (overlay.id !== 'levelSelectOverlay') {
        overlay.hidden = true;
      }
    });
    
    // 渲染并显示关卡选择
    renderLevelSelect();
    levelSelectOverlay.hidden = false;
    console.log("Level select overlay should be visible now");
  }

  function closeLevelSelect() {
    setOverlay(levelSelectOverlay, false);
    setOverlay(menuOverlay, true);
  }

  function continueGame() {
    closeMenu();
  }

  function restartGame() {
    score = 0;
    combo = 0;
    closeMenu();
    startLevel(state.levelIndex, { resetScore: true });
  }

  function bindEvents() {
    // 统一处理触摸/鼠标（移动端以 touch 为主）
    boardEl.addEventListener("touchstart", onPointerDown, { passive: true });
    boardEl.addEventListener("touchmove", onPointerMove, { passive: true });
    boardEl.addEventListener("touchend", onPointerUp, { passive: true });
    boardEl.addEventListener("touchcancel", onPointerUp, { passive: true });

    boardEl.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    bindActivate(menuBtn, openMenu);
    bindActivate(restartBtn, () => startLevel(state.levelIndex, { resetScore: true }));
    bindActivate(settingsBtn, toggleSettings);
    bindActivate(closeSettingsBtn, closeSettings);
    bindActivate(continueBtn, continueGame);
    bindActivate(levelSelectBtn, openLevelSelect);
    
    // 额外的调试点击事件
    if (levelSelectBtn) {
      levelSelectBtn.addEventListener("click", function(e) {
        console.log("Level select button clicked!", e);
        e.preventDefault();
        e.stopPropagation();
        openLevelSelect();
      });
      
      levelSelectBtn.addEventListener("touchstart", function(e) {
        console.log("Level select button touched!", e);
      });
    }
    bindActivate(restartGameBtn, restartGame);
    bindActivate(closeLevelSelectBtn, closeLevelSelect);

    // 关卡确认卡片事件
    bindActivate(enterLevelBtn, () => {
      const levelIndex = parseInt(levelConfirmOverlay.dataset.levelIndex, 10);
      if (Number.isFinite(levelIndex)) {
        startLevel(levelIndex);
        setOverlay(levelConfirmOverlay, false);
      }
    });

    bindActivate(cancelLevelBtn, () => {
      setOverlay(levelConfirmOverlay, false);
      setOverlay(levelSelectOverlay, true);
    });

    // 点击/触摸遮罩层空白处关闭
    const closeSettingsIfBackdrop = (e) => {
      if (e.target === settingsOverlay) closeSettings();
    };
    settingsOverlay.addEventListener("click", closeSettingsIfBackdrop);
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !settingsOverlay.hidden) closeSettings();
    });
    soundToggle.addEventListener("change", () => {
      settings.sound = !!soundToggle.checked;
      saveSettings();
      showToast(settings.sound ? "音效已开启" : "音效已关闭", 900);
    });
    vibrateToggle.addEventListener("change", () => {
      settings.vibrate = !!vibrateToggle.checked;
      saveSettings();
      showToast(settings.vibrate ? "震动已开启" : "震动已关闭", 900);
      vibrate(12);
    });

    bindActivate(retryBtn, restartRun);
    bindActivate(nextBtn, nextLevel);
    const closeResultIfBackdrop = (e) => {
      if (e.target === resultOverlay) setOverlay(resultOverlay, false);
    };
    resultOverlay.addEventListener("click", closeResultIfBackdrop);
    resultOverlay.addEventListener("pointerup", closeResultIfBackdrop, { passive: true });

    bindActivate(bombBtn, useInventoryBomb);
    bindActivate(rainbowBtn, useInventoryRainbow);
    bindActivate(hintBtn, showHint);
  }

  // boot
  bindEvents();
  loadSettings();
  loadLevelIndex();
  loadLevelProgress();
  updateSubtitle();
  (async () => {
    await ensureLoginFlow();
    // 若已经有昵称，先初始化棋盘再显示主菜单；否则等待登录按钮
    if (getPlayerName()) {
      await startLevel(state.levelIndex, { resetScore: true });
      openMenu();
    } else {
      // 登录成功后再启动
      // 包一层，登录完自动开始
      const wrapped = async () => {
        await doLogin();
        if (getPlayerName()) {
          await startLevel(state.levelIndex, { resetScore: true });
          openMenu();
        }
      };
      bindActivate(loginBtn, wrapped);
      nameInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") wrapped();
      });
    }
  })();
})();

