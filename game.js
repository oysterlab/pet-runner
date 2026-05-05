(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const W = 1604;
  const H = 981;
  const GROUND_Y = 720;
  const WORLD_ZOOM = 1.14;
  const RUN_LENGTH = 90;
  const SPEED_MIN = 6.8;
  const SPEED_MAX = 12.7;
  const SHIELD_DURATION = 4.4;
  const STORAGE_KEY = "pet-runner-sticker-quest-v2";
  const DEBUG_MODE = new URLSearchParams(window.location.search).get("debug") || "";
  const DEBUG_MODES = new Set(["jump", "slide", "hit", "shield", "sticker", "hard", "result", "book", "seam1", "seam2"]);

  const ASSETS = {
    bg1: "assets/generated/bg-seamless-1.png",
    bg2: "assets/generated/bg-seamless-2.png",
    bg3: "assets/generated/bg-seamless-3.png",
    run: "assets/generated/run-sheet.png",
    character: "assets/generated/character-sheet.png",
    action: "assets/generated/action-sheet.png",
    items: "assets/generated/items-sheet.png",
    stickerCoins: "assets/generated/sticker-coins-sheet.png",
    stickerHappy: "assets/generated/sns-stickers/happy-yay.png",
    stickerThanks: "assets/generated/sns-stickers/thanks-love.png",
    stickerTired: "assets/generated/sns-stickers/tired-sleepy.png",
    stickerAngry: "assets/generated/sns-stickers/angry-annoyed.png",
    stickerLetsGo: "assets/generated/sns-stickers/letsgo-action.png",
    stickerSorry: "assets/generated/sns-stickers/sorry-oops.png",
    obstacles: "assets/generated/obstacles-sheet.png",
    ui: "assets/generated/ui-sheet.png",
    pause: "assets/generated/pause-button.png",
  };

  const SPRITES = {
    run: { cols: 4, rows: 2, frames: [0, 1, 2, 3, 4, 5, 6, 7] },
    character: { cols: 6, rows: 1, jump: 4, slide: 5, preview: 0 },
    action: { cols: 3, rows: 1, jump: 0, slide: 1, shield: 2 },
    items: { cols: 5, rows: 1, paw: 0, battery: 1, capsule: 2, golden: 3, lucky: 4 },
    stickerCoins: { cols: 6, rows: 1 },
    obstacles: { cols: 4, rows: 1, yarn: 0, dust: 1, mouse: 2, fish: 3 },
    ui: { cols: 6, rows: 1, jump: 0, slide: 1, heart: 2, snack: 3, wing: 4, shield: 5 },
  };

  const STICKERS = [
    { id: "happy", name: "Yay!", needed: 3, color: "#ff6f91", imageKey: "stickerHappy", file: "happy-yay.png" },
    { id: "snack", name: "Thanks", needed: 3, color: "#ffb347", imageKey: "stickerThanks", file: "thanks-love.png" },
    { id: "pilot", name: "Sleepy", needed: 4, color: "#65b9ff", imageKey: "stickerTired", file: "tired-sleepy.png" },
    { id: "brave", name: "Hmph", needed: 4, color: "#93d55c", imageKey: "stickerAngry", file: "angry-annoyed.png" },
    { id: "oops", name: "Let's Go", needed: 5, color: "#b98cff", imageKey: "stickerLetsGo", file: "letsgo-action.png" },
    { id: "golden", name: "Oops", needed: 1, color: "#ffd44c", imageKey: "stickerSorry", file: "sorry-oops.png" },
  ];

  const OBSTACLE_DEFS = {
    yarn: { y: GROUND_Y - 122, w: 132, h: 122, avoid: "jump" },
    mouse: { y: GROUND_Y - 104, w: 176, h: 104, avoid: "jump" },
    dust: { y: GROUND_Y - 252, w: 190, h: 176, avoid: "slide" },
    fish: { y: GROUND_Y - 276, w: 146, h: 196, avoid: "slide" },
  };

  const OBSTACLE_PATTERNS = {
    warmSlide: ["dust"],
    warmJump: ["yarn"],
    lowHigh: ["dust", "mouse"],
    highLow: ["yarn", "fish"],
    doubleJump: ["yarn", "mouse"],
    doubleSlide: ["dust", "fish"],
    zigzag: ["fish", "yarn", "dust"],
    stairs: ["yarn", "fish", "mouse"],
    squeeze: ["dust", "mouse", "fish"],
    rebound: ["mouse", "dust", "yarn"],
    lateMix: ["fish", "mouse", "dust", "yarn"],
    finaleA: ["dust", "mouse", "fish", "yarn"],
    finaleB: ["yarn", "dust", "mouse", "fish"],
    finaleC: ["mouse", "fish", "yarn", "dust"],
  };

  const LEVEL_SCRIPT = [
    { time: 0.35, kind: "coins", shape: "wave" },
    { time: 1.6, kind: "coins", shape: "paw" },
    { time: 2.55, kind: "pattern", pattern: "warmSlide" },
    { time: 4.15, kind: "shield", lane: "air" },
    { time: 4.9, kind: "pattern", pattern: "warmJump" },
    { time: 6.15, kind: "pattern", pattern: "doubleSlide" },
    { time: 6.6, kind: "coins", shape: "steps" },
    { time: 8.0, kind: "sticker", sticker: "happy", lane: "air" },
    { time: 9.25, kind: "pattern", pattern: "lowHigh" },
    { time: 10.85, kind: "pattern", pattern: "warmJump" },
    { time: 11.25, kind: "health", lane: "low" },
    { time: 12.4, kind: "pattern", pattern: "doubleJump" },
    { time: 13.85, kind: "pattern", pattern: "doubleSlide" },
    { time: 15.25, kind: "coins", shape: "heart" },
    { time: 16.45, kind: "pattern", pattern: "highLow" },
    { time: 17.9, kind: "pattern", pattern: "warmSlide" },
    { time: 18.85, kind: "shield", lane: "low" },
    { time: 20.0, kind: "sticker", sticker: "snack", lane: "low" },
    { time: 21.25, kind: "pattern", pattern: "lowHigh" },
    { time: 22.85, kind: "pattern", pattern: "warmJump" },
    { time: 23.75, kind: "coins", shape: "wave" },
    { time: 25.0, kind: "pattern", pattern: "stairs" },
    { time: 26.7, kind: "pattern", pattern: "warmSlide" },
    { time: 27.7, kind: "health", lane: "air" },
    { time: 28.9, kind: "pattern", pattern: "highLow" },
    { time: 30.4, kind: "pattern", pattern: "squeeze" },
    { time: 31.55, kind: "coins", shape: "paw" },
    { time: 32.15, kind: "pattern", pattern: "doubleSlide" },
    { time: 33.0, kind: "sticker", sticker: "pilot", lane: "air" },
    { time: 34.25, kind: "pattern", pattern: "stairs" },
    { time: 36.25, kind: "pattern", pattern: "doubleJump" },
    { time: 38.0, kind: "pattern", pattern: "squeeze" },
    { time: 40.2, kind: "pattern", pattern: "doubleSlide" },
    { time: 41.65, kind: "shield", lane: "air" },
    { time: 42.8, kind: "coins", shape: "steps" },
    { time: 43.9, kind: "pattern", pattern: "rebound" },
    { time: 46.0, kind: "pattern", pattern: "highLow" },
    { time: 47.7, kind: "sticker", sticker: "brave", lane: "low" },
    { time: 48.9, kind: "pattern", pattern: "zigzag" },
    { time: 51.0, kind: "pattern", pattern: "doubleJump" },
    { time: 52.3, kind: "health", lane: "mid" },
    { time: 53.45, kind: "pattern", pattern: "stairs" },
    { time: 55.6, kind: "pattern", pattern: "lowHigh" },
    { time: 57.35, kind: "shield", lane: "air" },
    { time: 58.45, kind: "pattern", pattern: "finaleA" },
    { time: 61.35, kind: "pattern", pattern: "doubleJump" },
    { time: 63.3, kind: "coins", shape: "heart" },
    { time: 64.7, kind: "sticker", sticker: "oops", lane: "air" },
    { time: 65.85, kind: "pattern", pattern: "finaleB" },
    { time: 68.75, kind: "pattern", pattern: "doubleSlide" },
    { time: 70.8, kind: "health", lane: "low" },
    { time: 71.85, kind: "pattern", pattern: "lateMix" },
    { time: 74.35, kind: "pattern", pattern: "doubleJump" },
    { time: 76.2, kind: "shield", lane: "air" },
    { time: 77.25, kind: "pattern", pattern: "finaleC" },
    { time: 80.0, kind: "pattern", pattern: "lowHigh" },
    { time: 81.8, kind: "sticker", sticker: "golden", lane: "low" },
    { time: 82.95, kind: "pattern", pattern: "finaleA" },
    { time: 85.8, kind: "pattern", pattern: "highLow" },
    { time: 87.2, kind: "coins", shape: "paw" },
  ];

  const images = loadAssets(ASSETS);
  const pointer = { slide: false };
  const uiRects = {
    restart: { x: 415, y: 802, w: 180, h: 60 },
    book: { x: 613, y: 802, w: 180, h: 60 },
    snapshot: { x: 811, y: 802, w: 180, h: 60 },
    download: { x: 1009, y: 802, w: 180, h: 60 },
    closeBook: { x: 1117, y: 765, w: 170, h: 58 },
  };
  const stickerBookGrid = { x: 438, y: 252, w: 840 };

  let book = loadBook();
  let game = createGame();
  let lastFrame = performance.now();
  let bgOffset = 0;
  let floorOffset = 0;

  bindInput();
  resetGame();
  requestAnimationFrame(loop);

  function loadAssets(paths) {
    const output = {};
    for (const [key, src] of Object.entries(paths)) {
      const image = new Image();
      image.decoding = "async";
      image.src = src;
      image.ready = false;
      image.failed = false;
      image.onload = () => {
        image.ready = true;
      };
      image.onerror = () => {
        image.failed = true;
      };
      output[key] = image;
    }
    return output;
  }

  function defaultBook() {
    const stickers = {};
    for (const sticker of STICKERS) {
      stickers[sticker.id] = { pieces: 0, complete: false, discovered: false };
    }
    return { stickers, runs: 0 };
  }

  function loadBook() {
    const fallback = defaultBook();
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!parsed) return fallback;
      for (const sticker of STICKERS) {
        parsed.stickers ??= {};
        parsed.stickers[sticker.id] = {
          ...fallback.stickers[sticker.id],
          ...(parsed.stickers[sticker.id] || {}),
        };
      }
      parsed.runs = Number(parsed.runs || 0);
      return parsed;
    } catch {
      return fallback;
    }
  }

  function saveBook() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(book));
    } catch {
      // Play can continue even when storage is blocked.
    }
  }

  function completedStickerCount() {
    return STICKERS.filter((sticker) => book.stickers[sticker.id].complete).length;
  }

  function stickerLabel(sticker) {
    return `${sticker.name} 스티커`;
  }

  function createGame() {
    return {
      phase: "running",
      paused: false,
      showBook: false,
      elapsed: 0,
      health: 100,
      score: 1250,
      yarn: 15,
      shieldCount: 32,
      speedStat: SPEED_MIN,
      combo: 0,
      shieldTimer: 0,
      lucky: 0,
      rewardThisRun: false,
      scriptIndex: 0,
      entities: [],
      particles: [],
      messages: [],
      comboPopups: [],
      rewards: [],
      endedByDamage: false,
      player: {
        x: 350,
        y: GROUND_Y - 190,
        w: 230,
        h: 190,
        vy: 0,
        grounded: true,
        sliding: false,
        slideHeld: false,
        slideTimer: 0,
        invulnerable: 0,
        runPhase: 0,
        mood: "run",
        moodTimer: 0,
      },
    };
  }

  function resetGame() {
    game = createGame();
    bgOffset = 0;
    floorOffset = 0;
    pushMessage("스티커 카드를 찾아보세요!", "#fff4be");
    pushMessage("장애물에 맞춰 점프/슬라이드!", "#d9f4ff");
    applyDebugMode();
  }

  function applyDebugMode() {
    if (!DEBUG_MODES.has(DEBUG_MODE)) return;

    game.entities = [];
    game.scriptIndex = LEVEL_SCRIPT.length;

    if (DEBUG_MODE === "jump") {
      spawnJumpPattern(700);
      spawnItem("shield", 1020, GROUND_Y - 205);
      game.player.grounded = false;
      game.player.vy = 0;
      game.player.y = GROUND_Y - game.player.h - 152;
    } else if (DEBUG_MODE === "slide") {
      spawnSlidePattern(710);
      game.player.sliding = true;
      game.player.slideHeld = true;
      game.player.slideTimer = 99;
      setMood("slide", 99);
    } else if (DEBUG_MODE === "hit") {
      spawnObstacle("mouse", 710);
      game.player.invulnerable = 99;
    } else if (DEBUG_MODE === "shield") {
      spawnCoinArc(760, 1);
      spawnObstacle("mouse", 1080);
      game.shieldTimer = 99;
      setMood("shield", 99);
    } else if (DEBUG_MODE === "sticker") {
      spawnItem("sticker", 820, itemLaneY("air"), { stickerId: "happy" });
      spawnItem("sticker", 1030, itemLaneY("low"), { stickerId: "snack" });
      spawnObstacle("dust", 1260);
    } else if (DEBUG_MODE === "hard") {
      spawnCoinArc(690, 2);
      spawnComboPattern(980, ["dust", "mouse", "fish", "yarn"]);
      spawnItem("shield", 760, itemLaneY("low"));
      spawnItem("health", 1430, itemLaneY("air"));
    } else if (DEBUG_MODE === "result" || DEBUG_MODE === "book") {
      book = defaultBook();
      book.stickers.happy = { ...book.stickers.happy, pieces: 3, complete: true, discovered: true };
      book.stickers.golden = { ...book.stickers.golden, pieces: 1, complete: true, discovered: true };
      game.phase = "result";
      game.elapsed = RUN_LENGTH;
      game.score = 4820;
      game.rewardThisRun = true;
      game.shieldCount = 32;
      game.rewards = [
        { id: "happy", name: "Yay!", detail: "획득" },
        { id: "golden", name: "Oops", detail: "획득" },
      ];
      game.showBook = DEBUG_MODE === "book";
    } else if (DEBUG_MODE === "seam1" || DEBUG_MODE === "seam2") {
      const seam = DEBUG_MODE === "seam1" ? W - 120 : W * 2 - 120;
      bgOffset = seam;
      floorOffset = seam;
    }
  }

  function bindInput() {
    window.addEventListener("keydown", (event) => {
      if (event.repeat && event.key !== "ArrowDown") return;
      if (event.key === " " || event.key === "ArrowUp") {
        event.preventDefault();
        game.phase === "result" ? resetGame() : jump();
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        startSlide(true);
      }
      if (event.key === "Escape" || event.key === "p" || event.key === "P") {
        togglePause();
      }
    });

    window.addEventListener("keyup", (event) => {
      if (event.key === "ArrowDown") stopSlide();
    });

    canvas.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      requestMobileFullscreen();
      const point = canvasPoint(event);
      handlePointer(point);
    });

    canvas.addEventListener("pointerup", () => {
      if (pointer.slide) stopSlide();
      pointer.slide = false;
    });

    canvas.addEventListener("pointercancel", () => {
      if (pointer.slide) stopSlide();
      pointer.slide = false;
    });

    canvas.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });

    canvas.addEventListener(
      "touchmove",
      (event) => {
        event.preventDefault();
      },
      { passive: false },
    );

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && game.phase === "running") game.paused = true;
    });
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    if (canvasIsRotated()) {
      const visualX = event.clientX - rect.left;
      const visualY = event.clientY - rect.top;
      return {
        x: (visualY / Math.max(1, rect.height)) * W,
        y: ((rect.width - visualX) / Math.max(1, rect.width)) * H,
      };
    }
    return {
      x: ((event.clientX - rect.left) / rect.width) * W,
      y: ((event.clientY - rect.top) / rect.height) * H,
    };
  }

  function canvasVisibleRect() {
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);
    const viewportW = window.innerWidth || cssW;
    const viewportH = window.innerHeight || cssH;
    const left = clamp(Math.max(0, rect.left), rect.left, rect.right);
    const top = clamp(Math.max(0, rect.top), rect.top, rect.bottom);
    const right = clamp(Math.min(viewportW, rect.right), rect.left, rect.right);
    const bottom = clamp(Math.min(viewportH, rect.bottom), rect.top, rect.bottom);
    if (canvasIsRotated()) {
      const visualLeft = left - rect.left;
      const visualTop = top - rect.top;
      const visualRight = right - rect.left;
      const visualBottom = bottom - rect.top;
      const gameLeft = (visualTop / cssH) * W;
      const gameRight = (visualBottom / cssH) * W;
      const gameTop = ((cssW - visualRight) / cssW) * H;
      const gameBottom = ((cssW - visualLeft) / cssW) * H;
      return {
        x: clamp(gameLeft, 0, W),
        y: clamp(gameTop, 0, H),
        w: Math.max(1, clamp(gameRight, 0, W) - clamp(gameLeft, 0, W)),
        h: Math.max(1, clamp(gameBottom, 0, H) - clamp(gameTop, 0, H)),
      };
    }
    return {
      x: ((left - rect.left) / cssW) * W,
      y: ((top - rect.top) / cssH) * H,
      w: Math.max(1, ((right - left) / cssW) * W),
      h: Math.max(1, ((bottom - top) / cssH) * H),
    };
  }

  function canvasIsRotated() {
    const transform = getComputedStyle(canvas).transform;
    if (!transform || transform === "none") return false;
    const match = transform.match(/matrix\(([^)]+)\)/);
    if (!match) return false;
    const values = match[1].split(",").map((value) => Number(value.trim()));
    return Math.abs(values[1]) > 0.8 && Math.abs(values[2]) > 0.8;
  }

  function requestMobileFullscreen() {
    const mobileViewport = (window.innerWidth || W) <= 900 || (window.innerHeight || H) <= 520;
    if (!mobileViewport) return;
    if (!document.fullscreenElement) {
      const fullscreenRequest = document.documentElement.requestFullscreen?.({ navigationUI: "hide" });
      fullscreenRequest?.catch(() => {});
    }
    const orientationRequest = screen.orientation?.lock?.("landscape");
    orientationRequest?.catch(() => {});
  }

  function currentUiLayout() {
    const visible = canvasVisibleRect();
    const mobile =
      visible.w < W * 0.9 ||
      visible.h < H * 0.9 ||
      (window.innerWidth || W) <= 900 ||
      (window.innerHeight || H) <= 520;

    if (!mobile) {
      return {
        mobile: false,
        compact: false,
        visible: { x: 0, y: 0, w: W, h: H },
        controls: {
          jump: { x: 47, y: 693, w: 256, h: 256 },
          slide: { x: 1302, y: 693, w: 256, h: 256 },
        },
        pause: { x: 1502, y: 20, w: 92, h: 92 },
        result: {
          restart: uiRects.restart,
          book: uiRects.book,
          snapshot: uiRects.snapshot,
          download: uiRects.download,
        },
        closeBook: uiRects.closeBook,
        bookGrid: { ...stickerBookGrid, columns: 2 },
      };
    }

    const v = visible;
    const compact = v.w < 720;
    const rotated = canvasIsRotated();
    const margin = clamp(Math.min(v.w, v.h) * 0.045, 18, 30);
    const rightInset = compact ? margin + 132 : margin;
    const top = v.y + margin + (rotated ? 82 : 0);
    const pauseSize = compact ? 58 : 82;
    const buttonSize = clamp(Math.min(v.w * 0.31, v.h * 0.23), 112, 188);
    const controlY = v.y + v.h - margin - buttonSize;
    const panel = {
      x: v.x + margin,
      y: v.y + margin,
      w: Math.max(1, v.w - margin * 2),
      h: Math.max(1, v.h - margin * 2),
    };

    const short = !compact && v.h < 620;
    const resultButtonH = compact ? 52 : short ? 44 : 58;
    const resultGap = compact ? 10 : short ? 8 : 14;
    const result = {};
    if (compact) {
      const resultButtonW = Math.min(230, panel.w - 48);
      const resultX = panel.x + (panel.w - resultButtonW) / 2;
      const resultY =
        panel.y + panel.h - margin - resultButtonH * 4 - resultGap * 3;
      result.restart = { x: resultX, y: resultY, w: resultButtonW, h: resultButtonH };
      result.book = {
        x: resultX,
        y: resultY + resultButtonH + resultGap,
        w: resultButtonW,
        h: resultButtonH,
      };
      result.snapshot = {
        x: resultX,
        y: resultY + (resultButtonH + resultGap) * 2,
        w: resultButtonW,
        h: resultButtonH,
      };
      result.download = {
        x: resultX,
        y: resultY + (resultButtonH + resultGap) * 3,
        w: resultButtonW,
        h: resultButtonH,
      };
    } else {
      const resultButtonW = Math.min(short ? 150 : 170, (panel.w - margin * 2 - resultGap * 3) / 4);
      const totalW = resultButtonW * 4 + resultGap * 3;
      const resultX = panel.x + (panel.w - totalW) / 2;
      const resultY = panel.y + panel.h - margin - resultButtonH;
      result.restart = { x: resultX, y: resultY, w: resultButtonW, h: resultButtonH };
      result.book = {
        x: resultX + resultButtonW + resultGap,
        y: resultY,
        w: resultButtonW,
        h: resultButtonH,
      };
      result.snapshot = {
        x: resultX + (resultButtonW + resultGap) * 2,
        y: resultY,
        w: resultButtonW,
        h: resultButtonH,
      };
      result.download = {
        x: resultX + (resultButtonW + resultGap) * 3,
        y: resultY,
        w: resultButtonW,
        h: resultButtonH,
      };
    }

    return {
      mobile: true,
      compact,
      short,
      rotated,
      visible: v,
      margin,
      controls: {
        jump: { x: v.x + margin, y: controlY, w: buttonSize, h: buttonSize },
        slide: { x: v.x + v.w - rightInset - buttonSize, y: controlY, w: buttonSize, h: buttonSize },
      },
      pause: { x: v.x + v.w - rightInset - pauseSize, y: top, w: pauseSize, h: pauseSize },
      timer: {
        x: v.x + v.w - rightInset - pauseSize - (compact ? 88 : 124),
        y: top + (compact ? 8 : 15),
        w: compact ? 74 : 104,
        h: compact ? 34 : 42,
      },
      health: {
        x: v.x + margin,
        y: top,
        w: compact ? Math.min(216, v.w - margin * 2 - pauseSize - 16) : 292,
        h: compact ? 44 : 56,
      },
      score: {
        x: v.x + margin,
        y: top + (compact ? 58 : 74),
        w: compact ? Math.min(204, v.w * 0.48) : 232,
        h: compact ? 50 : 60,
      },
      stickers: {
        x: compact ? v.x + v.w - rightInset - 118 : v.x + margin + 580,
        y: top + (compact ? 58 : 0),
        w: compact ? 118 : 220,
        h: compact ? 50 : 60,
      },
      shieldGauge: {
        x: v.x + margin,
        y: top + (compact ? 128 : 142),
        w: compact ? v.w - margin * 2 : Math.min(440, v.w - margin * 2),
        h: compact ? 14 : 16,
      },
      resultPanel: panel,
      result,
      closeBook: {
        x: compact ? panel.x + (panel.w - 140) / 2 : panel.x + panel.w - 152,
        y: panel.y + panel.h - margin - (compact ? 50 : 58),
        w: compact ? 140 : 132,
        h: compact ? 50 : 58,
      },
      bookGrid: {
        x: panel.x + (compact ? 18 : 32),
        y: panel.y + (compact ? 90 : 116),
        w: panel.w - (compact ? 36 : 64),
        columns: compact ? 1 : 2,
      },
    };
  }

  function handlePointer(point) {
    const layout = currentUiLayout();
    if (game.showBook) {
      const sticker = stickerAtPoint(point, layout.bookGrid);
      if (sticker) {
        downloadSticker(sticker);
        return;
      }
      if (inside(point, layout.closeBook)) game.showBook = false;
      return;
    }

    if (game.phase === "result") {
      if (inside(point, layout.result.restart)) resetGame();
      if (inside(point, layout.result.book)) game.showBook = true;
      if (inside(point, layout.result.snapshot)) saveSnapshot();
      if (inside(point, layout.result.download)) saveLocalResult();
      return;
    }

    if (inside(point, layout.pause)) {
      togglePause();
    } else if (inside(point, layout.controls.jump)) {
      jump();
    } else if (inside(point, layout.controls.slide)) {
      pointer.slide = true;
      startSlide(true);
    } else {
      jump();
    }
  }

  function togglePause() {
    if (game.phase !== "running") return;
    game.paused = !game.paused;
    pushMessage(game.paused ? "일시정지" : "다시 달려요!", "#ffffff");
  }

  function jump() {
    if (game.phase !== "running" || game.paused || game.showBook) return;
    const player = game.player;
    if (!player.grounded) return;
    player.vy = -1030;
    player.grounded = false;
    player.sliding = false;
    player.slideHeld = false;
    player.slideTimer = 0;
    setMood("jump", 0.65);
    burst(player.x + 88, GROUND_Y - 8, "#f1dcc1", 8, 130);
  }

  function startSlide(held) {
    if (game.phase !== "running" || game.paused || game.showBook) return;
    const player = game.player;
    if (!player.grounded) return;
    player.sliding = true;
    player.slideHeld = held;
    player.slideTimer = Math.max(player.slideTimer, 0.7);
    setMood("slide", 0.55);
    burst(player.x + 95, GROUND_Y - 8, "#efd0a8", 5, 95);
  }

  function stopSlide() {
    game.player.slideHeld = false;
  }

  function loop(now) {
    const dt = Math.min(0.033, (now - lastFrame) / 1000 || 0);
    lastFrame = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function requiredAssetsReady() {
    return Object.values(images).every((image) => image.ready && !image.failed);
  }

  function missingAssets() {
    return Object.entries(images)
      .filter(([, image]) => image.failed || (!image.ready && image.complete))
      .map(([key]) => `${key}: ${ASSETS[key]}`);
  }

  function update(dt) {
    updateParticles(dt);
    updateMessages(dt);
    updateComboPopups(dt);
    if (!requiredAssetsReady()) return;
    if (game.paused || game.showBook || game.phase !== "running") return;

    game.elapsed += dt;
    const progress = clamp(game.elapsed / RUN_LENGTH, 0, 1);
    game.speedStat = lerp(SPEED_MIN, SPEED_MAX, easeInOutQuad(progress));
    const worldSpeed = game.speedStat * 96;
    bgOffset = (bgOffset + worldSpeed * 0.12 * dt) % (W * 3);
    floorOffset = (floorOffset + worldSpeed * dt) % (W * 3);

    updateShield(dt);
    updatePlayer(dt);
    maintainDebugPose();
    spawnDirector();
    updateEntities(dt, worldSpeed);
    collectAndCollide();

    if (game.elapsed >= RUN_LENGTH) finishRun(false);
  }

  function updateShield(dt) {
    if (game.shieldTimer <= 0) return;
    game.shieldTimer = Math.max(0, game.shieldTimer - dt);
    if (game.shieldTimer <= 0) pushMessage("무적 종료", "#d8f5ff");
  }

  function updatePlayer(dt) {
    const player = game.player;
    const speedRatio = clamp((game.speedStat - SPEED_MIN) / (SPEED_MAX - SPEED_MIN), 0, 1);
    player.runPhase += dt * lerp(10.6, 15.2, speedRatio);
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.moodTimer = Math.max(0, player.moodTimer - dt);
    if (player.moodTimer <= 0) player.mood = "run";

    if (player.sliding) {
      if (player.slideHeld) player.slideTimer = Math.max(player.slideTimer, 0.12);
      else player.slideTimer -= dt;
      if (player.slideTimer <= 0) player.sliding = false;
    }

    if (!player.grounded) {
      player.vy += 2550 * dt;
      player.y += player.vy * dt;
      if (player.y >= GROUND_Y - player.h) {
        player.y = GROUND_Y - player.h;
        player.vy = 0;
        player.grounded = true;
        burst(player.x + 86, GROUND_Y - 8, "#eacfa5", 6, 100);
      }
    } else {
      player.y = GROUND_Y - player.h;
    }
  }

  function maintainDebugPose() {
    if (!DEBUG_MODES.has(DEBUG_MODE)) return;

    if (DEBUG_MODE === "jump") {
      const player = game.player;
      player.grounded = false;
      player.sliding = false;
      player.vy = 0;
      player.y = GROUND_Y - player.h - 152;
    } else if (DEBUG_MODE === "slide") {
      const player = game.player;
      player.grounded = true;
      player.sliding = true;
      player.slideHeld = true;
      player.slideTimer = 99;
      player.y = GROUND_Y - player.h;
    } else if (DEBUG_MODE === "hit") {
      const player = game.player;
      player.grounded = true;
      player.sliding = false;
      player.y = GROUND_Y - player.h;
      player.invulnerable = 99;
    } else if (DEBUG_MODE === "shield") {
      const player = game.player;
      player.grounded = true;
      player.sliding = false;
      player.y = GROUND_Y - player.h;
      game.shieldTimer = 99;
      setMood("shield", 99);
    }
  }

  function spawnDirector() {
    while (
      game.scriptIndex < LEVEL_SCRIPT.length &&
      game.elapsed >= LEVEL_SCRIPT[game.scriptIndex].time
    ) {
      spawnLevelEvent(LEVEL_SCRIPT[game.scriptIndex]);
      game.scriptIndex += 1;
    }
  }

  function spawnLevelEvent(event) {
    const x = W + 150;
    if (event.kind === "coins") {
      spawnCoinShape(x, event.shape, event.variant);
    } else if (event.kind === "jump") {
      spawnJumpPattern(x, event.obstacle);
    } else if (event.kind === "slide") {
      spawnSlidePattern(x, event.obstacle);
    } else if (event.kind === "combo") {
      spawnComboPattern(x, event.obstacles);
    } else if (event.kind === "pattern") {
      spawnPattern(x, event.pattern);
    } else if (event.kind === "shield") {
      spawnItem("shield", x + 70, itemLaneY(event.lane));
    } else if (event.kind === "health") {
      spawnItem("health", x + 70, itemLaneY(event.lane));
    } else if (event.kind === "sticker") {
      spawnItem("sticker", x + 70, itemLaneY(event.lane), { stickerId: event.sticker });
    } else if (event.kind === "lucky") {
      spawnItem("lucky", x + 70, itemLaneY(event.lane));
    } else if (event.kind === "capsule") {
      spawnItem(event.item, x + 70, itemLaneY(event.lane));
    }
  }

  function itemLaneY(lane) {
    if (lane === "low") return GROUND_Y - 88;
    if (lane === "mid") return GROUND_Y - 160;
    return GROUND_Y - 228;
  }

  function spawnCoinShape(startX, shape = "wave", variant = 1) {
    if (shape === "paw") {
      const cx = startX + 330;
      const cy = GROUND_Y - 160;
      const points = [
        [0, 34],
        [-110, -24],
        [-42, -76],
        [42, -76],
        [110, -24],
        [-58, 24],
        [58, 24],
        [0, -16],
      ];
      for (const [dx, dy] of points) spawnItem("paw", cx + dx, cy + dy);
      return;
    }

    if (shape === "heart") {
      const cx = startX + 382;
      const cy = GROUND_Y - 162;
      const points = [
        [-168, -12],
        [-116, -78],
        [-50, -94],
        [0, -44],
        [50, -94],
        [116, -78],
        [168, -12],
        [-76, 32],
        [0, 78],
        [76, 32],
      ];
      for (const [dx, dy] of points) spawnItem("paw", cx + dx, cy + dy);
      return;
    }

    if (shape === "steps") {
      const points = [
        [0, GROUND_Y - 84],
        [88, GROUND_Y - 116],
        [176, GROUND_Y - 148],
        [264, GROUND_Y - 180],
        [352, GROUND_Y - 212],
        [440, GROUND_Y - 180],
        [528, GROUND_Y - 148],
        [616, GROUND_Y - 116],
        [704, GROUND_Y - 84],
      ];
      for (const [dx, y] of points) spawnItem("paw", startX + dx, y);
      return;
    }

    spawnCoinArc(startX, variant);
  }

  function spawnCoinArc(startX, variant) {
    const count = variant === 2 ? 11 : 9;
    const baseY = variant === 2 ? GROUND_Y - 150 : GROUND_Y - 132;
    const lift = variant === 2 ? 112 : 86;
    for (let i = 0; i < count; i += 1) {
      const ratio = i / Math.max(1, count - 1);
      spawnItem("paw", startX + i * 88, baseY - Math.sin(ratio * Math.PI) * lift);
    }
  }

  function spawnLowCoinLine(startX, count) {
    for (let i = 0; i < count; i += 1) {
      spawnItem("paw", startX + i * 78, GROUND_Y - 75);
    }
  }

  function spawnJumpRewardLine(obstacleX, obstacleType) {
    const width = OBSTACLE_DEFS[obstacleType].w;
    const points = [
      { dx: -260, y: GROUND_Y - 112 },
      { dx: -172, y: GROUND_Y - 162 },
      { dx: -84, y: GROUND_Y - 218 },
      { dx: width - 10, y: GROUND_Y - 248 },
      { dx: width + 78, y: GROUND_Y - 214 },
      { dx: width + 166, y: GROUND_Y - 156 },
      { dx: width + 254, y: GROUND_Y - 116 },
    ];
    for (const point of points) spawnItem("paw", obstacleX + point.dx, point.y);
  }

  function spawnSlideRewardLine(obstacleX, obstacleType) {
    const width = OBSTACLE_DEFS[obstacleType].w;
    const y = GROUND_Y - 82;
    const points = [-302, -218, -134, width + 78, width + 162, width + 246];
    for (const dx of points) spawnItem("paw", obstacleX + dx, y);
  }

  function spawnItem(type, x, y, options = {}) {
    const sizes = { paw: 70, shield: 76, health: 76, sticker: 124, capsule: 84, golden: 92, lucky: 78 };
    const size = sizes[type] || 70;
    const position = resolveItemPosition(type, x, y, size);
    if (!position) return;
    game.entities.push({
      kind: "item",
      type,
      x: position.x,
      y: position.y,
      w: size,
      h: size,
      bob: Math.random() * Math.PI * 2,
      collected: false,
      ...options,
    });
  }

  function resolveItemPosition(type, x, y, size) {
    const offsets =
      type === "paw"
        ? [
            [0, 0],
            [0, -48],
            [0, 48],
            [42, 0],
            [-42, 0],
            [42, -36],
            [-42, 36],
            [0, -92],
            [0, 92],
          ]
        : [
            [0, 0],
            [0, -82],
            [0, 82],
            [88, 0],
            [-88, 0],
            [88, -58],
            [-88, 58],
            [0, -132],
          ];

    for (const [dx, dy] of offsets) {
      const candidate = {
        x: x + dx,
        y: clamp(y + dy, GROUND_Y - 320, GROUND_Y - size * 0.48),
      };
      if (isItemSpotFree(candidate.x, candidate.y, size, type)) return candidate;
    }
    return null;
  }

  function isItemSpotFree(x, y, size, type) {
    const padding = type === "paw" ? 8 : 16;
    const rect = rectFromCenter(x, y, size + padding, size + padding);
    return !game.entities.some((entity) => {
      if (entity.collected) return false;
      return rectsOverlap(rect, entitySpawnRect(entity, entity.kind === "item" ? 8 : 14));
    });
  }

  function spawnJumpPattern(x, type = "yarn") {
    const obstacle = spawnObstacle(type, x);
    if (!obstacle) return;
    spawnJumpRewardLine(obstacle.x, type);
  }

  function spawnSlidePattern(x, type = "dust") {
    const obstacle = spawnObstacle(type, x);
    if (!obstacle) return;
    spawnSlideRewardLine(obstacle.x, type);
  }

  function spawnComboPattern(x, obstacles = []) {
    let cursor = x;
    const spawned = [];
    obstacles.forEach((type, index) => {
      if (index > 0) cursor += comboGap(obstacles[index - 1], type);
      const obstacle = spawnObstacle(type, cursor);
      if (!obstacle) return;
      cursor = obstacle.x;
      spawned.push(obstacle);
    });
    for (const obstacle of spawned) {
      if (obstacle.avoid === "jump") spawnJumpRewardLine(obstacle.x, obstacle.type);
      else spawnSlideRewardLine(obstacle.x, obstacle.type);
    }
    spawnLowCoinLine(cursor + 560, 8);
  }

  function spawnPattern(x, patternName) {
    const obstacles = OBSTACLE_PATTERNS[patternName] || OBSTACLE_PATTERNS.lowHigh;
    spawnComboPattern(x, obstacles);
  }

  function comboGap(prevType, nextType) {
    const prevAvoid = OBSTACLE_DEFS[prevType]?.avoid;
    const nextAvoid = OBSTACLE_DEFS[nextType]?.avoid;
    if (prevAvoid === "jump" && nextAvoid === "slide") return 1040;
    if (prevAvoid === "jump" && nextAvoid === "jump") return 1080;
    if (prevAvoid === "slide" && nextAvoid === "jump") return 790;
    return 720;
  }

  function spawnObstacle(type, x) {
    const defs = OBSTACLE_DEFS;
    const placedX = resolveObstacleX(type, x);
    if (placedX === null) return null;
    const entity = {
      kind: "obstacle",
      type,
      x: placedX,
      y: defs[type].y,
      w: defs[type].w,
      h: defs[type].h,
      avoid: defs[type].avoid,
      hit: false,
      anim: Math.random() * Math.PI * 2,
    };
    removeItemsOverlappingObstacle(entity);
    game.entities.push(entity);
    return entity;
  }

  function resolveObstacleX(type, x) {
    const offsets = [0, 96, 192, 288, 384, 480, 576, 672, 768, 864, 960, 1080, 1200];
    for (const dx of offsets) {
      const candidateX = x + dx;
      if (isObstacleSpotFree(type, candidateX)) return candidateX;
    }
    return null;
  }

  function isObstacleSpotFree(type, x) {
    const def = OBSTACLE_DEFS[type];
    const rect = entitySpawnRect(
      { kind: "obstacle", type, x, y: def.y, w: def.w, h: def.h },
      24,
    );
    return !game.entities.some((entity) => {
      if (entity.kind !== "obstacle" || entity.collected) return false;
      return rectsOverlap(rect, entitySpawnRect(entity, 24));
    });
  }

  function removeItemsOverlappingObstacle(obstacle) {
    const obstacleArea = entitySpawnRect(obstacle, 12);
    for (const entity of game.entities) {
      if (entity.kind !== "item" || entity.collected) continue;
      if (rectsOverlap(obstacleArea, entitySpawnRect(entity, 8))) entity.collected = true;
    }
  }

  function entitySpawnRect(entity, padding = 0) {
    if (entity.kind === "item") {
      return rectFromCenter(entity.x, entity.y, entity.w + padding, entity.h + padding);
    }
    return {
      x: entity.x - padding,
      y: entity.y - padding,
      w: entity.w + padding * 2,
      h: entity.h + padding * 2,
    };
  }

  function updateEntities(dt, worldSpeed) {
    const magnet = 0;
    const px = game.player.x + game.player.w / 2;
    const py = game.player.y + game.player.h / 2;

    for (const entity of game.entities) {
      entity.x -= worldSpeed * dt;
      entity.anim = (entity.anim || 0) + dt;
      entity.bob += dt * 4;
      if (entity.kind === "item" && magnet > 0) {
        const dx = px - entity.x;
        const dy = py - entity.y;
        const d = Math.hypot(dx, dy);
        if (d < magnet && d > 4) {
          entity.x += (dx / d) * 760 * dt;
          entity.y += (dy / d) * 760 * dt;
        }
      }
    }

    game.entities = game.entities.filter((entity) => {
      if (entity.collected) return false;
      return entity.x > -240;
    });
  }

  function collectAndCollide() {
    const player = playerRect();
    for (const entity of game.entities) {
      if (entity.kind === "item") {
        if (rectsOverlap(player, rectFromCenter(entity.x, entity.y, entity.w * 0.72, entity.h * 0.72))) {
          entity.collected = true;
          collectItem(entity);
        }
        continue;
      }

      if (!entity.hit && rectsOverlap(player, obstacleRect(entity))) {
        if (game.shieldTimer > 0) {
          entity.hit = true;
          entity.collected = true;
          game.score += 35;
          burst(entity.x + entity.w / 2, entity.y + entity.h / 2, "#8fe9ff", 18, 240);
          pushMessage("무적 통과 +35", "#d4fbff");
        } else if (game.player.invulnerable <= 0) {
          damage(entity);
        }
      }
    }
  }

  function playerRect() {
    const p = game.player;
    if (p.sliding && p.grounded) {
      return { x: p.x + 20, y: GROUND_Y - 64, w: 174, h: 56 };
    }
    return { x: p.x + 36, y: p.y + 30, w: 126, h: 118 };
  }

  function obstacleRect(entity) {
    if (entity.avoid === "slide") {
      return {
        x: entity.x + entity.w * 0.12,
        y: entity.y + entity.h * 0.22,
        w: entity.w * 0.76,
        h: entity.h * 0.42,
      };
    }
    return {
      x: entity.x + entity.w * 0.12,
      y: entity.y + entity.h * 0.18,
      w: entity.w * 0.76,
      h: entity.h * 0.68,
    };
  }

  function collectItem(item) {
    game.combo += 1;
    const comboBonus = Math.min(game.combo * 3, 75);
    let popupColor = "#ffe36d";
    if (item.type === "paw") {
      game.score += 50 + comboBonus;
      burst(item.x, item.y, "#ff6b8c", 10, 150);
    } else if (item.type === "sticker") {
      game.score += 120 + comboBonus;
      popupColor = "#fff1a6";
      awardStickerCard(item.stickerId);
      burst(item.x, item.y, "#ffe16b", 28, 260);
    } else if (item.type === "shield") {
      game.shieldCount += 1;
      game.shieldTimer = Math.max(game.shieldTimer, SHIELD_DURATION);
      game.score += 20 + comboBonus;
      popupColor = "#8eeaff";
      setMood("shield", 0.7);
      pushMessage("무적!", "#d4fbff");
      burst(item.x, item.y, "#73c8ff", 18, 200);
    } else if (item.type === "health") {
      game.health = Math.min(100, game.health + 22);
      game.score += 30 + comboBonus;
      popupColor = "#9dffbf";
      pushMessage("체력 회복 +22", "#baffcf");
      burst(item.x, item.y, "#8effb5", 16, 185);
    } else if (item.type === "lucky") {
      game.lucky += 1;
      game.score += 80;
      popupColor = "#c9ff8a";
      pushMessage("럭키 적용: 다음 캡슐 강화", "#c9ff8a");
      burst(item.x, item.y, "#adf56d", 18, 210);
    } else if (item.type === "golden") {
      game.score += 220;
      popupColor = "#ffe16b";
      awardCapsule("golden");
      burst(item.x, item.y, "#ffe16b", 30, 275);
    } else if (item.type === "capsule") {
      game.score += 150;
      popupColor = "#ffb3c5";
      awardCapsule("normal");
      burst(item.x, item.y, "#ff90a9", 24, 240);
    }
    if (game.combo >= 2) pushComboPopup(item.x, item.y - item.h * 0.6, `${game.combo} COMBO`, popupColor);
  }

  function awardStickerCard(stickerId) {
    const sticker = STICKERS.find((candidate) => candidate.id === stickerId) || STICKERS[0];
    const state = book.stickers[sticker.id];
    state.discovered = true;

    if (state.complete) {
      game.score += 250;
      game.rewards.push({ id: sticker.id, name: sticker.name, detail: "보너스 +250" });
      pushMessage(`${sticker.name} 보너스 +250`, sticker.color);
    } else {
      state.pieces = sticker.needed;
      state.complete = true;
      game.rewardThisRun = true;
      game.rewards.push({ id: sticker.id, name: sticker.name, detail: "획득" });
      pushMessage(`${sticker.name} 획득!`, sticker.color);
    }

    game.rewards = game.rewards.slice(-4);
    saveBook();
  }

  function damage(entity) {
    entity.hit = true;
    game.combo = 0;
    game.health = Math.max(0, game.health - 30);
    game.player.invulnerable = 1.05;
    pushMessage("앗! 그래도 보상은 유지돼요", "#ffd0d0");
    burst(game.player.x + 88, game.player.y + 76, "#ffffff", 16, 195);
    if (game.health <= 0) finishRun(true);
  }

  function awardCapsule(kind) {
    const useLucky = game.lucky > 0 && kind !== "golden";
    if (useLucky) game.lucky -= 1;
    const completeChance = kind === "golden" ? 1 : useLucky ? 0.55 : 0.3;
    const target = selectSticker(kind === "golden", Math.random() < completeChance);

    if (!target) {
      game.score += kind === "golden" ? 500 : 180;
      saveBook();
      return;
    }

    const state = book.stickers[target.id];
    state.discovered = true;
    if (kind === "golden" || Math.random() < completeChance) {
      state.pieces = target.needed;
      state.complete = true;
      game.rewards.push({ id: target.id, name: target.name, detail: "완성" });
      pushMessage(`${target.name} 완성!`, target.color);
    } else {
      state.pieces = Math.min(target.needed, state.pieces + 1);
      state.complete = state.pieces >= target.needed;
      game.rewards.push({
        id: target.id,
        name: target.name,
        detail: state.complete ? "완성" : `조각 ${state.pieces}/${target.needed}`,
      });
      pushMessage(
        state.complete ? `${target.name} 완성!` : `${target.name} 조각 +1`,
        target.color,
      );
    }
    saveBook();
  }

  function selectSticker(forceGolden, willComplete) {
    if (forceGolden && !book.stickers.golden.complete) {
      return STICKERS.find((sticker) => sticker.id === "golden");
    }

    const candidates = STICKERS.filter((sticker) => !book.stickers[sticker.id].complete);
    if (!candidates.length) return null;
    const pool = candidates.filter((sticker) => sticker.id !== "golden");
    const sorted = (pool.length ? pool : candidates).sort((a, b) => {
      const ap = book.stickers[a.id].pieces / a.needed;
      const bp = book.stickers[b.id].pieces / b.needed;
      return willComplete ? bp - ap : ap - bp;
    });
    return sorted[0];
  }

  function finishRun(damageEnd) {
    if (game.phase !== "running") return;
    game.phase = "result";
    game.paused = false;
    game.endedByDamage = damageEnd;
    book.runs += 1;
    saveBook();
  }

  function saveSnapshot() {
    downloadCanvasImage(`pet-runner-scene-${Date.now()}.png`, "플레이 장면 저장");
  }

  function saveLocalResult() {
    downloadCanvasImage(`pet-runner-result-${Date.now()}.png`, "결과 이미지 저장");
  }

  function downloadCanvasImage(filename, message) {
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/png");
    link.click();
    pushMessage(message, "#ffffff");
  }

  function downloadSticker(sticker) {
    const state = book.stickers[sticker.id];
    if (!state.complete) {
      pushMessage("완성한 스티커만 받을 수 있어요", "#ffd6de");
      return;
    }
    const link = document.createElement("a");
    link.download = sticker.file;
    link.href = ASSETS[sticker.imageKey];
    link.click();
    pushMessage(`${sticker.name} 저장`, sticker.color);
  }

  function burst(x, y, color, count, power) {
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(power * 0.25, power);
      game.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(20, 95),
        r: rand(3, 8),
        life: rand(0.35, 0.85),
        maxLife: 0,
        color,
      });
      game.particles[game.particles.length - 1].maxLife =
        game.particles[game.particles.length - 1].life;
    }
  }

  function updateParticles(dt) {
    for (const p of game.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 520 * dt;
    }
    game.particles = game.particles.filter((p) => p.life > 0);
  }

  function pushMessage(text, color) {
    game.messages.unshift({ text, color, life: 1.85, maxLife: 1.85 });
    game.messages = game.messages.slice(0, 3);
  }

  function updateMessages(dt) {
    for (const message of game.messages) message.life -= dt;
    game.messages = game.messages.filter((message) => message.life > 0);
  }

  function setMood(mood, duration) {
    game.player.mood = mood;
    game.player.moodTimer = Math.max(game.player.moodTimer, duration);
  }

  function pushComboPopup(x, y, text, color) {
    game.comboPopups.push({
      x,
      y,
      vy: -42,
      text,
      color,
      life: 0.82,
      maxLife: 0.82,
    });
    game.comboPopups = game.comboPopups.slice(-8);
  }

  function updateComboPopups(dt) {
    for (const popup of game.comboPopups) {
      popup.life -= dt;
      popup.y += popup.vy * dt;
      popup.vy -= 10 * dt;
    }
    game.comboPopups = game.comboPopups.filter((popup) => popup.life > 0);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    if (!requiredAssetsReady()) {
      drawMissingAssetScreen();
      return;
    }

    ctx.save();
    applyWorldCamera();
    drawBackground();
    drawEntities("item");
    drawShieldAura();
    drawPlayer();
    drawEntities("obstacle");
    drawParticles();
    drawComboPopups();
    ctx.restore();
    if (game.phase !== "result") {
      drawUi();
      drawMessages();
    }
    drawVignette();

    if (game.paused) drawPauseOverlay();
    if (game.phase === "result") drawResultOverlay();
    if (game.showBook) drawStickerBookOverlay();
  }

  function applyWorldCamera() {
    ctx.translate(W / 2, GROUND_Y);
    ctx.scale(WORLD_ZOOM, WORLD_ZOOM);
    ctx.translate(-W / 2, -GROUND_Y);
  }

  function drawMissingAssetScreen() {
    ctx.fillStyle = "#17110f";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#2b211d";
    roundRect(302, 176, 1000, 628, 30);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.fillStyle = "#fff1dc";
    ctx.font = "900 48px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("생성형 에셋을 기다리는 중", W / 2, 252);

    ctx.fillStyle = "#f0d1b6";
    ctx.font = "700 26px system-ui, sans-serif";
    ctx.fillText("asset-prompts.md의 프롬프트로 생성형 이미지를 준비하세요.", W / 2, 324);
    ctx.fillText("저장 위치와 파일명은 아래와 정확히 맞춰야 합니다.", W / 2, 363);

    ctx.textAlign = "left";
    ctx.font = "700 24px ui-monospace, SFMono-Regular, Menlo, monospace";
    const lines = Object.values(ASSETS);
    const missing = missingAssets();
    lines.forEach((line, index) => {
      const isMissing = missing.some((entry) => entry.endsWith(line));
      ctx.fillStyle = isMissing ? "#ffb6b6" : "#c9ffb7";
      ctx.fillText(line, 444, 440 + index * 48);
    });
  }

  function drawBackground() {
    drawBackgroundSequence(bgOffset, 0, H);
    drawScrollingFloor();
  }

  function drawScrollingFloor() {
    const sourceY = 704;
    const sourceH = 182;
    drawBackgroundSequence(floorOffset, sourceY, sourceH);
  }

  function drawBackgroundSequence(offset, sourceY, sourceH) {
    const segments = [images.bg1, images.bg2, images.bg3];
    const totalW = W * segments.length;
    const wrapped = ((offset % totalW) + totalW) % totalW;
    const startIndex = Math.floor(wrapped / W);
    const localX = wrapped % W;

    for (let i = 0; i <= segments.length; i += 1) {
      const image = segments[(startIndex + i) % segments.length];
      const dx = i * W - localX;
      ctx.drawImage(image, 0, sourceY, W, sourceH, dx, sourceY, W, sourceH);
    }

    const blend = sourceH < H ? 260 : 440;
    for (let i = 0; i <= segments.length; i += 1) {
      const boundaryX = (i + 1) * W - localX;
      if (boundaryX > -blend && boundaryX < W + blend) {
        drawTransitionVeil(boundaryX, sourceY, sourceH, blend);
      }
    }
  }

  function drawTransitionStrip(image, boundaryX, sourceY, sourceH, width) {
    const buffer = drawTransitionStrip.buffer || document.createElement("canvas");
    drawTransitionStrip.buffer = buffer;
    buffer.width = width;
    buffer.height = sourceH;
    const bctx = buffer.getContext("2d");
    bctx.clearRect(0, 0, width, sourceH);
    bctx.drawImage(image, 0, sourceY, width, sourceH, 0, 0, width, sourceH);
    bctx.globalCompositeOperation = "destination-in";
    const fade = bctx.createLinearGradient(0, 0, width, 0);
    fade.addColorStop(0, "rgba(0,0,0,0)");
    fade.addColorStop(0.28, "rgba(0,0,0,0.32)");
    fade.addColorStop(0.66, "rgba(0,0,0,0.72)");
    fade.addColorStop(1, "rgba(0,0,0,1)");
    bctx.fillStyle = fade;
    bctx.fillRect(0, 0, width, sourceH);
    bctx.globalCompositeOperation = "source-over";
    ctx.drawImage(buffer, boundaryX - width, sourceY);
  }

  function drawTransitionVeil(boundaryX, sourceY, sourceH, width) {
    const veilWidth = Math.min(width * 0.62, 260);
    const gradient = ctx.createLinearGradient(boundaryX - veilWidth, 0, boundaryX + veilWidth, 0);
    const alpha = sourceH < H ? 0.08 : 0.13;
    gradient.addColorStop(0, "rgba(255,235,204,0)");
    gradient.addColorStop(0.48, `rgba(255,235,204,${alpha})`);
    gradient.addColorStop(0.52, `rgba(255,235,204,${alpha})`);
    gradient.addColorStop(1, "rgba(255,235,204,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(boundaryX - veilWidth, sourceY, veilWidth * 2, sourceH);
  }

  function drawEntities(kind) {
    for (const entity of game.entities) {
      if (entity.kind !== kind) continue;
      if (kind === "item") drawItem(entity);
      else drawObstacle(entity);
    }
  }

  function drawItem(entity) {
    const bob = Math.sin(entity.bob) * 7;
    if (entity.type === "sticker") {
      drawStickerCardItem(entity, bob);
      return;
    }
    if (entity.type === "shield") {
      ctx.save();
      const pulse = 1 + Math.sin(entity.bob * 1.4) * 0.05;
      ctx.fillStyle = "rgba(126, 230, 255, 0.28)";
      ctx.beginPath();
      ctx.arc(entity.x, entity.y + bob, entity.w * 0.48 * pulse, 0, Math.PI * 2);
      ctx.fill();
      drawSpriteCell(
        images.ui,
        SPRITES.ui.cols,
        SPRITES.ui.shield,
        entity.x - entity.w / 2,
        entity.y - entity.h / 2 + bob,
        entity.w,
        entity.h,
      );
      ctx.restore();
      return;
    }
    if (entity.type === "health") {
      ctx.save();
      const pulse = 1 + Math.sin(entity.bob * 1.5) * 0.05;
      ctx.fillStyle = "rgba(111, 255, 166, 0.26)";
      ctx.beginPath();
      ctx.arc(entity.x, entity.y + bob, entity.w * 0.48 * pulse, 0, Math.PI * 2);
      ctx.fill();
      drawSpriteCell(
        images.ui,
        SPRITES.ui.cols,
        SPRITES.ui.heart,
        entity.x - entity.w / 2,
        entity.y - entity.h / 2 + bob,
        entity.w,
        entity.h,
      );
      ctx.restore();
      return;
    }
    drawSpriteCell(
      images.items,
      SPRITES.items.cols,
      SPRITES.items[entity.type],
      entity.x - entity.w / 2,
      entity.y - entity.h / 2 + bob,
      entity.w,
      entity.h,
    );
  }

  function drawStickerCardItem(entity, bob) {
    const sticker = STICKERS.find((candidate) => candidate.id === entity.stickerId) || STICKERS[0];
    const pulse = 1 + Math.sin(entity.bob * 1.25) * 0.035;
    const size = entity.w * pulse;
    const x = entity.x - size / 2;
    const y = entity.y - size / 2 + bob;
    const inner = size - 14;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "rgba(255, 230, 118, 0.36)";
    ctx.beginPath();
    ctx.arc(entity.x, entity.y + bob, size * 0.68, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.shadowColor = "rgba(255, 222, 76, 0.72)";
    ctx.shadowBlur = 24;
    ctx.fillStyle = "rgba(255,255,255,0.42)";
    roundRect(x - 6, y + 5, size, size, 18);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff8df";
    roundRect(x, y, size, size, 18);
    ctx.fill();
    ctx.strokeStyle = sticker.color;
    ctx.lineWidth = 6;
    ctx.stroke();

    drawStickerImage(sticker, x + 7, y + 7, inner, 1, 15);

    ctx.fillStyle = "#ffe56c";
    ctx.beginPath();
    ctx.moveTo(x + size - 34, y + 2);
    ctx.lineTo(x + size - 2, y + 2);
    ctx.lineTo(x + size - 2, y + 34);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(116,75,25,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "rgba(24,18,14,0.72)";
    roundRect(x + 12, y + size - 25, size - 24, 19, 9);
    ctx.fill();
    const text = stickerLabel(sticker);
    plainText(text, entity.x, y + size - 15, text.length > 10 ? 10 : 11, "center", "#fff5c7", 900);
    ctx.restore();
  }

  function drawObstacle(entity) {
    ctx.save();
    ctx.globalAlpha = entity.hit ? 0.45 : 1;
    const y = entity.y + (entity.avoid === "slide" ? Math.sin(entity.anim * 3) * 5 : 0);
    if (entity.avoid === "slide") drawHangingAnchor(entity, y);
    drawSpriteCellFit(
      images.obstacles,
      SPRITES.obstacles.cols,
      SPRITES.obstacles[entity.type],
      entity.x + entity.w / 2,
      y + entity.h,
      entity.w,
      entity.h,
    );
    ctx.restore();
  }

  function drawHangingAnchor(entity, y) {
    const anchorX = entity.x + entity.w * 0.5;
    ctx.save();
    ctx.strokeStyle = "rgba(76, 50, 35, 0.66)";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(anchorX, -90);
    ctx.lineTo(anchorX + Math.sin(entity.anim * 2.4) * 8, y + entity.h * 0.18);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 235, 186, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(anchorX - 3, -88);
    ctx.lineTo(anchorX + Math.sin(entity.anim * 2.4) * 8 - 3, y + entity.h * 0.16);
    ctx.stroke();
    ctx.fillStyle = "rgba(53, 34, 25, 0.82)";
    roundRect(anchorX - 32, -96, 64, 22, 9);
    ctx.fill();
    ctx.restore();
  }

  function drawPlayer() {
    const p = game.player;

    ctx.save();
    if (
      p.invulnerable > 0 &&
      Math.floor(p.invulnerable * 18) % 2 === 0
    ) {
      ctx.globalAlpha = 0.55;
    }
    const runBob = 0;
    let actionFrame = null;
    let boxW = p.w;
    let boxH = p.h;
    let bottomY = (p.grounded ? GROUND_Y : p.y + p.h) + runBob;

    if (p.sliding) {
      actionFrame = SPRITES.action.slide;
      boxW = 288;
      boxH = 136;
      bottomY = GROUND_Y + runBob;
    } else if (!p.grounded) {
      actionFrame = SPRITES.action.jump;
      boxW = 238;
      boxH = 205;
    } else if (p.mood === "shield" && p.moodTimer > 0) {
      actionFrame = SPRITES.action.shield;
      boxW = 258;
      boxH = 184;
    }

    if (actionFrame !== null) {
      drawSpriteCellStableFit(
        images.action,
        SPRITES.action.cols,
        actionFrame,
        p.x + p.w / 2,
        bottomY,
        boxW,
        boxH,
        [actionFrame],
        SPRITES.action.rows,
      );
    } else {
      const frame = SPRITES.run.frames[Math.floor(p.runPhase) % SPRITES.run.frames.length];
      drawSpriteCellStableFit(
        images.run,
        SPRITES.run.cols,
        frame,
        p.x + p.w / 2,
        GROUND_Y + runBob,
        p.w,
        p.h,
        SPRITES.run.frames,
        SPRITES.run.rows,
      );
    }
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    for (const p of game.particles) {
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawShieldAura() {
    if (game.shieldTimer <= 0) return;
    const p = game.player;
    const cx = p.x + p.w * 0.46;
    const cy = p.sliding ? GROUND_Y - 58 : p.y + p.h * 0.58;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 3; i += 1) {
      const t = (performance.now() * 0.004 + i * 0.33) % 1;
      ctx.globalAlpha = 0.5 * (1 - t);
      ctx.strokeStyle = i % 2 ? "#fff2a8" : "#78e8ff";
      ctx.lineWidth = 6 - i;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 122 + t * 58, 90 + t * 42, -0.08, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 14; i += 1) {
      const angle = performance.now() * 0.002 + i * 1.7;
      const x = cx + Math.cos(angle) * (116 + (i % 3) * 16);
      const y = cy + Math.sin(angle) * (74 + (i % 2) * 15);
      const r = 3 + (i % 3) * 1.6;
      ctx.globalAlpha = 0.28 + (i % 4) * 0.08;
      ctx.fillStyle = i % 2 ? "#fff7a5" : "#82efff";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawComboPopups() {
    ctx.save();
    for (const popup of game.comboPopups) {
      const t = clamp(popup.life / popup.maxLife, 0, 1);
      ctx.globalAlpha = Math.min(1, t * 1.6);
      label(popup.text, popup.x, popup.y, 27 + (1 - t) * 10, "center", popup.color);
    }
    ctx.restore();
  }

  function drawUi() {
    const layout = currentUiLayout();
    if (layout.mobile) {
      drawMobileUi(layout);
      return;
    }
    drawHealth();
    drawResourcePill(500, 31, 232, "paw", formatNumber(game.score), "#ff6b73");
    drawResourcePill(760, 31, 220, "sticker", `${completedStickerCount()}/6`, "#ffd44c");
    drawControls(layout);
    drawPauseButton(layout);
    drawShieldGauge(layout);
    drawTimer(layout);
  }

  function drawMobileUi(layout) {
    drawMobileHealth(layout.health);
    drawMobileResourcePill(layout.score, "paw", formatNumber(game.score), "#ff6b73");
    drawMobileResourcePill(layout.stickers, "sticker", `${completedStickerCount()}/6`, "#ffd44c");
    drawControls(layout);
    drawPauseButton(layout);
    drawShieldGauge(layout);
    drawTimer(layout);
  }

  function drawHealth() {
    drawSpriteCell(images.ui, SPRITES.ui.cols, SPRITES.ui.heart, 13, 23, 86, 86);
    drawPanel(72, 34, 292, 56, 20, "rgba(19,17,16,0.86)");
    const gradient = ctx.createLinearGradient(80, 0, 356, 0);
    gradient.addColorStop(0, "#ff4d78");
    gradient.addColorStop(1, "#ff2f79");
    ctx.fillStyle = gradient;
    roundRect(80, 42, 276 * (game.health / 100), 40, 14);
    ctx.fill();
    label(`${Math.round(game.health)} / 100`, 218, 62, 34, "center");
  }

  function drawMobileHealth(rect) {
    const icon = rect.h + 20;
    drawSpriteCell(images.ui, SPRITES.ui.cols, SPRITES.ui.heart, rect.x - 10, rect.y - 10, icon, icon);
    drawPanel(rect.x + 38, rect.y + 5, rect.w - 38, rect.h - 10, 16, "rgba(19,17,16,0.86)");
    const fillW = Math.max(0, (rect.w - 54) * (game.health / 100));
    const gradient = ctx.createLinearGradient(rect.x + 46, 0, rect.x + rect.w, 0);
    gradient.addColorStop(0, "#ff4d78");
    gradient.addColorStop(1, "#ff2f79");
    ctx.fillStyle = gradient;
    roundRect(rect.x + 46, rect.y + 12, fillW, rect.h - 24, 10);
    ctx.fill();
    label(`${Math.round(game.health)}`, rect.x + rect.w * 0.64, rect.y + rect.h / 2 + 1, rect.h * 0.48, "center");
  }

  function drawResourcePill(x, y, w, icon, text, color) {
    drawPanel(x, y, w, 64, 25, "rgba(13, 12, 11, 0.86)");
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + 36, y + 32, 30, 0, Math.PI * 2);
    ctx.fill();
    if (icon === "paw") drawSpriteCell(images.items, SPRITES.items.cols, SPRITES.items.paw, x + 8, y + 4, 58, 58);
    if (icon === "shield") drawSpriteCell(images.ui, SPRITES.ui.cols, SPRITES.ui.shield, x + 7, y + 3, 60, 60);
    if (icon === "yarn") drawSpriteCell(images.obstacles, SPRITES.obstacles.cols, SPRITES.obstacles.yarn, x + 7, y + 3, 60, 60);
    if (icon === "sticker") drawStickerPreview(STICKERS[0], x + 7, y + 4, 56);
    label(text, x + w * 0.62, y + 35, 38, "center");
  }

  function drawMobileResourcePill(rect, icon, text, color) {
    drawPanel(rect.x, rect.y, rect.w, rect.h, rect.h * 0.38, "rgba(13, 12, 11, 0.86)");
    const iconSize = rect.h - 8;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(rect.x + rect.h * 0.5, rect.y + rect.h * 0.5, rect.h * 0.42, 0, Math.PI * 2);
    ctx.fill();
    if (icon === "paw") {
      drawSpriteCell(images.items, SPRITES.items.cols, SPRITES.items.paw, rect.x + 4, rect.y + 4, iconSize, iconSize);
    }
    if (icon === "sticker") {
      drawStickerPreview(STICKERS[0], rect.x + 5, rect.y + 5, iconSize - 2);
    }
    label(text, rect.x + rect.w * 0.64, rect.y + rect.h * 0.54, rect.h * 0.55, "center");
  }

  function drawControls(layout = currentUiLayout()) {
    if (layout.mobile) {
      const jump = layout.controls.jump;
      const slide = layout.controls.slide;
      drawSpriteCell(images.ui, SPRITES.ui.cols, SPRITES.ui.jump, jump.x, jump.y, jump.w, jump.h);
      drawSpriteCell(images.ui, SPRITES.ui.cols, SPRITES.ui.slide, slide.x, slide.y, slide.w, slide.h);
      label("JUMP", jump.x + jump.w / 2, jump.y + jump.h * 0.69, jump.w * 0.15, "center");
      label("SLIDE", slide.x + slide.w / 2, slide.y + slide.h * 0.69, slide.w * 0.15, "center");
      return;
    }
    drawSpriteCell(images.ui, SPRITES.ui.cols, SPRITES.ui.jump, layout.controls.jump.x, layout.controls.jump.y, layout.controls.jump.w, layout.controls.jump.h);
    drawSpriteCell(images.ui, SPRITES.ui.cols, SPRITES.ui.slide, layout.controls.slide.x, layout.controls.slide.y, layout.controls.slide.w, layout.controls.slide.h);
    label("JUMP", 175, 870, 40, "center");
    label("SLIDE", 1430, 870, 40, "center");
  }

  function drawPauseButton(layout = currentUiLayout()) {
    drawSpriteCell(images.pause, 1, 0, layout.pause.x, layout.pause.y, layout.pause.w, layout.pause.h);
  }

  function drawShieldGauge(layout = currentUiLayout()) {
    if (game.shieldTimer <= 0) return;
    const rect = layout.mobile ? layout.shieldGauge : { x: 490, y: 111, w: 365, h: 18 };
    drawPanel(rect.x, rect.y, rect.w, rect.h, rect.h / 2, "rgba(20,18,16,0.54)");
    const gradient = ctx.createLinearGradient(rect.x, 0, rect.x + rect.w, 0);
    gradient.addColorStop(0, "#55d9ff");
    gradient.addColorStop(1, "#fff27e");
    ctx.fillStyle = gradient;
    roundRect(rect.x, rect.y, rect.w * clamp(game.shieldTimer / SHIELD_DURATION, 0, 1), rect.h, rect.h / 2);
    ctx.fill();
  }

  function drawTimer(layout = currentUiLayout()) {
    const rect = layout.mobile ? layout.timer : { x: 1367, y: 119, w: 124, h: 42 };
    drawPanel(rect.x, rect.y, rect.w, rect.h, rect.h * 0.38, "rgba(20,18,16,0.58)");
    label(
      `${Math.ceil(Math.max(0, RUN_LENGTH - game.elapsed))}s`,
      rect.x + rect.w / 2,
      rect.y + rect.h / 2 + 1,
      rect.h * 0.58,
      "center",
      "#fff2cf",
    );
  }

  function drawMessages() {
    const layout = currentUiLayout();
    if (layout.mobile) {
      drawMobileMessages(layout);
      return;
    }
    let y = 304;
    for (const message of game.messages) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, (message.life / message.maxLife) * 1.5);
      drawPanel(542, y - 24, 520, 46, 18, "rgba(18,16,15,0.58)");
      label(message.text, 565, y, 24, "left", message.color);
      ctx.restore();
      y += 52;
    }
  }

  function drawMobileMessages(layout) {
    const v = layout.visible;
    const w = Math.min(layout.compact ? 360 : 520, v.w - layout.margin * 2);
    const x = v.x + (v.w - w) / 2;
    let y = v.y + v.h * (layout.compact ? 0.32 : 0.34);
    for (const message of game.messages) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, (message.life / message.maxLife) * 1.5);
      drawPanel(x, y - 21, w, 40, 15, "rgba(18,16,15,0.62)");
      label(message.text, x + w / 2, y, layout.compact ? 17 : 22, "center", message.color);
      ctx.restore();
      y += layout.compact ? 44 : 48;
    }
  }

  function drawVignette() {
    const gradient = ctx.createRadialGradient(W / 2, H * 0.52, H * 0.25, W / 2, H * 0.52, H * 0.78);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.34)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
  }

  function drawPauseOverlay() {
    ctx.fillStyle = "rgba(0,0,0,0.44)";
    ctx.fillRect(0, 0, W, H);
    label("일시정지", W / 2, H / 2, 68, "center");
  }

  function drawResultOverlay() {
    const layout = currentUiLayout();
    if (layout.mobile) {
      drawMobileResultOverlay(layout);
      return;
    }
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(0, 0, W, H);
    drawResultCelebration();
    drawPanel(362, 118, 880, 758, 28, "rgba(35, 25, 20, 0.96)");
    ctx.strokeStyle = "rgba(255, 220, 98, 0.55)";
    ctx.lineWidth = 5;
    roundRect(362, 118, 880, 758, 28);
    ctx.stroke();
    drawStar(603, 166, 18, "#ffd95f");
    drawStar(1002, 170, 15, "#ff87a8");
    label(game.endedByDamage ? "휴식 시간" : "Clear!", 802, 176, 58, "center", "#fff4df");
    plainText(
      `점수 ${formatNumber(game.score)}`,
      802,
      232,
      30,
      "center",
      "#f4d9ba",
      900,
    );
    const gained = resultGainedStickers();
    const remaining = resultRemainingStickers(gained);
    drawResultStickerShelf("획득한 스티커", gained, 450, 270, 704, 204, "이번 판 획득 없음");
    drawResultStickerShelf("남은 스티커", remaining, 450, 488, 704, 236, "모두 획득", true);
    resultButton(uiRects.restart, "다시 달리기", "#ff5e82");
    resultButton(uiRects.book, "스티커북", "#6fc3ff");
    resultButton(uiRects.snapshot, "장면 저장", "#ffd466");
    resultButton(uiRects.download, "로컬 저장", "#95df7a");
  }

  function drawMobileResultOverlay(layout) {
    const panel = layout.resultPanel;
    const compact = layout.compact;
    const short = layout.short;
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(0, 0, W, H);
    drawResultCelebration();
    drawPanel(panel.x, panel.y, panel.w, panel.h, 24, "rgba(35, 25, 20, 0.96)");
    ctx.strokeStyle = "rgba(255, 220, 98, 0.55)";
    ctx.lineWidth = 4;
    roundRect(panel.x, panel.y, panel.w, panel.h, 24);
    ctx.stroke();

    label(
      game.endedByDamage ? "휴식 시간" : "Clear!",
      panel.x + panel.w / 2,
      panel.y + (compact ? 46 : short ? 34 : 58),
      compact ? 38 : short ? 32 : 54,
      "center",
      "#fff4df",
    );
    plainText(
      `점수 ${formatNumber(game.score)}`,
      panel.x + panel.w / 2,
      panel.y + (compact ? 88 : short ? 62 : 108),
      compact ? 22 : short ? 21 : 30,
      "center",
      "#f4d9ba",
      900,
    );

    const gained = resultGainedStickers();
    const remaining = resultRemainingStickers(gained);
    const buttonTop = Math.min(
      layout.result.restart.y,
      layout.result.book.y,
      layout.result.snapshot.y,
      layout.result.download.y,
    );
    const shelfX = panel.x + (compact ? 18 : 28);
    const shelfW = panel.w - (compact ? 36 : 56);
    const gainedY = panel.y + (compact ? 120 : short ? 78 : 142);
    const gainedH = compact ? 152 : short ? 88 : 180;
    const remainingY = gainedY + gainedH + (compact ? 12 : short ? 8 : 18);
    const remainingH = short
      ? Math.max(44, buttonTop - remainingY - 8)
      : Math.max(130, buttonTop - remainingY - (compact ? 14 : 20));

    drawResultStickerShelfWrapped("획득한 스티커", gained, shelfX, gainedY, shelfW, gainedH, "이번 판 획득 없음", false, short);
    drawResultStickerShelfWrapped("남은 스티커", remaining, shelfX, remainingY, shelfW, remainingH, "모두 획득", true, short);
    resultButton(layout.result.restart, "다시 달리기", "#ff5e82");
    resultButton(layout.result.book, "스티커북", "#6fc3ff");
    resultButton(layout.result.snapshot, "장면 저장", "#ffd466");
    resultButton(layout.result.download, "로컬 저장", "#95df7a");
  }

  function drawResultCelebration() {
    const t = performance.now() * 0.001;
    const colors = ["#ff5e82", "#ffd466", "#65c7ff", "#95df7a", "#fff4df"];
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (let i = 0; i < 14; i += 1) {
      const angle = -0.8 + i * 0.12 + Math.sin(t * 0.7) * 0.035;
      const gradient = ctx.createLinearGradient(W / 2, 230, W / 2 + Math.cos(angle) * 720, 230 + Math.sin(angle) * 460);
      gradient.addColorStop(0, "rgba(255, 225, 128, 0.16)");
      gradient.addColorStop(1, "rgba(255, 225, 128, 0)");
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 26;
      ctx.beginPath();
      ctx.moveTo(W / 2, 242);
      ctx.lineTo(W / 2 + Math.cos(angle) * 820, 242 + Math.sin(angle) * 520);
      ctx.stroke();
    }

    for (let i = 0; i < 46; i += 1) {
      const x = (i * 173 + t * (38 + (i % 4) * 13)) % W;
      const y = 76 + ((i * 89 + t * (58 + (i % 5) * 9)) % 760);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t * 1.8 + i);
      ctx.globalAlpha = 0.22 + (i % 5) * 0.08;
      ctx.fillStyle = colors[i % colors.length];
      if (i % 3 === 0) {
        drawStar(0, 0, 7 + (i % 4), colors[i % colors.length]);
      } else {
        roundRect(-5, -9, 10, 18, 3);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.globalAlpha = 0.26;
    drawStickerPreview(STICKERS[0], 278, 244, 96, 0.5);
    drawStickerPreview(STICKERS[5], 1238, 280, 88, 0.48);
    drawStickerPreview(STICKERS[3], 252, 628, 74, 0.34);
    drawStickerPreview(STICKERS[4], 1266, 638, 82, 0.36);
    ctx.restore();
  }

  function drawRewardList() {
    if (!game.rewards.length) return;
    drawPanel(468, 260, 668, 124, 18, "rgba(255,255,255,0.08)");
    const rewards = game.rewards.slice(-2);
    rewards.forEach((reward, index) => {
      const sticker = STICKERS.find((candidate) => candidate.id === reward.id);
      if (sticker) drawStickerPreview(sticker, 494, 273 + index * 56, 48);
      plainText(`${reward.name} - ${reward.detail}`, 552, 298 + index * 56, 24, "left", "#fff8e8", 800);
    });
  }

  function drawStickerBookOverlay() {
    const layout = currentUiLayout();
    if (layout.mobile) {
      drawMobileStickerBookOverlay(layout);
      return;
    }
    ctx.fillStyle = "rgba(0,0,0,0.64)";
    ctx.fillRect(0, 0, W, H);
    drawPanel(296, 108, 1012, 780, 30, "#2c201b");
    label("스티커북", 802, 196, 52, "center", "#fff1dc");
    drawStickerGrid(stickerBookGrid.x, stickerBookGrid.y, stickerBookGrid.w, "book");
    resultButton(uiRects.closeBook, "닫기", "#ffd466");
  }

  function drawMobileStickerBookOverlay(layout) {
    const panel = layout.resultPanel;
    ctx.fillStyle = "rgba(0,0,0,0.64)";
    ctx.fillRect(0, 0, W, H);
    drawPanel(panel.x, panel.y, panel.w, panel.h, 24, "#2c201b");
    label("스티커북", panel.x + panel.w / 2, panel.y + (layout.compact ? 48 : 64), layout.compact ? 38 : 52, "center", "#fff1dc");
    drawStickerGrid(layout.bookGrid, "book");
    resultButton(layout.closeBook, "닫기", "#ffd466");
  }

  function drawStickerGrid(xOrGrid, y, width, mode = "result") {
    const grid =
      typeof xOrGrid === "object"
        ? { x: xOrGrid.x, y: xOrGrid.y, w: xOrGrid.w, columns: xOrGrid.columns || 2 }
        : { x: xOrGrid, y, w: width, columns: 2 };
    if (typeof xOrGrid === "object") mode = y || "result";
    if (mode === true) mode = "book";
    const metrics = stickerGridMetrics(mode, grid.columns);
    const colW = grid.w / grid.columns;
    for (let i = 0; i < STICKERS.length; i += 1) {
      const sticker = STICKERS[i];
      const state = book.stickers[sticker.id];
      const complete = Boolean(state.complete);
      const cx = grid.x + (i % grid.columns) * colW;
      const cy = grid.y + Math.floor(i / grid.columns) * metrics.rowH;
      const progressX = cx + metrics.textX;
      const progressY = cy + metrics.progressY;
      const progressW = colW - metrics.progressRight;
      drawPanel(cx, cy, colW - 18, metrics.cardH, 16, complete ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.05)");
      drawStickerPreview(sticker, cx + metrics.iconPad, cy + metrics.iconPad, metrics.iconSize, complete ? 1 : 0.24);
      plainText(stickerLabel(sticker), progressX, cy + metrics.nameY, metrics.nameSize, "left", complete ? "#fff8eb" : "rgba(255,248,235,0.58)", 800);
      drawPanel(progressX, progressY, progressW, metrics.progressH, metrics.progressH / 2, "rgba(0,0,0,0.35)");
      ctx.fillStyle = complete ? "#ffdd59" : "rgba(255,255,255,0.12)";
      roundRect(progressX, progressY, progressW * (complete ? 1 : 0), metrics.progressH, metrics.progressH / 2);
      ctx.fill();
      if (mode === "book" && complete) {
        resultButton(stickerDownloadButtonRect(i, grid), "받기", "#ffd466");
      } else {
        plainText(
          complete ? "획득" : "미획득",
          cx + colW - metrics.stateRight,
          cy + metrics.nameY,
          metrics.stateSize,
          "right",
          complete ? "#f6d9b6" : "rgba(246,217,182,0.52)",
          700,
        );
      }
    }
  }

  function resultGainedStickers() {
    const seen = new Set();
    const output = [];
    for (const reward of game.rewards) {
      if (seen.has(reward.id)) continue;
      const sticker = STICKERS.find((candidate) => candidate.id === reward.id);
      if (!sticker) continue;
      seen.add(reward.id);
      output.push(sticker);
    }
    return output;
  }

  function resultRemainingStickers(gained) {
    const gainedIds = new Set(gained.map((sticker) => sticker.id));
    return STICKERS.filter((sticker) => !gainedIds.has(sticker.id));
  }

  function drawResultStickerShelf(title, stickers, x, y, width, height, emptyText, dim = false) {
    drawPanel(x, y, width, height, 18, "rgba(255,255,255,0.08)");
    plainText(title, x + 24, y + 34, 28, "left", "#fff4df", 900);

    if (!stickers.length) {
      plainText(emptyText, x + width / 2, y + height / 2 + 15, 28, "center", "#d9c2ad", 800);
      return;
    }

    const iconSize = dim ? 92 : 116;
    const gap = dim ? 18 : 32;
    const total = stickers.length * iconSize + (stickers.length - 1) * gap;
    const startX = x + (width - total) / 2;
    const iconY = y + 62;

    stickers.forEach((sticker, index) => {
      const sx = startX + index * (iconSize + gap);
      drawStickerPreview(sticker, sx, iconY, iconSize, dim ? 0.56 : 1);
      plainText(stickerLabel(sticker), sx + iconSize / 2, iconY + iconSize + (dim ? 25 : 18), dim ? 15 : 17, "center", "#fff8eb", 800);
    });
  }

  function drawResultStickerShelfWrapped(title, stickers, x, y, width, height, emptyText, dim = false, hideLabels = false) {
    drawPanel(x, y, width, height, 16, "rgba(255,255,255,0.08)");
    const tight = hideLabels || height < 190;
    plainText(title, x + 18, y + (tight ? 20 : 30), tight ? 14 : Math.min(24, height * 0.19), "left", "#fff4df", 900);

    if (!stickers.length) {
      plainText(emptyText, x + width / 2, y + height / 2 + (tight ? 6 : 12), tight ? 14 : 22, "center", "#d9c2ad", 800);
      return;
    }

    const availableW = width - 34;
    const availableH = Math.max(1, height - (tight ? 30 : 58));
    const maxCols = Math.max(1, Math.floor(availableW / (tight ? 48 : dim ? 78 : 96)));
    const narrow = width < 430;
    const cols = narrow
      ? Math.min(stickers.length, 2)
      : Math.min(stickers.length, Math.max(2, Math.min(3, maxCols)));
    const rows = Math.ceil(stickers.length / cols);
    const gapX = tight ? 8 : dim ? 12 : 16;
    const gapY = tight ? 8 : dim ? 22 : 26;
    const iconSize = Math.floor(
      Math.min(
        tight ? 42 : dim ? 82 : 100,
        (availableW - gapX * (cols - 1)) / cols,
        (availableH - gapY * Math.max(0, rows - 1)) / rows - (tight ? 0 : 18),
      ),
    );
    const safeIcon = Math.max(tight ? 26 : dim ? 54 : 62, iconSize);
    const totalW = safeIcon * cols + gapX * (cols - 1);
    const startX = x + (width - totalW) / 2;
    const startY = y + (tight ? 28 : 50);

    stickers.forEach((sticker, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const sx = startX + col * (safeIcon + gapX);
      const sy = startY + row * (safeIcon + gapY);
      drawStickerPreview(sticker, sx, sy, safeIcon, dim ? 0.56 : 1);
      if (!tight) {
        plainText(stickerLabel(sticker), sx + safeIcon / 2, sy + safeIcon + 17, Math.min(15, safeIcon * 0.18), "center", "#fff8eb", 800);
      }
    });
  }

  function stickerGridMetrics(mode, columns = 2) {
    if (mode === "book" && columns === 1) {
      return {
        rowH: 104,
        cardH: 88,
        iconSize: 76,
        iconPad: 6,
        textX: 96,
        nameY: 31,
        nameSize: 23,
        progressY: 58,
        progressH: 12,
        progressRight: 132,
        stateRight: 24,
        stateSize: 17,
        buttonW: 76,
        buttonH: 34,
        buttonPad: 164,
        buttonY: 27,
      };
    }
    if (mode === "book") {
      return {
        rowH: 132,
        cardH: 108,
        iconSize: 96,
        iconPad: 6,
        textX: 120,
        nameY: 38,
        nameSize: 28,
        progressY: 70,
        progressH: 15,
        progressRight: 164,
        stateRight: 31,
        stateSize: 20,
        buttonW: 88,
        buttonH: 40,
        buttonPad: 18,
        buttonY: 34,
      };
    }
    return {
      rowH: 93,
      cardH: 72,
      iconSize: 62,
      iconPad: 5,
      textX: 78,
      nameY: 24,
      nameSize: 20,
      progressY: 46,
      progressH: 12,
      progressRight: 120,
      stateRight: 28,
      stateSize: 15,
    };
  }

  function drawStickerImage(sticker, x, y, size, alpha = 1, radius = 14) {
    const image = images[sticker.imageKey];
    ctx.save();
    ctx.globalAlpha = alpha;
    if (!image?.ready) {
      drawStickerCoin(sticker.id, x, y, size);
      ctx.restore();
      return;
    }
    const source = trimmedImageSource(image);
    const scale = Math.min(size / source.w, size / source.h);
    const dw = source.w * scale;
    const dh = source.h * scale;
    ctx.beginPath();
    roundRect(x, y, size, size, radius);
    ctx.clip();
    ctx.drawImage(
      image,
      source.x,
      source.y,
      source.w,
      source.h,
      x + (size - dw) / 2,
      y + (size - dh) / 2,
      dw,
      dh,
    );
    ctx.restore();
  }

  function trimmedImageSource(image) {
    if (image.trimWholeSource) return image.trimWholeSource;

    const width = image.naturalWidth;
    const height = image.naturalHeight;
    const source = { x: 0, y: 0, w: width, h: height };
    const work = document.createElement("canvas");
    work.width = width;
    work.height = height;
    const workCtx = work.getContext("2d", { willReadFrequently: true });
    workCtx.drawImage(image, 0, 0);
    const pixels = workCtx.getImageData(0, 0, width, height).data;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const alpha = pixels[(y * width + x) * 4 + 3];
        if (alpha > 18) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (maxX >= minX && maxY >= minY) {
      const pad = 12;
      source.x = Math.max(0, minX - pad);
      source.y = Math.max(0, minY - pad);
      source.w = Math.min(width - source.x, maxX - minX + 1 + pad * 2);
      source.h = Math.min(height - source.y, maxY - minY + 1 + pad * 2);
    }

    image.trimWholeSource = source;
    return source;
  }

  function drawStickerPreview(sticker, x, y, size, alpha = 1) {
    drawStickerImage(sticker, x, y, size, alpha, 14);
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 3;
    roundRect(x, y, size, size, 14);
    ctx.stroke();
  }

  function stickerAtPoint(point, grid) {
    const columns = grid.columns || 2;
    const metrics = stickerGridMetrics("book", columns);
    const colW = grid.w / columns;
    for (let i = 0; i < STICKERS.length; i += 1) {
      const sticker = STICKERS[i];
      if (!book.stickers[sticker.id].complete) continue;
      const cx = grid.x + (i % columns) * colW;
      const cy = grid.y + Math.floor(i / columns) * metrics.rowH;
      const rect = stickerDownloadButtonRect(i, grid);
      const card = { x: cx, y: cy, w: colW - 18, h: metrics.cardH };
      if (inside(point, rect) && inside(point, card)) return sticker;
    }
    return null;
  }

  function stickerDownloadButtonRect(index, grid) {
    const columns = grid.columns || 2;
    const metrics = stickerGridMetrics("book", columns);
    const colW = grid.w / columns;
    const cx = grid.x + (index % columns) * colW;
    const cy = grid.y + Math.floor(index / columns) * metrics.rowH;
    const cardW = colW - 18;
    const buttonW = Math.min(metrics.buttonW, Math.max(72, cardW - metrics.textX - 8));
    return {
      x: cx + cardW - buttonW - metrics.buttonPad,
      y: cy + metrics.buttonY,
      w: buttonW,
      h: metrics.buttonH,
    };
  }

  function drawStickerCoin(stickerId, x, y, size) {
    const index = Math.max(0, STICKERS.findIndex((sticker) => sticker.id === stickerId));
    drawSpriteCell(images.stickerCoins, SPRITES.stickerCoins.cols, index, x, y, size, size, SPRITES.stickerCoins.rows);
  }

  function resultButton(rect, text, color) {
    drawPanel(rect.x, rect.y, rect.w, rect.h, 18, color);
    const textSize = Math.min(25, rect.h * 0.5, (rect.w / Math.max(4, text.length)) * 1.05);
    plainText(text, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, textSize, "center", "#1c1411", 900);
  }

  function drawSpriteCell(image, cols, cell, dx, dy, dw, dh, rows = 1) {
    if (!image.ready) return;
    const source = trimmedSource(image, cols, rows, cell);
    ctx.drawImage(image, source.x, source.y, source.w, source.h, dx, dy, dw, dh);
  }

  function drawSpriteCellFit(image, cols, cell, centerX, bottomY, maxW, maxH, rows = 1) {
    if (!image.ready) return;
    const source = trimmedSource(image, cols, rows, cell);
    const scale = Math.min(maxW / source.w, maxH / source.h);
    drawTrimmedSource(image, source, centerX, bottomY, scale);
  }

  function drawSpriteCellStableFit(image, cols, cell, centerX, bottomY, maxW, maxH, stableCells, rows = 1) {
    if (!image.ready) return;
    const source = trimmedSource(image, cols, rows, cell);
    const sources = stableCells.map((stableCell) => trimmedSource(image, cols, rows, stableCell));
    const stableW = Math.max(...sources.map((stableSource) => stableSource.w));
    const stableH = Math.max(...sources.map((stableSource) => stableSource.h));
    const scale = Math.min(maxW / stableW, maxH / stableH);
    drawTrimmedSource(image, source, centerX, bottomY, scale);
  }

  function drawTrimmedSource(image, source, centerX, bottomY, scale) {
    const dw = source.w * scale;
    const dh = source.h * scale;
    ctx.drawImage(
      image,
      source.x,
      source.y,
      source.w,
      source.h,
      centerX - dw / 2,
      bottomY - dh,
      dw,
      dh,
    );
  }

  function trimmedSource(image, cols, rows, cell) {
    image.trimCache ??= new Map();
    const key = `${cols}:${rows}:${cell}`;
    if (image.trimCache.has(key)) return image.trimCache.get(key);

    const col = cell % cols;
    const row = Math.floor(cell / cols);
    const left = Math.round((image.naturalWidth / cols) * col);
    const right =
      col === cols - 1
        ? image.naturalWidth
        : Math.round((image.naturalWidth / cols) * (col + 1));
    const top = Math.round((image.naturalHeight / rows) * row);
    const bottom =
      row === rows - 1
        ? image.naturalHeight
        : Math.round((image.naturalHeight / rows) * (row + 1));
    const cellW = Math.max(1, right - left);
    const cellH = Math.max(1, bottom - top);
    const source = { x: left, y: top, w: cellW, h: cellH };

    const work = document.createElement("canvas");
    work.width = cellW;
    work.height = cellH;
    const workCtx = work.getContext("2d", { willReadFrequently: true });
    workCtx.drawImage(image, left, top, cellW, cellH, 0, 0, cellW, cellH);
    const pixels = workCtx.getImageData(0, 0, cellW, cellH).data;
    let minX = cellW;
    let minY = cellH;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < cellH; y += 1) {
      for (let x = 0; x < cellW; x += 1) {
        const alpha = pixels[(y * cellW + x) * 4 + 3];
        if (alpha > 18) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (maxX >= minX && maxY >= minY) {
      const pad = 4;
      source.x = left + Math.max(0, minX - pad);
      source.y = top + Math.max(0, minY - pad);
      source.w = Math.min(cellW - (source.x - left), maxX - minX + 1 + pad * 2);
      source.h = Math.min(cellH - (source.y - top), maxY - minY + 1 + pad * 2);
    }

    image.trimCache.set(key, source);
    return source;
  }

  function drawPanel(x, y, w, h, r, fill) {
    ctx.fillStyle = fill;
    roundRect(x, y, w, h, r);
    ctx.fill();
  }

  function label(text, x, y, size, align, color = "#ffffff") {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.lineWidth = Math.max(4, size * 0.14);
    ctx.font = `900 ${size}px system-ui, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function plainText(text, x, y, size, align, color, weight) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px system-ui, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function drawStar(x, y, r, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const rr = i % 2 === 0 ? r : r * 0.48;
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      const px = Math.cos(angle) * rr;
      const py = Math.sin(angle) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function rectFromCenter(x, y, w, h) {
    return { x: x - w / 2, y: y - h / 2, w, h };
  }

  function inside(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function distance(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeOutQuad(t) {
    return 1 - (1 - t) * (1 - t);
  }

  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function formatNumber(value) {
    return Math.round(value).toLocaleString("en-US");
  }
})();
