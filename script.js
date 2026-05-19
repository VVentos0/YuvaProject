const imageConfig = {
  // Replace these paths with your final assets.
  mainAnimatedImage: "images/tree.gif",
  blueSquareImages: [
    "images/birdan.gif",
    "images/birdan.gif",
    "images/birdan.gif",
    "images/birdan.gif",
    "images/birdan.gif",
    "images/birdan.gif",
  ],
  envelopeImages: {
    cream: "images/envelope.png",
    rose: "images/envelope.png",
    blue: "images/envelope.png",
    sage: "images/envelope.png",
  },
};

const soundConfig = {
  background: "sounds/bg.mp3",
  tree: "sounds/tree.mp3",
  cat: "sounds/cat.mp3",
  cd: "sounds/cd.mp3",
  star: "sounds/star.mp3",
  wing: "sounds/wing.mp3",
  ribbon: "sounds/ribbon.mp3",
  letter: "sounds/letter.mp3",
};

const envelopeFilters = {
  cream: "sepia(0.18) saturate(1.12) hue-rotate(236deg) brightness(0.92) contrast(0.88)",
  rose: "sepia(0.18) saturate(0.92) hue-rotate(312deg) brightness(0.98) contrast(0.88)",
  blue: "sepia(0.34) saturate(1.04) hue-rotate(14deg) brightness(1) contrast(0.9)",
  sage: "sepia(0.3) saturate(0.82) hue-rotate(58deg) brightness(0.94) contrast(0.88)",
};

const fallbackImages = {
  main: makePlaceholderImage("YUVA", "#ffe8e2", "#8a5a4f"),
  blue: ["ANI 1", "ANI 2", "ANI 3", "ANI 4", "ANI 5", "ANI 6"].map((label) => makePlaceholderImage(label, "#dcecff", "#4d6e98")),
  envelopes: {
    cream: makeEnvelopePlaceholder("#c8b5e8", "#806da8"),
    rose: makeEnvelopePlaceholder("#f6cfd7", "#c7798a"),
    blue: makeEnvelopePlaceholder("#ead472", "#a28a34"),
    sage: makeEnvelopePlaceholder("#c4d3a0", "#788b5b"),
  },
};

const STORAGE_KEY = "yuvaLetters";
const STORAGE_RESET_KEY = "yuvaLettersResetVersion";
const STORAGE_RESET_VERSION = "2026-05-17-start-from-zero";
const MAX_STORED_LETTERS = 160;
const MAX_VISIBLE_ENVELOPES = 140;

const mainImage = document.querySelector("#mainAnimatedImage");
const mainTopImage = document.querySelector("#mainAnimatedTopImage");
const mainImageArea = document.querySelector(".main-image-area");
const atmosphereCanvas = document.querySelector("#atmosphereCanvas");
const welcomeScreen = document.querySelector("#welcomeScreen");
const welcomeEnter = document.querySelector("#welcomeEnter");
const refreshHome = document.querySelector("#refreshHome");
const aboutYuvaOpen = document.querySelector("#aboutYuvaOpen");
const musicToggle = document.querySelector("#musicToggle");
const soundToggle = document.querySelector("#soundToggle");
const roamingCat = document.querySelector("#roamingCat");
const catSprite = document.querySelector("#catSprite");
const blueSquares = Array.from(document.querySelectorAll(".blue-square"));
const liveDateTime = document.querySelector("#liveDateTime");
const letterCountLabel = document.querySelector("#letterCountLabel");
const envelopeGarden = document.querySelector("#envelopeGarden");
const letterDialog = document.querySelector("#letterDialog");
const ribbonHotspot = document.querySelector("#ribbonHotspot");
const ribbonDialog = document.querySelector("#ribbonDialog");
const starHotspot = document.querySelector("#starHotspot");
const starDialog = document.querySelector("#starDialog");
const cdHotspot = document.querySelector("#cdHotspot");
const cdDialog = document.querySelector("#cdDialog");
const aboutYuvaDialog = document.querySelector("#aboutYuvaDialog");
const envelopeLockedDialog = document.querySelector("#envelopeLockedDialog");
const openLetterModal = document.querySelector("#openLetterModal");
const closeLetterModal = document.querySelector("#closeLetterModal");
const closeRibbonDialog = document.querySelector("#closeRibbonDialog");
const closeStarDialog = document.querySelector("#closeStarDialog");
const closeCdDialog = document.querySelector("#closeCdDialog");
const closeAboutYuvaDialog = document.querySelector("#closeAboutYuvaDialog");
const closeEnvelopeLockedDialog = document.querySelector("#closeEnvelopeLockedDialog");
const letterForm = document.querySelector("#letterForm");
const birdName = document.querySelector("#birdName");
const anonymousBird = document.querySelector("#anonymousBird");
const letterBody = document.querySelector("#letterBody");
const paperStyle = document.querySelector("#paperStyle");
const textColor = document.querySelector("#textColor");
const senderColor = document.querySelector("#senderColor");
const fontStyle = document.querySelector("#fontStyle");
const envelopeStyle = document.querySelector("#envelopeStyle");
const recipientChoices = document.querySelector("#recipientChoices");
const paperChoices = document.querySelector("#paperChoices");
const envelopeChoices = document.querySelector("#envelopeChoices");
const stickerChoices = document.querySelector("#stickerChoices");
const letterPreview = document.querySelector("#letterPreview");
const previewBody = document.querySelector("#previewBody");
const previewSignature = document.querySelector("#previewSignature");
const previewSticker = document.querySelector("#previewSticker");
const resetLetter = document.querySelector("#resetLetter");
const toast = document.querySelector("#toast");
const sendButton = letterForm?.querySelector(".send-button");

let toastTimer;
let atmosphereParticles = [];
let atmosphereFrame;
let catFrame;
let catState;
let sounds;
let musicEnabled = true;
let effectsEnabled = true;

function init() {
  resetSavedLettersOnce();
  initSounds();
  hydrateImages();
  initAtmosphere();
  updateDateTime();
  setInterval(updateDateTime, 1000);
  updatePreview();
  updateLetterCount();
  renderEnvelopeStack();
  loadPublicLetters();
  decorateBlueSquares();
  initDraggableBirds();
  bindEvents();
  dismissWelcomeScreen();
  initRoamingCat();
}

function resetSavedLettersOnce() {
  if (localStorage.getItem(STORAGE_RESET_KEY) === STORAGE_RESET_VERSION) {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(STORAGE_RESET_KEY, STORAGE_RESET_VERSION);
}

function initSounds() {
  sounds = {
    background: new Audio(soundConfig.background),
    tree: new Audio(soundConfig.tree),
    cat: new Audio(soundConfig.cat),
    cd: new Audio(soundConfig.cd),
    star: new Audio(soundConfig.star),
    wing: new Audio(soundConfig.wing),
    ribbon: new Audio(soundConfig.ribbon),
    letter: new Audio(soundConfig.letter),
    letterClick: new Audio(soundConfig.letter),
  };

  sounds.background.loop = true;
  sounds.background.volume = 0.45;
  sounds.tree.loop = true;
  sounds.tree.volume = 0.045;
  sounds.cat.volume = 0.06;
  sounds.cd.volume = 0.055;
  sounds.star.volume = 0.055;
  sounds.wing.volume = 1;
  sounds.ribbon.volume = 0.055;
  sounds.letter.volume = 0.055;
  sounds.letterClick.volume = 0.055;

  startBackgroundSound();

  const unlockAudio = () => {
    startBackgroundSound();
    document.removeEventListener("pointerdown", unlockAudio);
    document.removeEventListener("keydown", unlockAudio);
  };

  document.addEventListener("pointerdown", unlockAudio, { once: true });
  document.addEventListener("keydown", unlockAudio, { once: true });
}

function startBackgroundSound() {
  if (!sounds?.background || !musicEnabled) return;
  sounds.background.play().catch(() => {});
}

function stopBackgroundSound() {
  if (!sounds?.background) return;
  sounds.background.pause();
}

function playTreeSound() {
  if (!sounds?.tree || !effectsEnabled) return;
  if (Number.isFinite(sounds.tree.duration) && sounds.tree.duration > 1) {
    sounds.tree.currentTime = Math.random() * Math.max(0, sounds.tree.duration - 0.5);
  } else {
    sounds.tree.currentTime = 0;
  }
  sounds.tree.play().catch(() => {});
}

function stopTreeSound() {
  if (!sounds?.tree) return;
  sounds.tree.pause();
  sounds.tree.currentTime = 0;
}

function playCatSound() {
  if (!sounds?.cat || !effectsEnabled) return;
  sounds.cat.currentTime = 0;
  sounds.cat.play().catch(() => {});
}

function stopCatSound() {
  if (!sounds?.cat) return;
  sounds.cat.pause();
  sounds.cat.currentTime = 0;
}

function playEffectSound(name) {
  if (!effectsEnabled || !sounds?.[name]) return;
  sounds[name].currentTime = 0;
  sounds[name].play().catch(() => {});
}

function playLetterHoverSound() {
  if (!effectsEnabled || !sounds?.letter) return;
  sounds.letter.currentTime = 0;
  sounds.letter.play().catch(() => {});
}

function stopLetterHoverSound() {
  if (!sounds?.letter) return;
  sounds.letter.pause();
  sounds.letter.currentTime = 0;
}

function updateSoundToggleLabels() {
  musicToggle.setAttribute("aria-pressed", String(musicEnabled));
  musicToggle.classList.toggle("is-on", musicEnabled);
  soundToggle.setAttribute("aria-pressed", String(effectsEnabled));
  soundToggle.classList.toggle("is-on", effectsEnabled);
}

function toggleMusic() {
  musicEnabled = !musicEnabled;
  if (musicEnabled) {
    startBackgroundSound();
  } else {
    stopBackgroundSound();
  }
  updateSoundToggleLabels();
}

function toggleEffects() {
  effectsEnabled = !effectsEnabled;
  if (!effectsEnabled) {
    stopTreeSound();
    stopCatSound();
    stopLetterHoverSound();
    if (sounds?.letterClick) {
      sounds.letterClick.pause();
      sounds.letterClick.currentTime = 0;
    }
  }
  updateSoundToggleLabels();
}

function initAtmosphere() {
  if (!atmosphereCanvas) return;

  const context = atmosphereCanvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    atmosphereCanvas.width = Math.floor(window.innerWidth * dpr);
    atmosphereCanvas.height = Math.floor(window.innerHeight * dpr);
    atmosphereCanvas.style.width = `${window.innerWidth}px`;
    atmosphereCanvas.style.height = `${window.innerHeight}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    createAtmosphereParticles();
  }

  function createAtmosphereParticles() {
    const count = Math.min(42, Math.max(16, Math.floor((window.innerWidth * window.innerHeight) / 52000)));
    atmosphereParticles = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 1.35 + 0.45,
      alpha: 1,
      driftX: (Math.random() - 0.5) * 0.22,
      driftY: -0.09 - Math.random() * 0.16,
      pulse: Math.random() * Math.PI * 2,
    }));
  }

  function drawGrain() {
    context.globalAlpha = 0.065;
    context.fillStyle = "#fff8d8";
    for (let i = 0; i < 850; i += 1) {
      context.fillRect(Math.random() * window.innerWidth, Math.random() * window.innerHeight, 0.8, 0.8);
    }
    context.globalAlpha = 1;
  }

  function draw() {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    drawGrain();

    atmosphereParticles.forEach((particle) => {
      particle.pulse += 0.026;
      particle.x += particle.driftX;
      particle.y += particle.driftY;

      if (particle.y < -8) particle.y = window.innerHeight + 8;
      if (particle.x < -8) particle.x = window.innerWidth + 8;
      if (particle.x > window.innerWidth + 8) particle.x = -8;

      const glow = 0.82 + Math.sin(particle.pulse) * 0.18;
      const gradient = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.radius * 7);
      gradient.addColorStop(0, "rgba(255, 252, 210, 1)");
      gradient.addColorStop(0.22, `rgba(255, 246, 185, ${glow})`);
      gradient.addColorStop(0.55, `rgba(255, 230, 130, ${glow * 0.42})`);
      gradient.addColorStop(1, "rgba(255, 238, 160, 0)");

      context.fillStyle = gradient;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius * 7, 0, Math.PI * 2);
      context.fill();
    });

    if (!reducedMotion) {
      atmosphereFrame = window.requestAnimationFrame(draw);
    }
  }

  window.addEventListener("resize", debounce(resize, 180));
  resize();
  draw();
}

function hydrateImages() {
  mainImage.src = imageConfig.mainAnimatedImage;
  mainTopImage.src = imageConfig.mainAnimatedImage;
  mainImage.onerror = () => {
    mainImage.src = fallbackImages.main;
    mainTopImage.src = fallbackImages.main;
  };
  mainTopImage.onerror = () => {
    mainTopImage.src = fallbackImages.main;
  };

  blueSquares.forEach((square, index) => {
    const img = square.querySelector("img");
    const startDelay = Math.floor(Math.random() * 1800);
    img.draggable = false;

    window.setTimeout(() => {
      img.src = withCacheOffset(imageConfig.blueSquareImages[index], index);
    }, startDelay);

    img.onerror = () => {
      img.src = fallbackImages.blue[index];
    };
  });
}

function bindEvents() {
  updateSoundToggleLabels();

  refreshHome.addEventListener("click", () => {
    window.location.reload();
  });

  aboutYuvaOpen.addEventListener("click", () => {
    aboutYuvaDialog.showModal();
    closeAboutYuvaDialog.focus();
  });
  musicToggle.addEventListener("click", toggleMusic);
  soundToggle.addEventListener("click", toggleEffects);
  closeAboutYuvaDialog.addEventListener("click", () => aboutYuvaDialog.close());
  closeEnvelopeLockedDialog.addEventListener("click", () => envelopeLockedDialog.close());

  openLetterModal.addEventListener("click", () => {
    playEffectSound("letterClick");
    letterDialog.showModal();
    letterBody.focus();
  });
  openLetterModal.addEventListener("pointerenter", playLetterHoverSound);
  openLetterModal.addEventListener("pointerleave", stopLetterHoverSound);

  closeLetterModal.addEventListener("click", () => letterDialog.close());
  mainImageArea.addEventListener("pointerenter", playTreeSound);
  mainImageArea.addEventListener("pointerleave", stopTreeSound);
  ribbonHotspot.addEventListener("click", () => {
    playEffectSound("ribbon");
    ribbonDialog.showModal();
    closeRibbonDialog.focus();
  });
  closeRibbonDialog.addEventListener("click", () => ribbonDialog.close());

  starHotspot.addEventListener("click", () => {
    playEffectSound("star");
    starDialog.showModal();
    closeStarDialog.focus();
  });
  closeStarDialog.addEventListener("click", () => starDialog.close());

  cdHotspot.addEventListener("click", () => {
    playEffectSound("cd");
    cdDialog.showModal();
    closeCdDialog.focus();
  });
  closeCdDialog.addEventListener("click", () => cdDialog.close());

  [ribbonDialog, starDialog, cdDialog, aboutYuvaDialog, envelopeLockedDialog].forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });
  });

  [birdName, anonymousBird, letterBody, paperStyle, textColor, senderColor, fontStyle, envelopeStyle, recipientChoices, paperChoices, envelopeChoices, stickerChoices].forEach((element) => {
    element.addEventListener("input", updatePreview);
    element.addEventListener("change", updatePreview);
  });

  paperChoices.addEventListener("change", () => {
    paperStyle.value = getSelectedRadioValue("paperChoice", paperStyle.value);
    updatePreview();
  });

  envelopeChoices.addEventListener("change", () => {
    envelopeStyle.value = getSelectedRadioValue("envelopeChoice", envelopeStyle.value);
    updatePreview();
  });

  resetLetter.addEventListener("click", () => {
    letterForm.reset();
    textColor.value = "#2d2926";
    senderColor.value = "#6b4f2a";
    paperStyle.value = "warm";
    envelopeStyle.value = "blue";
    syncVisualChoices();
    updatePreview();
    birdName.focus();
  });

  letterForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveLetter();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (letterDialog.open) letterDialog.close();
      if (ribbonDialog.open) ribbonDialog.close();
      if (starDialog.open) starDialog.close();
      if (cdDialog.open) cdDialog.close();
      if (aboutYuvaDialog.open) aboutYuvaDialog.close();
      if (envelopeLockedDialog.open) envelopeLockedDialog.close();
    }
  });
}

function updateDateTime() {
  const now = new Date();
  const formatted = new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(now);

  liveDateTime.textContent = formatted;
  liveDateTime.dateTime = now.toISOString();
}

function decorateBlueSquares() {
  blueSquares.forEach((square, index) => {
    const duration = 8.6 + Math.random() * 2.8;
    const delay = -Math.random() * duration;

    square.style.setProperty("--float-duration", `${duration}s`);
    square.style.setProperty("--float-delay", `${delay}s`);
    square.style.setProperty("--float-x", `${index % 2 === 0 ? 4 : -4}px`);
    square.style.setProperty("--float-y", `${8 + Math.random() * 7}px`);
    square.style.setProperty("--start-rotation", `${-4 + Math.random() * 5}deg`);
    square.style.setProperty("--end-rotation", `${-2 + Math.random() * 5}deg`);
    square.style.setProperty("--bird-tilt", `${-7 + Math.random() * 14}deg`);
  });
}

function initDraggableBirds() {
  const orbit = document.querySelector(".memory-orbit");
  if (!orbit) return;

  blueSquares.forEach((square) => {
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let hasDragged = false;

    square.addEventListener("pointerdown", (event) => {
      event.preventDefault();

      const orbitRect = orbit.getBoundingClientRect();
      const squareRect = square.getBoundingClientRect();

      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      hasDragged = false;
      playEffectSound("wing");
      dragOffsetX = event.clientX - squareRect.left;
      dragOffsetY = event.clientY - squareRect.top;

      square.classList.add("is-dragging");
      square.style.position = "absolute";
      square.style.right = "auto";
      square.style.bottom = "auto";
      square.style.left = `${squareRect.left - orbitRect.left}px`;
      square.style.top = `${squareRect.top - orbitRect.top}px`;
      square.setPointerCapture(event.pointerId);
    });

    square.addEventListener("pointermove", (event) => {
      if (!square.classList.contains("is-dragging")) return;

      if (Math.hypot(event.clientX - pointerStartX, event.clientY - pointerStartY) > 8) {
        hasDragged = true;
      }

      const orbitRect = orbit.getBoundingClientRect();
      const squareRect = square.getBoundingClientRect();
      const nextLeft = event.clientX - orbitRect.left - dragOffsetX;
      const nextTop = event.clientY - orbitRect.top - dragOffsetY;
      const maxLeft = Math.max(0, orbitRect.width - squareRect.width);
      const maxTop = Math.max(0, orbitRect.height - squareRect.height);

      square.style.left = `${Math.max(0, Math.min(maxLeft, nextLeft))}px`;
      square.style.top = `${Math.max(0, Math.min(maxTop, nextTop))}px`;
    });

    const stopDragging = (event) => {
      if (!square.classList.contains("is-dragging")) return;

      square.classList.remove("is-dragging");
      if (square.hasPointerCapture(event.pointerId)) {
        square.releasePointerCapture(event.pointerId);
      }

      if (!hasDragged) {
        triggerBirdHop(square);
      }
    };

    square.addEventListener("pointerup", stopDragging);
    square.addEventListener("pointercancel", stopDragging);
  });
}

function triggerBirdHop(square) {
  square.classList.remove("is-hopping");
  void square.offsetWidth;
  square.classList.add("is-hopping");
  square.addEventListener(
    "animationend",
    () => {
      square.classList.remove("is-hopping");
    },
    { once: true },
  );
}

function initRoamingCat() {
  if (!roamingCat || !catSprite) return;

  const assets = {
    walking: "images/catwalking.gif",
    sitting: "images/catsitting.png",
    dragging: "images/catdragging.png",
  };
  const config = {
    centerLeft: 0.29,
    centerRight: 0.72,
    edgePadding: 18,
    offscreenPadding: 120,
    speedMin: 0.34,
    speedMax: 0.58,
    laneYRatio: 0.75,
    sitMin: 1800,
    sitMax: 5200,
    walkMin: 3600,
    walkMax: 9000,
    reentryMin: 900,
    reentryMax: 2400,
  };

  const catSize = () => roamingCat.getBoundingClientRect();
  const centerBounds = () => ({
    left: window.innerWidth * config.centerLeft,
    right: window.innerWidth * config.centerRight,
  });
  const laneY = () => {
    const rect = catSize();
    return Math.max(58, Math.min(window.innerHeight - rect.height - 18, window.innerHeight * config.laneYRatio));
  };
  const clampCat = () => {
    const rect = catSize();
    catState.x = Math.max(-rect.width - config.offscreenPadding, Math.min(window.innerWidth + config.offscreenPadding, catState.x));
    catState.y = Math.max(58, Math.min(window.innerHeight - rect.height - 18, catState.y));
  };
  const setCatPosition = () => {
    roamingCat.style.setProperty("--cat-x", `${catState.x}px`);
    roamingCat.style.setProperty("--cat-y", `${catState.y}px`);
    roamingCat.style.setProperty("--cat-face", catState.face * -1);
  };
  const setCatSwing = () => {
    roamingCat.style.setProperty("--cat-swing", `${catState.swingAngle.toFixed(2)}deg`);
  };
  const setCatMode = (mode) => {
    catState.mode = mode;
    catSprite.src = assets[mode];
    roamingCat.classList.toggle("is-sitting", mode === "sitting");
    roamingCat.classList.toggle("is-dragging", mode === "dragging");
    if (mode !== "dragging") {
      catState.swingAngle = 0;
      catState.swingTarget = 0;
      catState.swingVelocity = 0;
      setCatSwing();
    }
  };
  const randomSpeed = () => randomBetween(config.speedMin, config.speedMax);
  const currentSide = () => {
    const bounds = centerBounds();
    return catState.x < bounds.left ? "left" : "right";
  };
  const leftLandmarkEntryX = () => {
    const rect = catSize();
    const signRect = document.querySelector(".scene-sign")?.getBoundingClientRect();
    const signAnchor = signRect ? signRect.right + rect.width * 0.18 : window.innerWidth * 0.1;
    return Math.max(12, Math.min(window.innerWidth * 0.24, signAnchor));
  };
  const placeAtOuterEntry = (side) => {
    const rect = catSize();
    catState.side = side;
    catState.direction = side === "left" ? 1 : -1;
    catState.face = catState.direction;
    catState.y = laneY();
    catState.x = side === "left" ? leftLandmarkEntryX() : window.innerWidth + randomBetween(14, 70);
  };
  const startWalking = (direction = catState.direction || 1) => {
    catState.direction = direction;
    catState.face = direction;
    catState.speed = randomSpeed();
    catState.walkUntil = performance.now() + randomBetween(config.walkMin, config.walkMax);
    setCatMode("walking");
  };
  const startSitting = () => {
    catState.sitUntil = performance.now() + randomBetween(config.sitMin, config.sitMax);
    setCatMode("sitting");
  };
  const scheduleReentry = (side) => {
    setCatMode("sitting");
    catState.hidden = true;
    catState.reentryAt = performance.now() + randomBetween(config.reentryMin, config.reentryMax);
    roamingCat.style.visibility = "hidden";
    placeAtOuterEntry(side === "right" ? "left" : side);
  };

  catState = {
    x: 0,
    y: 0,
    side: "left",
    mode: "walking",
    direction: 1,
    face: 1,
    speed: randomSpeed(),
    dragging: false,
    falling: false,
    hidden: false,
    dragOffsetX: 0,
    dragOffsetY: 0,
    swingAngle: 0,
    swingTarget: 0,
    swingVelocity: 0,
    lastPointerX: 0,
    lastPointerTime: 0,
    walkUntil: 0,
    sitUntil: 0,
    reentryAt: 0,
  };

  placeAtOuterEntry(catState.side);
  catState.y = laneY();
  startWalking(catState.direction);
  clampCat();
  setCatPosition();

  roamingCat.addEventListener("pointerdown", (event) => {
    const rect = roamingCat.getBoundingClientRect();
    catState.dragging = true;
    catState.hidden = false;
    catState.dragOffsetX = rect.width / 2;
    catState.dragOffsetY = 0;
    catState.swingAngle = 0;
    catState.swingTarget = 0;
    catState.swingVelocity = 0;
    catState.lastPointerX = event.clientX;
    catState.lastPointerTime = performance.now();
    roamingCat.style.visibility = "visible";
    playCatSound();
    setCatMode("dragging");
    setCatSwing();
    roamingCat.setPointerCapture(event.pointerId);
  });

  roamingCat.addEventListener("pointermove", (event) => {
    if (!catState.dragging) return;

    const now = performance.now();
    const elapsed = Math.max(12, now - catState.lastPointerTime);
    const velocityX = (event.clientX - catState.lastPointerX) / elapsed;
    catState.swingTarget = Math.max(-52, Math.min(52, velocityX * -34));
    catState.swingVelocity += catState.swingTarget * 0.095;
    catState.lastPointerX = event.clientX;
    catState.lastPointerTime = now;
    catState.x = event.clientX - catState.dragOffsetX;
    catState.y = event.clientY - catState.dragOffsetY;
    clampCat();
    setCatPosition();
  });

  const stopDrag = () => {
    if (!catState.dragging) return;

    catState.dragging = false;
    stopCatSound();
    catState.swingTarget = 0;
    catState.side = currentSide();
    const bounds = centerBounds();
    if (catState.x > bounds.left && catState.x < bounds.right) {
      const rect = catSize();
      catState.x = catState.side === "left" ? bounds.left - rect.width - config.edgePadding : bounds.right + config.edgePadding;
    }
    catState.falling = true;
    catState.fallDirection = catState.side === "left" ? (Math.random() > 0.5 ? -1 : 1) : (Math.random() > 0.5 ? 1 : -1);
    setCatMode("dragging");
    setCatPosition();
  };

  roamingCat.addEventListener("pointerup", stopDrag);
  roamingCat.addEventListener("pointercancel", stopDrag);
  window.addEventListener("resize", () => {
    if (!catState.dragging) catState.y = laneY();
    clampCat();
    setCatPosition();
  });

  function updateCatSwing() {
    catState.swingVelocity += (catState.swingTarget - catState.swingAngle) * 0.38;
    catState.swingVelocity *= 0.8;
    catState.swingAngle += catState.swingVelocity;
    catState.swingAngle = Math.max(-56, Math.min(56, catState.swingAngle));

    if (performance.now() - catState.lastPointerTime > 80) {
      catState.swingTarget *= 0.8;
    }

    setCatSwing();
  }

  function roam(now) {
    if (catState.dragging) {
      updateCatSwing();
      catFrame = window.requestAnimationFrame(roam);
      return;
    }

    if (catState.falling) {
      const targetY = laneY();
      const dy = targetY - catState.y;
      catState.y += dy * 0.18;
      setCatPosition();

      if (Math.abs(dy) < 1.2) {
        catState.y = targetY;
        catState.falling = false;
        startWalking(catState.fallDirection || catState.direction);
        setCatPosition();
      }

      catFrame = window.requestAnimationFrame(roam);
      return;
    }

    if (catState.hidden) {
      if (now >= catState.reentryAt) {
        catState.hidden = false;
        roamingCat.style.visibility = "visible";
        catState.y = laneY();
        startWalking(catState.direction);
        setCatPosition();
      }

      catFrame = window.requestAnimationFrame(roam);
      return;
    }

    if (catState.mode === "sitting") {
      if (now >= catState.sitUntil) {
        const side = currentSide();
        const bounds = centerBounds();
        const canMoveOutward = side === "left" ? catState.x > -catSize().width * 0.6 : catState.x < window.innerWidth - catSize().width * 0.4;
        const outward = side === "left" ? -1 : 1;
        const inward = side === "left" ? 1 : -1;
        startWalking(Math.random() > 0.46 && canMoveOutward ? outward : inward);
        if (catState.x > bounds.left && catState.x < bounds.right) {
          catState.direction = outward;
        }
      }
    } else {
      const rect = catSize();
      const bounds = centerBounds();
      catState.y = laneY();
      catState.x += catState.direction * catState.speed;
      catState.face = catState.direction;

      if (catState.direction > 0 && catState.x + rect.width > bounds.left && catState.x < bounds.right) {
        catState.x = bounds.left - rect.width - config.edgePadding;
        startSitting();
      } else if (catState.direction < 0 && catState.x < bounds.right && catState.x + rect.width > bounds.left) {
        catState.x = bounds.right + config.edgePadding;
        startSitting();
      } else if (catState.x > window.innerWidth + config.offscreenPadding) {
        scheduleReentry("left");
      } else if (catState.x < -rect.width - config.offscreenPadding) {
        scheduleReentry("right");
      } else if (now >= catState.walkUntil && catState.x > 0 && catState.x < window.innerWidth - rect.width) {
        startSitting();
      }

      setCatPosition();
    }

    catFrame = window.requestAnimationFrame(roam);
  }

  catFrame = window.requestAnimationFrame(roam);
}

function updatePreview() {
  const selectedSticker = getSelectedSticker();
  syncHiddenChoices();
  const body = letterBody.value.trim() || "Buraya içinden geçenleri yaz...";
  const author = getBirdName();

  letterPreview.className = `letter-preview paper-${paperStyle.value} font-${fontStyle.value}`;
  letterPreview.style.color = textColor.value;
  previewSignature.style.color = senderColor.value;
  previewBody.textContent = body;
  previewSignature.textContent = author ? `- ${author}` : "";
  previewSticker.innerHTML = selectedSticker ? `<img src="${selectedSticker}" alt="" />` : "";
}

async function loadPublicLetters() {
  try {
    const response = await fetch("/api/letters?limit=160", {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const letters = Array.isArray(data.letters) ? data.letters : [];
    setLetters(letters.slice(0, MAX_STORED_LETTERS));
    updateLetterCount();
    renderEnvelopeStack();
  } catch (error) {
    console.error("Letters could not be loaded from the API.", error);
  }
}

async function saveLetter() {
  const payload = {
    author: getBirdName(),
    anonymous: anonymousBird.checked,
    title: "",
    recipient: getSelectedRecipient(),
    body: letterBody.value.trim(),
    paper: paperStyle.value,
    color: textColor.value,
    senderColor: senderColor.value,
    font: fontStyle.value,
    envelope: envelopeStyle.value,
    sticker: getSelectedSticker(),
  };

  if (!payload.body) {
    showToast("Mektup Boş Olamaz.");
    return;
  }

  if (payload.body.length < 500) {
    showToast("Mektup En Az 500 Karakter Olmalı.");
    return;
  }

  setLetterFormBusy(true);

  try {
    const response = await fetch("/api/letters", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `HTTP ${response.status}`);
    }

    const savedLetter = await response.json();
    const letter = {
      ...payload,
      ...savedLetter,
      id: savedLetter.id || makeLetterId(),
      createdAt: savedLetter.createdAt || new Date().toISOString(),
    };

    setLetters([letter, ...getLetters().filter((item) => item.id !== letter.id)].slice(0, MAX_STORED_LETTERS));

    letterDialog.close();
    letterForm.reset();
    textColor.value = "#2d2926";
    senderColor.value = "#6b4f2a";
    paperStyle.value = "warm";
    envelopeStyle.value = "blue";
    syncVisualChoices();
    updatePreview();
    updateLetterCount();
    dropEnvelope(letter);
    showToast("Mektubun Yuvaya Ulaştı.");
  } catch (error) {
    console.error("Letter could not be saved to the API.", error);
    showToast("Mektup Gönderilemedi, Tekrar Dene.");
  } finally {
    setLetterFormBusy(false);
  }
}

function updateLetterCount() {
  const total = getLetters().length;
  letterCountLabel.textContent = `${total} - kişi yuvaya mektup bıraktı`;
}

function renderEnvelopeStack(excludedId = "") {
  const letters = getLetters()
    .filter((letter) => letter.id !== excludedId)
    .slice(0, MAX_VISIBLE_ENVELOPES)
    .reverse();

  envelopeGarden.innerHTML = "";

  letters.forEach((letter, index) => {
    envelopeGarden.appendChild(createEnvelopeElement(letter, index));
  });
}

function dropEnvelope(letter) {
  renderEnvelopeStack(letter.id);

  const index = Math.min(getLetters().length - 1, MAX_VISIBLE_ENVELOPES - 1);
  const envelope = createEnvelopeElement(letter, index);
  const rotation = envelope.style.getPropertyValue("--envelope-rotate") || "0deg";
  envelope.classList.add("is-falling");
  envelopeGarden.appendChild(envelope);

  envelope.animate(
    [
      {
        opacity: 0,
        transform: `translate(-50%, -72vh) rotate(-18deg) scale(1.08)`,
      },
      {
        opacity: 1,
        offset: 0.18,
        transform: `translate(-50%, -52vh) rotate(10deg) scale(1.05)`,
      },
      {
        opacity: 1,
        offset: 0.74,
        transform: `translate(-50%, -8px) rotateZ(${Number.parseFloat(rotation) + 4}deg) scale(1.04)`,
      },
      {
        opacity: 1,
        transform: `translate(-50%, -50%) rotateZ(${rotation}) scale(1)`,
      },
    ],
    {
      duration: 1800,
      easing: "cubic-bezier(.2,.72,.14,1)",
    },
  ).onfinish = () => {
    envelope.classList.remove("is-falling");
    envelope.style.animation = "envelopeSettle 480ms ease-out 1";
    window.setTimeout(() => renderEnvelopeStack(), 460);
  };
}

function createEnvelopeElement(letter, index) {
  const envelope = document.createElement("span");
  const envelopeImage = document.createElement("img");
  const position = getEnvelopePosition(index, letter.id || `${index}`);
  const style = letter.envelope || "cream";

  envelope.className = "envelope";
  envelope.tabIndex = 0;
  envelope.setAttribute("aria-label", "Yuvaya bırakılmış mektup zarfı");
  envelope.addEventListener("click", showEnvelopeLockedMessage);
  envelope.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      showEnvelopeLockedMessage();
    }
  });
  envelopeImage.src = imageConfig.envelopeImages[style] || imageConfig.envelopeImages.cream;
  envelopeImage.alt = "";
  envelope.style.left = `${position.left}%`;
  envelope.style.top = `${position.top}%`;
  envelope.style.width = `calc(var(--envelope-size) * ${position.scale})`;
  envelope.style.zIndex = position.zIndex;
  envelope.style.setProperty("--envelope-filter", envelopeFilters[style] || envelopeFilters.cream);
  envelope.style.setProperty("--envelope-rotate", `${position.rotate}deg`);
  envelope.style.setProperty("--envelope-bob-duration", `${position.bobDuration}s`);
  envelope.style.setProperty("--envelope-bob-delay", `${position.bobDelay}s`);
  envelopeImage.onerror = () => {
    envelopeImage.src = fallbackImages.envelopes[style] || fallbackImages.envelopes.cream;
    envelope.style.setProperty("--envelope-filter", "none");
  };
  envelope.appendChild(envelopeImage);

  return envelope;
}

function showEnvelopeLockedMessage() {
  if (!envelopeLockedDialog.open) {
    envelopeLockedDialog.showModal();
  }
  closeEnvelopeLockedDialog.focus();
}

function getEnvelopePosition(index, seedValue) {
  const perRing = 18;
  const ring = Math.floor(index / perRing);
  const slot = index % perRing;
  const random = seededRandom(seedValue);
  const angle = 176 - slot * (172 / (perRing - 1)) + ring * 4;
  const radiusX = 24 + ring * 7.8 + randomBetweenSeeded(random, -5, 8);
  const radiusY = 7 + ring * 2.2 + randomBetweenSeeded(random, -2, 4);
  const centerX = 50;
  const centerY = 50;
  const jitterX = randomBetweenSeeded(random, -7, 7);
  const jitterY = randomBetweenSeeded(random, -4, 5);
  const left = centerX + Math.cos((angle * Math.PI) / 180) * radiusX + jitterX;
  const top = centerY + Math.abs(Math.sin((angle * Math.PI) / 180)) * radiusY + ring * 2.7 + jitterY;
  const rotate = randomBetweenSeeded(random, -8, 8);
  const scale = Math.max(0.62, 1 - ring * 0.045 + randomBetweenSeeded(random, -0.07, 0.08));

  return {
    left: Math.max(4, Math.min(96, left)),
    top: Math.max(42, Math.min(86, top)),
    rotate,
    scale,
    bobDuration: randomBetweenSeeded(random, 3.1, 4.8),
    bobDelay: randomBetweenSeeded(random, -4.8, 0),
    zIndex: 2 + Math.round(top),
  };
}

function seededRandom(seedValue) {
  let seed = 0;
  for (let i = 0; i < seedValue.length; i += 1) {
    seed = (seed * 31 + seedValue.charCodeAt(i)) >>> 0;
  }

  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function randomBetweenSeeded(random, min, max) {
  return random() * (max - min) + min;
}

function getLetters() {
  try {
    const letters = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    return Array.isArray(letters) ? letters : [];
  } catch {
    return [];
  }
}

function setLetters(letters) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(letters));
}

function setLetterFormBusy(isBusy) {
  if (!sendButton) return;

  sendButton.disabled = isBusy;
  sendButton.textContent = isBusy ? "Gönderiliyor..." : "Gönder";
}

function getSelectedSticker() {
  const selected = document.querySelector("input[name='sticker']:checked");
  return selected ? selected.value : "";
}

function getSelectedRecipient() {
  const selected = document.querySelector("input[name='recipient']:checked");
  return selected ? selected.value : "SEDO";
}

function getBirdName() {
  if (anonymousBird.checked) return "anonim kuş";
  return birdName.value.trim();
}

function syncHiddenChoices() {
  paperStyle.value = getSelectedRadioValue("paperChoice", paperStyle.value);
  envelopeStyle.value = getSelectedRadioValue("envelopeChoice", envelopeStyle.value);
}

function syncVisualChoices() {
  setSelectedRadioValue("paperChoice", paperStyle.value);
  setSelectedRadioValue("envelopeChoice", envelopeStyle.value);
}

function getSelectedRadioValue(name, fallback) {
  const selected = document.querySelector(`input[name="${name}"]:checked`);
  return selected ? selected.value : fallback;
}

function setSelectedRadioValue(name, value) {
  const target = document.querySelector(`input[name="${name}"][value="${value}"]`);
  if (target) target.checked = true;
}

function showToast(message = "Mektubun Yuvaya Ulaştı.") {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function dismissWelcomeScreen() {
  if (!welcomeScreen) return;

  const removeWelcome = () => {
    welcomeScreen.classList.add("is-hidden");
    welcomeScreen.setAttribute("aria-hidden", "true");
  };

  const beginExit = () => {
    document.body.classList.add("has-entered");
    welcomeScreen.classList.add("is-leaving");
    welcomeScreen.addEventListener("animationend", removeWelcome, { once: true });
    window.setTimeout(removeWelcome, 1400);
  };

  welcomeEnter?.addEventListener("click", beginExit, { once: true });
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(date));
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function debounce(callback, delay) {
  let timer;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => callback(...args), delay);
  };
}

function withCacheOffset(path, index) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}instance=${index}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function makeLetterId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makePlaceholderImage(label, background, color) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <rect width="1200" height="800" fill="${background}"/>
      <circle cx="600" cy="400" r="190" fill="none" stroke="${color}" stroke-opacity=".16" stroke-width="2"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        fill="${color}" font-family="Inter, Arial, sans-serif" font-size="58" font-weight="800">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function makeEnvelopePlaceholder(fill, stroke) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="260" height="170" viewBox="0 0 260 170">
      <path d="M24 42h212v108H24z" fill="${fill}" stroke="${stroke}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M27 45l103 72L233 45" fill="none" stroke="${stroke}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>
      <path d="M25 148l78-61M235 148l-78-61" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round" opacity=".75"/>
      <path d="M42 58h176" stroke="#fff" stroke-width="3" stroke-opacity=".36"/>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

init();
