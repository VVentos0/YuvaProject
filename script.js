const imageConfig = {
  // Replace these paths with your final assets.
  mainAnimatedImage: "images/tree-optimized.gif",
  flockBird: "images/birdan-optimized.gif",
  flockBirdFallback: "images/birdan-optimized.gif",
  blueSquareImages: [
    "images/birdan-optimized.gif",
    "images/birdan-optimized.gif",
    "images/birdan-optimized.gif",
    "images/birdan-optimized.gif",
    "images/birdan-optimized.gif",
    "images/birdan-optimized.gif",
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

const yuvaTvVideos = [
  { type: "youtube", id: "V0Oolnx5mv4", title: "YUVA TV" },
  // Example fallback:
  // { type: "file", src: "/videos/video1.webm", title: "YUVA TV" },
];

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
const TREE_ALPHA_THRESHOLD = 20;
const BIRD_ALPHA_THRESHOLD = 20;
const DEBUG_TREE_HIT_TEST = false;

const mainImage = document.querySelector("#mainAnimatedImage");
const mainTopImage = document.querySelector("#mainAnimatedTopImage");
const mainImageArea = document.querySelector("#treeHitArea") || document.querySelector(".main-image-area");
const atmosphereCanvas = document.querySelector("#atmosphereCanvas");
const shootingStarLayer = document.querySelector("#shootingStarLayer");
const slidingWorld = document.querySelector("#slidingWorld");
const sceneArrowRight = document.querySelector("#sceneArrowRight");
const sceneArrowLeft = document.querySelector("#sceneArrowLeft");
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
const wishIntroDialog = document.querySelector("#wishIntroDialog");
const wishFormDialog = document.querySelector("#wishFormDialog");
const openLetterModal = document.querySelector("#openLetterModal");
const closeLetterModal = document.querySelector("#closeLetterModal");
const closeRibbonDialog = document.querySelector("#closeRibbonDialog");
const closeStarDialog = document.querySelector("#closeStarDialog");
const closeCdDialog = document.querySelector("#closeCdDialog");
const closeAboutYuvaDialog = document.querySelector("#closeAboutYuvaDialog");
const closeEnvelopeLockedDialog = document.querySelector("#closeEnvelopeLockedDialog");
const closeWishIntroDialog = document.querySelector("#closeWishIntroDialog");
const dismissWishIntroDialog = document.querySelector("#dismissWishIntroDialog");
const openWishFormDialog = document.querySelector("#openWishFormDialog");
const closeWishFormDialog = document.querySelector("#closeWishFormDialog");
const dismissWishFormDialog = document.querySelector("#dismissWishFormDialog");
const wishForm = document.querySelector("#wishForm");
const wishText = document.querySelector("#wishText");
const letterForm = document.querySelector("#letterForm");
const birdName = document.querySelector("#birdName");
const anonymousBird = document.querySelector("#anonymousBird");
const letterBody = document.querySelector("#letterBody");
const letterBodyHint = document.querySelector("#letterBodyHint");
const letterWebsite = document.querySelector("#letterWebsite");
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
const chatWidget = document.querySelector("#chatWidget");
const chatToggle = document.querySelector("#chatToggle");
const chatUnread = document.querySelector("#chatUnread");
const chatPanel = document.querySelector("#chatPanel");
const chatClose = document.querySelector("#chatClose");
const chatJoinForm = document.querySelector("#chatJoinForm");
const chatNickname = document.querySelector("#chatNickname");
const chatRoom = document.querySelector("#chatRoom");
const chatMessages = document.querySelector("#chatMessages");
const chatEmpty = document.querySelector("#chatEmpty");
const chatLoadOlder = document.querySelector("#chatLoadOlder");
const chatComposeForm = document.querySelector("#chatComposeForm");
const chatMessageInput = document.querySelector("#chatMessageInput");
const chatWarning = document.querySelector("#chatWarning");
const chatOnlineCount = document.querySelector("#chatOnlineCount");
const chatTyping = document.querySelector("#chatTyping");
const chatAdminDialog = document.querySelector("#chatAdminDialog");
const chatAdminForm = document.querySelector("#chatAdminForm");
const chatAdminEmail = document.querySelector("#chatAdminEmail");
const chatAdminPassword = document.querySelector("#chatAdminPassword");
const chatAdminMessage = document.querySelector("#chatAdminMessage");
const closeChatAdminDialog = document.querySelector("#closeChatAdminDialog");
const dismissChatAdminDialog = document.querySelector("#dismissChatAdminDialog");
const yuvaTvPlayerHost = document.querySelector("#yuvaTvPlayer");
const yuvaTvStart = document.querySelector("#yuvaTvStart");
const yuvaTvStatus = document.querySelector("#yuvaTvStatus");
const yuvaTvMessage = document.querySelector("#yuvaTvMessage");
const yuvaTvPlayPause = document.querySelector("#yuvaTvPlayPause");
const yuvaTvMute = document.querySelector("#yuvaTvMute");
const yuvaTvNext = document.querySelector("#yuvaTvNext");

let toastTimer;
let atmosphereParticles = [];
let atmosphereFrame;
let shootingStarTimer;
let activeShootingStar = null;
let birdFlockTimer;
let activeBirdFlock = null;
let currentScene = "main";
let sceneHoverTimer;
let treeHitCanvas;
let treeHitContext;
let treeHitSourceImage;
let treeHitReady = false;
let treeHitHasUsableAlpha = false;
let treeHitUsesMask = false;
let treePointerIsOpaque = false;
let treePointerFrame = 0;
let birdHitCanvas;
let birdHitContext;
let birdHitSourceImage;
let birdHitReady = false;
let catFrame;
let catState;
let letterFormStartedAt = 0;
let sounds;
let musicEnabled = true;
let effectsEnabled = true;
let chatSocket;
let chatSessionId = "";
let chatJoined = false;
let chatJoinPending = false;
let chatSocketInitTimer;
let chatIsOpen = false;
let chatIsAdmin = false;
let chatUnreadCount = 0;
let chatTypingTimer;
let chatTypingClearTimer;
let chatPendingMessageId = 0;
let yuvaTvPlayer;
let yuvaTvReady = false;
let yuvaTvStarted = false;
let yuvaTvIndex = 0;
let yuvaTvMuted = true;
let yuvaTvErrorTimer;
let yuvaTvYouTubeApiPromise;
let yuvaTvBrokenIndexes = new Set();

function init() {
  resetSavedLettersOnce();
  initSounds();
  hydrateImages();
  initAtmosphere();
  initShootingStars();
  initBirdFlocks();
  initTreeHitTesting();
  initSceneTransition();
  updateDateTime();
  setInterval(updateDateTime, 1000);
  updatePreview();
  updateLetterCount();
  renderEnvelopeStack();
  loadPublicLetters();
  decorateBlueSquares();
  initChat();
  initYuvaTv();
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

function initTreeHitTesting() {
  if (!mainImageArea || !mainImage) return;

  treeHitCanvas = document.createElement("canvas");
  treeHitContext = treeHitCanvas.getContext("2d", { willReadFrequently: true });
  if (!treeHitContext) return;

  logTreeHitDebug("init", { listenerTarget: mainImageArea.id || mainImageArea.className });

  const mask = new Image();
  mask.decoding = "async";
  mask.onload = () => prepareTreeHitCanvas(mask, { isMask: true });
  mask.onerror = () => {
    logTreeHitDebug("mask missing, using gif/approx fallback");
    prepareTreeHitCanvas(mainImage, { isMask: false });
  };
  mask.src = "images/tree-hit-mask.png";

  if (mainImage.complete && mainImage.naturalWidth) {
    prepareTreeHitCanvas(mainImage, { isMask: false });
  } else {
    mainImage.addEventListener("load", () => {
      if (!treeHitReady) prepareTreeHitCanvas(mainImage, { isMask: false });
    }, { once: true });
  }

  mainImageArea.addEventListener("pointermove", handleTreePointerMove);
  mainImageArea.addEventListener("pointerdown", handleTreePointerDown);
  mainImageArea.addEventListener("pointerleave", resetTreeActiveState);
  mainImageArea.addEventListener("pointercancel", resetTreeActiveState);
}

function prepareTreeHitCanvas(sourceImage, options = {}) {
  if (!treeHitContext || !sourceImage?.naturalWidth || !sourceImage?.naturalHeight) return;

  if (treeHitUsesMask && !options.isMask) return;

  treeHitSourceImage = sourceImage;
  treeHitUsesMask = Boolean(options.isMask);
  treeHitCanvas.width = sourceImage.naturalWidth;
  treeHitCanvas.height = sourceImage.naturalHeight;
  treeHitContext.clearRect(0, 0, treeHitCanvas.width, treeHitCanvas.height);

  try {
    treeHitContext.drawImage(sourceImage, 0, 0, treeHitCanvas.width, treeHitCanvas.height);
    treeHitContext.getImageData(0, 0, 1, 1);
    treeHitReady = true;
    treeHitHasUsableAlpha = hasUsableTreeAlpha();
    logTreeHitDebug("canvas ready", {
      isMask: treeHitUsesMask,
      width: treeHitCanvas.width,
      height: treeHitCanvas.height,
      hasUsableAlpha: treeHitHasUsableAlpha,
    });
  } catch (error) {
    treeHitReady = false;
    treeHitHasUsableAlpha = false;
    console.warn("Tree alpha hit-test canvas could not be read.", error);
  }
}

function hasUsableTreeAlpha() {
  if (!treeHitContext || !treeHitCanvas?.width || !treeHitCanvas?.height) return false;

  const sampleSize = 9;
  let opaqueCount = 0;
  let transparentCount = 0;

  try {
    for (let yIndex = 0; yIndex < sampleSize; yIndex += 1) {
      for (let xIndex = 0; xIndex < sampleSize; xIndex += 1) {
        const x = Math.round((treeHitCanvas.width * (xIndex + 0.5)) / sampleSize);
        const y = Math.round((treeHitCanvas.height * (yIndex + 0.5)) / sampleSize);
        const alpha = treeHitContext.getImageData(Math.min(x, treeHitCanvas.width - 1), Math.min(y, treeHitCanvas.height - 1), 1, 1).data[3];
        if (alpha > TREE_ALPHA_THRESHOLD) opaqueCount += 1;
        else transparentCount += 1;
      }
    }
  } catch (error) {
    console.warn("Tree alpha hit-test sample failed.", error);
    return false;
  }

  return opaqueCount > 0 && transparentCount > 0;
}

function getImagePixelCoordinates(event) {
  if (!mainImage || !treeHitSourceImage?.naturalWidth || !treeHitSourceImage?.naturalHeight) {
    logTreeHitDebug("coords unavailable", {
      hasMainImage: Boolean(mainImage),
      naturalWidth: treeHitSourceImage?.naturalWidth || 0,
      naturalHeight: treeHitSourceImage?.naturalHeight || 0,
    });
    return null;
  }

  const rect = mainImage.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;

  const imageRatio = treeHitSourceImage.naturalWidth / treeHitSourceImage.naturalHeight;
  const rectRatio = rect.width / rect.height;
  let renderedWidth = rect.width;
  let renderedHeight = rect.height;
  let renderedLeft = rect.left;
  let renderedTop = rect.top;

  if (rectRatio > imageRatio) {
    renderedWidth = rect.height * imageRatio;
    renderedLeft = rect.left + (rect.width - renderedWidth) / 2;
  } else {
    renderedHeight = rect.width / imageRatio;
    renderedTop = rect.top + (rect.height - renderedHeight) / 2;
  }

  const relativeX = event.clientX - renderedLeft;
  const relativeY = event.clientY - renderedTop;
  if (relativeX < 0 || relativeY < 0 || relativeX > renderedWidth || relativeY > renderedHeight) return null;

  return {
    x: Math.floor((relativeX / renderedWidth) * treeHitSourceImage.naturalWidth),
    y: Math.floor((relativeY / renderedHeight) * treeHitSourceImage.naturalHeight),
    normalizedX: relativeX / renderedWidth,
    normalizedY: relativeY / renderedHeight,
  };
}

function isPointerOnOpaquePixel(event) {
  const point = getImagePixelCoordinates(event);
  if (!point) {
    logTreeHitDebug("hit-test", { hasEvent: Boolean(event), isOpaque: false, reason: "outside-rendered-image" });
    return false;
  }

  if (!treeHitReady || !treeHitContext || !treeHitCanvas || !treeHitHasUsableAlpha) {
    const approximateOpaque = isPointerInApproximateTreeShape(point);
    logTreeHitDebug("hit-test approximate", {
      x: point.x,
      y: point.y,
      normalizedX: point.normalizedX.toFixed(3),
      normalizedY: point.normalizedY.toFixed(3),
      ready: treeHitReady,
      hasUsableAlpha: treeHitHasUsableAlpha,
      isOpaque: approximateOpaque,
    });
    return approximateOpaque;
  }

  try {
    const safeX = Math.max(0, Math.min(treeHitCanvas.width - 1, point.x));
    const safeY = Math.max(0, Math.min(treeHitCanvas.height - 1, point.y));
    const alpha = treeHitContext.getImageData(safeX, safeY, 1, 1).data[3];
    const isOpaque = alpha > TREE_ALPHA_THRESHOLD;
    const approximateOpaque = isPointerInApproximateTreeShape(point);
    const finalOpaque = isOpaque || (!treeHitUsesMask && approximateOpaque && alpha <= TREE_ALPHA_THRESHOLD);
    logTreeHitDebug("hit-test alpha", {
      x: safeX,
      y: safeY,
      alpha,
      isOpaque: finalOpaque,
      alphaOpaque: isOpaque,
      approximateOpaque,
      source: treeHitUsesMask ? "mask" : "gif",
    });
    return finalOpaque;
  } catch (error) {
    console.warn("Tree alpha hit-test failed.", error);
    const approximateOpaque = isPointerInApproximateTreeShape(point);
    logTreeHitDebug("hit-test fallback after error", { isOpaque: approximateOpaque });
    return approximateOpaque;
  }
}

function isPointerInApproximateTreeShape(point) {
  const x = point.normalizedX;
  const y = point.normalizedY;
  const inCanopy = isPointInEllipse(x, y, 0.5, 0.42, 0.34, 0.32);
  const inLeftCanopy = isPointInEllipse(x, y, 0.37, 0.48, 0.2, 0.24);
  const inRightCanopy = isPointInEllipse(x, y, 0.63, 0.5, 0.2, 0.24);
  const inLowerBranches = isPointInEllipse(x, y, 0.5, 0.64, 0.25, 0.18);
  const inTrunk = x > 0.43 && x < 0.57 && y > 0.56 && y < 0.95;
  const inBase = isPointInEllipse(x, y, 0.5, 0.86, 0.18, 0.1);

  return inCanopy || inLeftCanopy || inRightCanopy || inLowerBranches || inTrunk || inBase;
}

function isPointInEllipse(x, y, centerX, centerY, radiusX, radiusY) {
  return ((x - centerX) ** 2) / (radiusX ** 2) + ((y - centerY) ** 2) / (radiusY ** 2) <= 1;
}

function logTreeHitDebug(message, details) {
  if (!DEBUG_TREE_HIT_TEST) return;
  console.log("[tree-hit-test]", message, details || "");
}

function setTreeActiveState(active) {
  treePointerIsOpaque = active;
  mainImageArea?.classList.toggle("is-tree-hovered", active);
  if (!active) stopTreeSound();
}

function triggerTreeInteraction() {
  setTreeActiveState(true);
  logTreeHitDebug("trigger");
  playTreeSound();
}

function updateTreePointerState(event) {
  const isOpaque = isPointerOnOpaquePixel(event);
  if (isOpaque && !treePointerIsOpaque) {
    triggerTreeInteraction();
    return;
  }

  if (!isOpaque && treePointerIsOpaque) {
    setTreeActiveState(false);
  }
}

function handleTreePointerMove(event) {
  window.cancelAnimationFrame(treePointerFrame);
  treePointerFrame = window.requestAnimationFrame(() => updateTreePointerState(event));
}

function handleTreePointerDown(event) {
  if (!isPointerOnOpaquePixel(event)) {
    setTreeActiveState(false);
    return;
  }

  if (!treePointerIsOpaque) triggerTreeInteraction();
}

function resetTreeActiveState() {
  window.cancelAnimationFrame(treePointerFrame);
  setTreeActiveState(false);
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
  const atmosphereWidth = () => window.innerWidth * 2;
  const isMobileAtmosphere = () => window.matchMedia("(max-width: 768px)").matches;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const worldWidth = atmosphereWidth();
    atmosphereCanvas.width = Math.floor(worldWidth * dpr);
    atmosphereCanvas.height = Math.floor(window.innerHeight * dpr);
    atmosphereCanvas.style.width = `${worldWidth}px`;
    atmosphereCanvas.style.height = `${window.innerHeight}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    createAtmosphereParticles();
  }

  function createAtmosphereParticles() {
    const worldWidth = atmosphereWidth();
    const density = isMobileAtmosphere() ? 155000 : 52000;
    const maxParticles = isMobileAtmosphere() ? 24 : 84;
    const minParticles = isMobileAtmosphere() ? 10 : 32;
    const count = Math.min(maxParticles, Math.max(minParticles, Math.floor((worldWidth * window.innerHeight) / density)));
    atmosphereParticles = Array.from({ length: count }, () => ({
      x: Math.random() * worldWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 1.35 + 0.45,
      alpha: 1,
      driftX: (Math.random() - 0.5) * 0.22,
      driftY: -0.09 - Math.random() * 0.16,
      pulse: Math.random() * Math.PI * 2,
    }));
  }

  function drawGrain() {
    const worldWidth = atmosphereWidth();
    const grainCount = isMobileAtmosphere() ? 320 : 1700;
    context.globalAlpha = isMobileAtmosphere() ? 0.034 : 0.065;
    context.fillStyle = "#fff8d8";
    for (let i = 0; i < grainCount; i += 1) {
      context.fillRect(Math.random() * worldWidth, Math.random() * window.innerHeight, 0.8, 0.8);
    }
    context.globalAlpha = 1;
  }

  function draw() {
    const worldWidth = atmosphereWidth();
    context.clearRect(0, 0, worldWidth, window.innerHeight);
    drawGrain();

    atmosphereParticles.forEach((particle) => {
      particle.pulse += 0.026;
      particle.x += particle.driftX;
      particle.y += particle.driftY;

      if (particle.y < -8) particle.y = window.innerHeight + 8;
      if (particle.x < -8) particle.x = worldWidth + 8;
      if (particle.x > worldWidth + 8) particle.x = -8;

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

function initShootingStars() {
  if (!shootingStarLayer) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) return;

  document.addEventListener("pointerdown", handleShootingStarPointerDown, true);
  window.spawnYuvaShootingStar = spawnShootingStar;
  scheduleNextShootingStar(6000, 12000);
}

function initBirdFlocks() {
  if (!slidingWorld) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) return;

  window.spawnYuvaBirdFlock = spawnBirdFlock;
  scheduleNextBirdFlock();
}

function scheduleNextBirdFlock(minDelay = 18000, maxDelay = 42000) {
  window.clearTimeout(birdFlockTimer);
  birdFlockTimer = window.setTimeout(() => {
    if (welcomeScreen && !welcomeScreen.classList.contains("is-hidden")) {
      scheduleNextBirdFlock(6000, 12000);
      return;
    }

    spawnBirdFlock();
    scheduleNextBirdFlock();
  }, randomBetween(minDelay, maxDelay));
}

function spawnBirdFlock() {
  if (!slidingWorld || activeBirdFlock) return;

  const flock = document.createElement("div");
  flock.className = "bird-flock";
  flock.setAttribute("aria-hidden", "true");

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const birdCount = Math.floor(randomBetween(3, 5));
  const startX = viewportWidth * randomBetween(1.28, 1.72);
  const startY = viewportHeight * randomBetween(0.14, 0.3);
  const treeX = viewportWidth * randomBetween(0.38, 0.48);
  const treeY = viewportHeight * randomBetween(0.34, 0.48);
  const duration = randomBetween(9000, 13500);
  const finished = [];

  for (let index = 0; index < birdCount; index += 1) {
    const track = document.createElement("span");
    const bird = document.createElement("img");
    const delay = index * randomBetween(120, 380);
    const scale = randomBetween(0.76, 1.08);
    const yOffset = randomBetween(-24, 28);
    const xOffset = randomBetween(-42, 34);

    track.className = "flock-bird-track";
    track.style.setProperty("--bird-start-x", `${startX + xOffset}px`);
    track.style.setProperty("--bird-start-y", `${startY + yOffset}px`);
    track.style.setProperty("--bird-end-x", `${treeX + randomBetween(-18, 26)}px`);
    track.style.setProperty("--bird-end-y", `${treeY + randomBetween(-18, 24)}px`);
    track.style.setProperty("--bird-duration", `${duration + randomBetween(-1200, 1200)}ms`);
    track.style.setProperty("--bird-delay", `${delay}ms`);

    bird.className = "flock-bird";
    bird.classList.add("is-flying-left");
    bird.src = imageConfig.flockBird;
    bird.alt = "";
    bird.draggable = false;
    bird.style.setProperty("--bird-scale", scale.toFixed(2));
    bird.style.setProperty("--bird-bob-duration", `${randomBetween(1800, 2600)}ms`);
    bird.addEventListener("error", () => {
      if (!bird.src.endsWith("birdan-optimized.gif")) bird.src = imageConfig.flockBirdFallback;
    }, { once: true });

    track.appendChild(bird);
    flock.appendChild(track);

    track.addEventListener("animationend", () => {
      finished.push(track);
      if (finished.length >= birdCount) clearBirdFlock();
    });
  }

  function clearBirdFlock() {
    flock.remove();
    activeBirdFlock = null;
  }

  activeBirdFlock = { clear: clearBirdFlock };
  slidingWorld.appendChild(flock);
  window.setTimeout(clearBirdFlock, duration + 2600);
}

function initSceneTransition() {
  if (!slidingWorld || !sceneArrowRight || !sceneArrowLeft) return;

  [sceneArrowRight, sceneArrowLeft].forEach((button) => {
    const image = button.querySelector("img");
    image?.addEventListener("error", () => button.classList.add("has-fallback"), { once: true });
    if (image?.complete && image.naturalWidth === 0) button.classList.add("has-fallback");
  });

  const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const queueScene = (scene) => {
    window.clearTimeout(sceneHoverTimer);
    sceneHoverTimer = window.setTimeout(() => setScene(scene), supportsHover ? 420 : 0);
  };
  const cancelQueuedScene = () => window.clearTimeout(sceneHoverTimer);

  sceneArrowRight.addEventListener("click", () => setScene("right"));
  sceneArrowLeft.addEventListener("click", () => setScene("main"));

  if (supportsHover) {
    sceneArrowRight.addEventListener("pointerenter", () => queueScene("right"));
    sceneArrowLeft.addEventListener("pointerenter", () => queueScene("main"));
    sceneArrowRight.addEventListener("pointerleave", cancelQueuedScene);
    sceneArrowLeft.addEventListener("pointerleave", cancelQueuedScene);
  }

  setScene("main");
}

function setScene(scene) {
  currentScene = scene === "right" ? "right" : "main";
  slidingWorld?.classList.toggle("is-right", currentScene === "right");
  if (sceneArrowRight) sceneArrowRight.hidden = currentScene !== "main";
  if (sceneArrowLeft) sceneArrowLeft.hidden = currentScene !== "right";
}

function getSceneViewportOffset() {
  return currentScene === "right" ? window.innerWidth : 0;
}

function handleShootingStarPointerDown(event) {
  if (!activeShootingStar?.point) return;
  if (event.target?.closest?.("dialog")) return;

  const dx = event.clientX + getSceneViewportOffset() - activeShootingStar.point.x;
  const dy = event.clientY - activeShootingStar.point.y;
  const hitRadius = activeShootingStar.hitRadius || 34;

  if (Math.hypot(dx, dy) > hitRadius) return;

  event.preventDefault();
  event.stopPropagation();
  openWishIntroFromShootingStar();
}

function scheduleNextShootingStar(minDelay = 45000, maxDelay = 90000) {
  window.clearTimeout(shootingStarTimer);
  shootingStarTimer = window.setTimeout(() => {
    if (welcomeScreen && !welcomeScreen.classList.contains("is-hidden")) {
      scheduleNextShootingStar(6000, 12000);
      return;
    }

    spawnShootingStar();
    scheduleNextShootingStar();
  }, randomBetween(minDelay, maxDelay));
}

function spawnShootingStar() {
  if (!shootingStarLayer || activeShootingStar) return;

  shootingStarLayer.setAttribute("aria-hidden", "false");

  const viewportWidth = window.innerWidth;
  const worldWidth = viewportWidth * 2;
  const height = window.innerHeight;
  const viewportOffset = getSceneViewportOffset();
  const fromLeft = Math.random() > 0.5;
  const startX = viewportOffset + (fromLeft ? -48 : viewportWidth + 48);
  const endX = viewportOffset + (fromLeft ? viewportWidth * randomBetween(0.66, 0.92) : viewportWidth * randomBetween(0.08, 0.34));
  const startY = height * randomBetween(0.1, 0.2);
  const endY = height * randomBetween(0.24, 0.35);
  const controlX = viewportOffset + (fromLeft ? viewportWidth * randomBetween(0.22, 0.45) : viewportWidth * randomBetween(0.55, 0.78));
  const controlY = height * randomBetween(0.1, 0.16);
  const pathData = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
  const duration = randomBetween(7000, 10000);
  const trailLength = Math.min(viewportWidth * 0.22, 300);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("shooting-star-svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("viewBox", `0 0 ${worldWidth} ${height}`);
  svg.setAttribute("preserveAspectRatio", "none");

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  gradient.setAttribute("id", "shootingStarTrailGradient");
  gradient.setAttribute("gradientUnits", "userSpaceOnUse");
  gradient.setAttribute("x1", String(startX));
  gradient.setAttribute("y1", String(startY));
  gradient.setAttribute("x2", String(endX));
  gradient.setAttribute("y2", String(endY));
  [
    ["0%", "rgba(255, 205, 85, 0)"],
    ["55%", "rgba(255, 223, 118, 0.28)"],
    ["100%", "rgba(255, 244, 184, 0.88)"],
  ].forEach(([offset, color]) => {
    const stop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop.setAttribute("offset", offset);
    stop.setAttribute("stop-color", color);
    gradient.appendChild(stop);
  });
  defs.appendChild(gradient);
  svg.appendChild(defs);

  const trail = document.createElementNS("http://www.w3.org/2000/svg", "path");
  trail.classList.add("shooting-star-trail");
  trail.setAttribute("d", pathData);
  trail.setAttribute("stroke", "url(#shootingStarTrailGradient)");
  svg.appendChild(trail);

  const star = document.createElement("button");
  star.className = "shooting-star";
  star.type = "button";
  star.setAttribute("aria-label", "Kayan yildiza dilek tut");
  star.innerHTML = '<span class="shooting-star-core" aria-hidden="true"></span>';

  shootingStarLayer.append(svg, star);

  const totalLength = trail.getTotalLength();
  const startedAt = performance.now();
  let lastParticleAt = 0;
  let frame;

  function clearStar() {
    window.cancelAnimationFrame(frame);
    star.remove();
    svg.remove();
    activeShootingStar = null;
    shootingStarLayer.setAttribute("aria-hidden", "true");
  }

  function tick(now) {
    const elapsed = now - startedAt;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutSine(progress);
    const distance = totalLength * eased;
    const point = trail.getPointAtLength(distance);
    const prevPoint = trail.getPointAtLength(Math.max(0, distance - 4));
    const angle = Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x) * (180 / Math.PI);

    if (activeShootingStar) {
      activeShootingStar.point = { x: point.x, y: point.y };
      activeShootingStar.hitRadius = Math.max(34, Math.min(48, viewportWidth * 0.035));
    }

    star.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%) rotate(${angle}deg)`;
    trail.style.strokeDasharray = `${trailLength} ${totalLength}`;
    trail.style.strokeDashoffset = String(trailLength - distance);
    trail.style.opacity = String(progress > 0.82 ? Math.max(0, (1 - progress) / 0.18) : 1);

    if (now - lastParticleAt > 280 && progress > 0.08 && progress < 0.92) {
      createShootingStarParticle(point.x, point.y);
      lastParticleAt = now;
    }

    if (progress < 1) {
      frame = window.requestAnimationFrame(tick);
    } else {
      star.classList.add("is-fading");
      window.setTimeout(clearStar, 620);
    }
  }

  star.addEventListener("click", () => {
    openWishIntroFromShootingStar();
  });

  activeShootingStar = { clear: clearStar, hitRadius: 38, point: { x: startX, y: startY } };
  frame = window.requestAnimationFrame(tick);
}

function openWishIntroFromShootingStar() {
  if (wishIntroDialog && !wishIntroDialog.open) {
    wishIntroDialog.showModal();
    openWishFormDialog?.focus();
  }

  activeShootingStar?.clear();
}

function createShootingStarParticle(x, y) {
  if (!shootingStarLayer) return;

  const particle = document.createElement("span");
  particle.className = "shooting-star-particle";
  particle.style.left = `${x + randomBetween(-5, 5)}px`;
  particle.style.top = `${y + randomBetween(-4, 4)}px`;
  particle.style.setProperty("--particle-drift-x", `${randomBetween(-8, 6)}px`);
  particle.style.setProperty("--particle-drift-y", `${randomBetween(4, 14)}px`);
  shootingStarLayer.appendChild(particle);
  particle.addEventListener("animationend", () => particle.remove(), { once: true });
}

function easeInOutSine(value) {
  return -(Math.cos(Math.PI * value) - 1) / 2;
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
      img.src = imageConfig.blueSquareImages[index];
    }, startDelay);

    img.onerror = () => {
      img.src = fallbackImages.blue[index];
    };
  });
}

function initChat() {
  if (!chatWidget) return;

  chatSessionId = getOrCreateChatSessionId();
  setChatOpen(false);

  chatToggle?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setChatOpen(!chatIsOpen);
  });
  chatClose?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setChatOpen(false);
  });
  chatLoadOlder?.addEventListener("click", loadOlderChatMessages);
  chatJoinForm?.addEventListener("submit", joinChat);
  chatComposeForm?.addEventListener("submit", sendChatMessage);
  chatMessageInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      chatComposeForm?.requestSubmit();
    }
  });
  chatMessageInput?.addEventListener("input", sendChatTyping);
  chatMessages?.addEventListener("click", reportChatMessage);

  document.addEventListener("keydown", (event) => {
    const isYShortcut = event.key?.toLocaleLowerCase("tr-TR") === "y" || event.code === "KeyY";
    if (event.ctrlKey && event.shiftKey && isYShortcut) {
      event.preventDefault();
      openChatAdminLogin();
    }
  });

  let logoClicks = [];
  refreshHome?.addEventListener("click", () => {
    const now = Date.now();
    logoClicks = [...logoClicks.filter((time) => now - time < 1800), now];
    if (logoClicks.length >= 5) {
      logoClicks = [];
      openChatAdminLogin();
    }
  });

  closeChatAdminDialog?.addEventListener("click", () => chatAdminDialog.close());
  dismissChatAdminDialog?.addEventListener("click", () => chatAdminDialog.close());
  chatAdminForm?.addEventListener("submit", loginChatAdmin);

  connectChatSocket();

  window.setInterval(() => {
    if (chatJoined) chatSocket?.emit("chat:heartbeat");
  }, 25000);
}

function connectChatSocket() {
  if (chatSocket || typeof io !== "function") {
    if (!chatSocket && !chatSocketInitTimer) {
      chatSocketInitTimer = window.setTimeout(() => {
        chatSocketInitTimer = undefined;
        connectChatSocket();
      }, 800);
    }
    return;
  }

  checkChatAdminState();
  loadChatMessages();
  chatSocket = io({ transports: ["websocket", "polling"], reconnection: true });
  chatSocket.on("connect", () => {
    if (!chatJoined || !chatJoinPending) return;
    emitChatJoin();
  });
  chatSocket.on("chat:message", (message) => appendChatMessage(message));
  chatSocket.on("chat:presence", (presence) => {
    if (chatOnlineCount) chatOnlineCount.textContent = String(presence.onlineCount || 0);
  });
  chatSocket.on("chat:typing", (payload) => {
    if (!payload?.typing || payload.userSessionId === chatSessionId) return;
    if (chatTyping) chatTyping.textContent = "birisi yaz?yor...";
    window.clearTimeout(chatTypingClearTimer);
    chatTypingClearTimer = window.setTimeout(() => {
      if (chatTyping) chatTyping.textContent = "birisi yaz?yor...";
    }, 1800);
  });
  chatSocket.on("chat:moderated", (message) => {
    if (!message?.id) return;
    if (message.userSessionId) {
      chatMessages?.querySelectorAll(`[data-session-id="${message.userSessionId}"]`).forEach((element) => element.remove());
      updateChatEmptyState();
      return;
    }
    const element = chatMessages?.querySelector(`[data-message-id="${message.id}"]`);
    if (element) element.remove();
    updateChatEmptyState();
  });
  chatSocket.on("chat:banned", (payload) => {
    if (payload?.userSessionId !== chatSessionId) return;
    chatJoined = false;
    chatJoinPending = false;
    chatRoom.hidden = true;
    chatJoinForm.hidden = false;
    chatWidget?.classList.remove("is-joined");
    setChatWarning("Bu sohbet alan?na eri?imin kapal?.");
  });
}

function getOrCreateChatSessionId() {
  const key = "yuvaChatSessionId";
  const existing = localStorage.getItem(key);
  if (existing) return existing;

  const created = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(key, created);
  return created;
}

function setChatOpen(open) {
  chatIsOpen = open;
  chatWidget?.classList.toggle("is-open", open);
  chatPanel.hidden = !open;
  chatToggle?.setAttribute("aria-expanded", String(open));
  if (open) {
    chatUnreadCount = 0;
    updateChatUnread();
  }
}

async function loadChatMessages(beforeId = "") {
  try {
    const params = new URLSearchParams({ limit: "50" });
    if (beforeId) params.set("before", beforeId);
    const response = await fetch(`/api/chat/messages?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Chat messages failed");

    if (chatOnlineCount) chatOnlineCount.textContent = String(data.onlineCount || 0);
    const messages = Array.isArray(data.messages) ? data.messages : [];
    if (!beforeId) chatMessages.innerHTML = "";
    messages.forEach((message) => appendChatMessage(message, { prepend: Boolean(beforeId), quiet: true }));
    updateChatEmptyState();
  } catch (error) {
    setChatWarning("Sohbet ?u an y?klenemedi.");
  }
}

function loadOlderChatMessages() {
  const first = chatMessages?.querySelector("[data-message-id]");
  if (first?.dataset.messageId) {
    loadChatMessages(first.dataset.messageId);
  }
}

function joinChat(event) {
  event.preventDefault();
  const nickname = chatNickname.value.trim();
  if (!nickname) return;

  chatJoined = true;
  chatJoinPending = false;
  chatJoinForm.hidden = true;
  chatRoom.hidden = false;
  chatWidget?.classList.add("is-joined");
  setChatOpen(true);
  setChatWarning("");
  updateChatComposeState();
  chatMessageInput?.focus();

  if (!chatSocket) {
    connectChatSocket();
    updateChatComposeState();
    return;
  }

  emitChatJoin();
}

function emitChatJoin() {
  if (!chatSocket || !chatJoined) return;

  chatSocket.emit("chat:join", { nickname: chatNickname.value.trim(), userSessionId: chatSessionId }, (response) => {
    if (!response?.ok) {
      chatJoined = false;
      chatJoinPending = false;
      chatRoom.hidden = true;
      chatJoinForm.hidden = false;
      chatWidget?.classList.remove("is-joined");
      setChatOpen(true);
      setChatWarning(response?.error || "Sohbete kat?lamad?n.");
      updateChatComposeState();
      chatNickname?.focus();
      return;
    }

    chatJoined = true;
    chatJoinPending = false;
    chatIsAdmin = Boolean(response.isAdmin);
    chatJoinForm.hidden = true;
    chatRoom.hidden = false;
    chatWidget?.classList.add("is-joined");
    setChatOpen(true);
    setChatWarning("");
    updateChatComposeState();
    chatMessageInput?.focus();
  });
}

function sendChatMessage(event) {
  event.preventDefault();
  setChatOpen(true);
  const text = chatMessageInput.value.trim();
  if (!text) return;

  if (chatJoinPending || !chatJoined) {
    setChatWarning("Sohbete baglaninca gonderebilirsin.");
    return;
  }

  const pendingId = `pending-${Date.now()}-${chatPendingMessageId++}`;
  const pendingMessage = {
    id: pendingId,
    nickname: chatNickname?.value?.trim() || "cicikus",
    text,
    createdAt: new Date().toISOString(),
    isAdmin: chatIsAdmin,
    type: "user",
    pending: true,
  };

  appendChatMessage(pendingMessage, { quiet: true });
  chatMessageInput.value = "";
  setChatWarning("");
  chatMessageInput?.focus();

  sendChatMessageToServer({ text, pendingId }).catch((error) => {
    markChatMessageFailed(pendingId);
    setChatWarning(error.message || "Mesaj gonderilemedi.");
  });
}

async function sendChatMessageToServer({ text, pendingId }) {
  connectChatSocket();
  const response = await fetch("/api/chat/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nickname: chatNickname?.value?.trim() || "cicikus",
      text,
      userSessionId: chatSessionId,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Mesaj gonderilemedi.");
  }

  settlePendingChatMessage(pendingId, data.message);
  setChatWarning("");
  setChatOpen(true);
  chatMessageInput?.focus();
}

function updateChatComposeState() {
  const disabled = chatJoinPending || !chatJoined;
  if (chatMessageInput) chatMessageInput.disabled = disabled;
  const send = chatComposeForm?.querySelector("button");
  if (send) send.disabled = disabled;
}

function markChatMessageFailed(id) {
  const element = chatMessages?.querySelector(`[data-message-id="${id}"]`);
  if (!element) return;
  element.classList.add("is-failed");
  const pending = element.querySelector("[data-pending-label]");
  if (pending) pending.textContent = "g?nderilemedi";
}

function settlePendingChatMessage(id, message) {
  const element = chatMessages?.querySelector(`[data-message-id="${id}"]`);
  if (!element || !message) return;
  const existing = chatMessages?.querySelector(`[data-message-id="${message.id}"]`);
  if (existing && existing !== element) {
    element.remove();
    updateChatEmptyState();
    return;
  }

  element.dataset.messageId = message.id;
  element.classList.remove("is-pending", "is-failed");
  element.classList.toggle("is-admin", Boolean(message.isAdmin));
  const name = element.querySelector(".chat-message-name");
  const pending = element.querySelector("[data-pending-label]");
  const report = element.querySelector(".chat-report");

  if (name) name.textContent = message.nickname || "ciciku?";

  pending?.remove();
  if (report) report.dataset.reportId = message.id;
}

function sendChatTyping() {
  if (!chatJoined) return;
  chatSocket?.emit("chat:typing", { typing: true });
  window.clearTimeout(chatTypingTimer);
  chatTypingTimer = window.setTimeout(() => {
    chatSocket?.emit("chat:typing", { typing: false });
  }, 1000);
}

function appendChatMessage(message, options = {}) {
  if (!chatMessages || !message?.id) return;
  if (chatMessages.querySelector(`[data-message-id="${message.id}"]`)) return;

  const item = document.createElement("article");
  item.className = `chat-message${message.isAdmin ? " is-admin" : ""}${message.type === "system" ? " is-system" : ""}${message.pending ? " is-pending" : ""}`;
  item.dataset.messageId = message.id;
  if (message.userSessionId) item.dataset.sessionId = message.userSessionId;

  if (message.type === "system") {
    item.innerHTML = `<p>${escapeHtml(message.text || "")}</p>`;
  } else {
    item.innerHTML = `
      <header>
        <span class="chat-message-name">${escapeHtml(message.nickname || "ciciku?")}</span>
        ${message.isAdmin ? '<span class="chat-admin-badge">admin</span>' : ""}
        ${message.pending ? '<span class="chat-message-time" data-pending-label>g?nderiliyor</span>' : ""}
        <button class="chat-report" type="button" data-report-id="${message.id}" aria-label="Mesaj? bildir">!</button>
      </header>
      <p>${escapeHtml(message.text || "")}</p>
    `;
  }

  if (options.prepend) {
    chatMessages.prepend(item);
  } else {
    chatMessages.append(item);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  if (!options.quiet && !chatIsOpen) {
    chatUnreadCount += 1;
    updateChatUnread();
  }

  updateChatEmptyState();
}

async function reportChatMessage(event) {
  const button = event.target.closest("[data-report-id]");
  if (!button) return;

  try {
    const response = await fetch(`/api/chat/report/${button.dataset.reportId}`, { method: "POST" });
    if (!response.ok) throw new Error("Report failed");
    button.disabled = true;
    button.textContent = "?";
  } catch (error) {
    setChatWarning("Bildirim g?nderilemedi.");
  }
}

function updateChatEmptyState() {
  if (!chatEmpty || !chatMessages) return;
  chatEmpty.hidden = Boolean(chatMessages.querySelector("[data-message-id]"));
}

function updateChatUnread() {
  if (!chatUnread) return;
  chatUnread.hidden = chatUnreadCount <= 0;
  chatUnread.textContent = String(Math.min(chatUnreadCount, 9));
}

function setChatWarning(message) {
  if (chatWarning) chatWarning.textContent = message;
}

function initYuvaTv() {
  if (!yuvaTvPlayerHost) return;

  updateYuvaTvStatus(yuvaTvVideos.length ? `${yuvaTvVideos.length} video` : "video listesi bekliyor");
  showYuvaTvMessage(yuvaTvVideos.length ? "Başlat" : "Video bekliyor");
  setYuvaTvControlsDisabled(!yuvaTvVideos.length);

  yuvaTvPlayerHost.addEventListener("click", startYuvaTv);
  yuvaTvPlayPause?.addEventListener("click", stopYuvaTv);
  yuvaTvMute?.addEventListener("click", toggleYuvaTvMute);
  yuvaTvNext?.addEventListener("click", () => playNextYuvaTvVideo({ manual: true }));
}

async function startYuvaTv() {
  if (!yuvaTvVideos.length) {
    updateYuvaTvStatus("video listesi bekliyor");
    showYuvaTvMessage("Video bekliyor");
    return;
  }

  yuvaTvStarted = true;
  yuvaTvBrokenIndexes.clear();
  setYuvaTvControlsDisabled(false);
  await loadYuvaTvVideo(yuvaTvIndex, { autoplay: true });
}

async function loadYuvaTvVideo(index, options = {}) {
  clearTimeout(yuvaTvErrorTimer);
  const video = yuvaTvVideos[index];
  if (!video || !yuvaTvPlayerHost) return;

  yuvaTvReady = false;
  yuvaTvPlayerHost.replaceChildren();
  updateYuvaTvStatus(video.title || "YUVA TV");
  showYuvaTvMessage("Yükleniyor...");

  if (video.type === "file") {
    loadYuvaTvFile(video, options);
    return;
  }

  await loadYuvaTvYoutube(video, options);
}

async function loadYuvaTvYoutube(video, options = {}) {
  try {
    await loadYouTubeIframeApi();
    if (!window.YT?.Player || !yuvaTvPlayerHost) throw new Error("YouTube API yüklenemedi.");

    const mount = document.createElement("div");
    mount.id = "yuvaTvYoutubeMount";
    yuvaTvPlayerHost.replaceChildren(mount);

    yuvaTvPlayer = new YT.Player(mount, {
      width: "100%",
      height: "100%",
      videoId: video.id,
      playerVars: {
        autoplay: options.autoplay ? 1 : 0,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: () => {
          yuvaTvReady = true;
          yuvaTvBrokenIndexes.delete(yuvaTvIndex);
          const iframe = yuvaTvPlayer.getIframe?.();
          iframe?.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
          iframe?.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
          iframe?.setAttribute("allowfullscreen", "");
          if (yuvaTvMuted) yuvaTvPlayer.mute();
          else yuvaTvPlayer.unMute();
          if (options.autoplay) yuvaTvPlayer.playVideo();
          showYuvaTvMessage("");
          updateYuvaTvButtons();
          updateYuvaTvStatus("yayında");
        },
        onStateChange: handleYuvaTvStateChange,
        onError: handleYuvaTvError,
      },
    });
  } catch (error) {
    handleYuvaTvError(error);
  }
}

function loadYuvaTvFile(video, options = {}) {
  const element = document.createElement("video");
  element.src = video.src;
  element.controls = true;
  element.muted = yuvaTvMuted;
  element.playsInline = true;
  element.preload = "metadata";
  element.addEventListener("ended", () => playNextYuvaTvVideo());
  element.addEventListener("error", handleYuvaTvError);
  yuvaTvPlayerHost.replaceChildren(element);
  yuvaTvPlayer = element;
  yuvaTvReady = true;
  yuvaTvBrokenIndexes.delete(yuvaTvIndex);
  showYuvaTvMessage("");
  updateYuvaTvStatus("yayında");
  updateYuvaTvButtons();
  if (options.autoplay) element.play().catch(() => showYuvaTvMessage("Başlat"));
}

function loadYouTubeIframeApi() {
  if (window.YT?.Player) return Promise.resolve();
  if (yuvaTvYouTubeApiPromise) return yuvaTvYouTubeApiPromise;

  yuvaTvYouTubeApiPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    const previousReady = window.onYouTubeIframeAPIReady;
    const timeout = window.setTimeout(() => reject(new Error("YouTube API zaman aşımı.")), 8000);

    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      window.clearTimeout(timeout);
      resolve();
    };

    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => {
        window.clearTimeout(timeout);
        reject(new Error("YouTube API yüklenemedi."));
      };
      document.head.appendChild(script);
    }
  });

  return yuvaTvYouTubeApiPromise;
}

function handleYuvaTvStateChange(event) {
  if (!window.YT?.PlayerState) return;
  if (event.data === YT.PlayerState.ENDED) {
    playNextYuvaTvVideo();
    return;
  }

  updateYuvaTvButtons();
}

function handleYuvaTvError() {
  showYuvaTvMessage("Bu video şu an oynatılamıyor.");
  updateYuvaTvStatus("oynatılamıyor");
  yuvaTvBrokenIndexes.add(yuvaTvIndex);
  clearTimeout(yuvaTvErrorTimer);
  if (yuvaTvBrokenIndexes.size >= yuvaTvVideos.length) {
    yuvaTvStarted = false;
    return;
  }
  yuvaTvErrorTimer = window.setTimeout(() => playNextYuvaTvVideo(), 2000);
}

function playNextYuvaTvVideo() {
  if (!yuvaTvVideos.length) return;
  for (let step = 0; step < yuvaTvVideos.length; step += 1) {
    yuvaTvIndex = (yuvaTvIndex + 1) % yuvaTvVideos.length;
    if (!yuvaTvBrokenIndexes.has(yuvaTvIndex)) break;
  }
  loadYuvaTvVideo(yuvaTvIndex, { autoplay: yuvaTvStarted });
}

function stopYuvaTv() {
  if (!yuvaTvReady || !yuvaTvPlayer) return;
  const video = yuvaTvVideos[yuvaTvIndex];
  if (video?.type === "file") yuvaTvPlayer.pause();
  else yuvaTvPlayer.pauseVideo?.();
  yuvaTvStarted = false;
  updateYuvaTvStatus("durdu");
  updateYuvaTvButtons();
}

function toggleYuvaTvMute() {
  yuvaTvMuted = !yuvaTvMuted;
  const video = yuvaTvVideos[yuvaTvIndex];
  if (video?.type === "file" && yuvaTvPlayer) yuvaTvPlayer.muted = yuvaTvMuted;
  else if (yuvaTvPlayer) {
    if (yuvaTvMuted) yuvaTvPlayer.mute?.();
    else yuvaTvPlayer.unMute?.();
  }
  updateYuvaTvButtons();
}

function setYuvaTvControlsDisabled(disabled) {
  [yuvaTvPlayPause, yuvaTvMute, yuvaTvNext].forEach((button) => {
    if (button) button.disabled = disabled;
  });
}

function updateYuvaTvButtons() {
  if (yuvaTvMute) yuvaTvMute.textContent = yuvaTvMuted ? "Ses Aç" : "Ses Kapat";
  if (yuvaTvPlayPause) yuvaTvPlayPause.textContent = "Durdur";
}

function updateYuvaTvStatus(message) {
  if (yuvaTvStatus) yuvaTvStatus.textContent = message;
}

function showYuvaTvMessage(message) {
  if (!yuvaTvMessage) return;
  yuvaTvMessage.textContent = message;
  yuvaTvMessage.hidden = !message;
}
function openChatAdminLogin() {
  if (!chatAdminDialog) return;
  chatAdminMessage.textContent = "";
  chatAdminDialog.showModal();
  chatAdminEmail?.focus();
}

async function checkChatAdminState() {
  try {
    const response = await fetch("/api/chat/admin/me");
    const data = await response.json();
    chatIsAdmin = Boolean(data.isAdmin);
  } catch (error) {
    chatIsAdmin = false;
  }
}

async function loginChatAdmin(event) {
  event.preventDefault();
  try {
    const response = await fetch("/api/chat/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: chatAdminEmail.value.trim(),
        password: chatAdminPassword.value,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.isAdmin) throw new Error(data.error || "Bu alana eri?im yetkin yok.");
    chatIsAdmin = true;
    chatAdminDialog.close();
    showToast("Admin sohbet giri?i a??ld?.");
    window.setTimeout(() => window.location.reload(), 800);
  } catch (error) {
    chatAdminMessage.textContent = error.message || "Bu alana eri?im yetkin yok.";
  }
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
  closeWishIntroDialog?.addEventListener("click", () => wishIntroDialog.close());
  dismissWishIntroDialog?.addEventListener("click", () => wishIntroDialog.close());
  openWishFormDialog?.addEventListener("click", () => {
    wishIntroDialog.close();
    wishFormDialog.showModal();
    wishText?.focus();
  });
  closeWishFormDialog?.addEventListener("click", () => wishFormDialog.close());
  dismissWishFormDialog?.addEventListener("click", () => wishFormDialog.close());
  wishForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    wishFormDialog.close();
    wishForm.reset();
    showToast("Dile?in g?ky?z?nde kald?.");
  });

  openLetterModal.addEventListener("click", () => {
    playEffectSound("letterClick");
    letterFormStartedAt = Date.now();
    if (letterWebsite) letterWebsite.value = "";
    letterDialog.showModal();
    letterBody.focus();
  });
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    openLetterModal.addEventListener("pointerenter", playLetterHoverSound);
    openLetterModal.addEventListener("pointerleave", stopLetterHoverSound);
  }

  closeLetterModal.addEventListener("click", () => letterDialog.close());
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

  [ribbonDialog, starDialog, cdDialog, aboutYuvaDialog, envelopeLockedDialog, wishIntroDialog, wishFormDialog].forEach((dialog) => {
    if (!dialog) return;
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

  letterBody.addEventListener("input", () => {
    if (letterBody.value.trim().length >= 500) {
      setLetterBodyMessage("Minimum 500 karakter yazmal?s?n.");
    }
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
    letterFormStartedAt = Date.now();
    if (letterWebsite) letterWebsite.value = "";
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
      if (wishIntroDialog?.open) wishIntroDialog.close();
      if (wishFormDialog?.open) wishFormDialog.close();
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

  initBirdHitTesting();

  blueSquares.forEach((square) => {
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let hasDragged = false;

    square.addEventListener("pointerdown", (event) => {
      if (!isPointerOnOpaqueBird(event, square)) {
        square.classList.remove("is-bird-hovered");
        return;
      }

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
      if (!square.classList.contains("is-dragging")) {
        square.classList.toggle("is-bird-hovered", isPointerOnOpaqueBird(event, square));
        return;
      }

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
    square.addEventListener("pointerleave", () => {
      if (!square.classList.contains("is-dragging")) square.classList.remove("is-bird-hovered");
    });
  });
}

function initBirdHitTesting() {
  if (birdHitContext) return;

  birdHitCanvas = document.createElement("canvas");
  birdHitContext = birdHitCanvas.getContext("2d", { willReadFrequently: true });
  if (!birdHitContext) return;

  const birdImage = new Image();
  birdImage.decoding = "async";
  birdImage.onload = () => prepareBirdHitCanvas(birdImage);
  birdImage.onerror = () => {
    const fallback = blueSquares[0]?.querySelector("img");
    if (fallback?.complete && fallback.naturalWidth) prepareBirdHitCanvas(fallback);
  };
  birdImage.src = imageConfig.blueSquareImages[0] || "images/birdan-optimized.gif";
}

function prepareBirdHitCanvas(sourceImage) {
  if (!birdHitContext || !sourceImage?.naturalWidth || !sourceImage?.naturalHeight) return;

  birdHitSourceImage = sourceImage;
  birdHitCanvas.width = sourceImage.naturalWidth;
  birdHitCanvas.height = sourceImage.naturalHeight;
  birdHitContext.clearRect(0, 0, birdHitCanvas.width, birdHitCanvas.height);

  try {
    birdHitContext.drawImage(sourceImage, 0, 0, birdHitCanvas.width, birdHitCanvas.height);
    birdHitContext.getImageData(0, 0, 1, 1);
    birdHitReady = true;
  } catch (error) {
    birdHitReady = false;
  }
}

function getBirdPixelCoordinates(event, square) {
  const image = square?.querySelector("img");
  if (!image) return null;

  const rect = image.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const sourceWidth = birdHitSourceImage?.naturalWidth || image.naturalWidth || 1920;
  const sourceHeight = birdHitSourceImage?.naturalHeight || image.naturalHeight || 1080;

  const relativeX = event.clientX - rect.left;
  const relativeY = event.clientY - rect.top;
  if (relativeX < 0 || relativeY < 0 || relativeX > rect.width || relativeY > rect.height) return null;

  return {
    x: Math.floor((relativeX / rect.width) * sourceWidth),
    y: Math.floor((relativeY / rect.height) * sourceHeight),
    normalizedX: relativeX / rect.width,
    normalizedY: relativeY / rect.height,
  };
}

function isPointerOnOpaqueBird(event, square) {
  const point = getBirdPixelCoordinates(event, square);
  if (!point) return false;

  if (!birdHitReady || !birdHitContext || !birdHitCanvas) {
    return isPointerInApproximateBirdShape(point);
  }

  try {
    const safeX = Math.max(0, Math.min(birdHitCanvas.width - 1, point.x));
    const safeY = Math.max(0, Math.min(birdHitCanvas.height - 1, point.y));
    const alpha = birdHitContext.getImageData(safeX, safeY, 1, 1).data[3];
    return alpha > BIRD_ALPHA_THRESHOLD || isPointerInApproximateBirdShape(point);
  } catch (error) {
    return isPointerInApproximateBirdShape(point);
  }
}

function isPointerInApproximateBirdShape(point) {
  const x = point.normalizedX;
  const y = point.normalizedY;
  const inBody = isPointInEllipse(x, y, 0.56, 0.56, 0.16, 0.17);
  const inLeftWing = isPointInEllipse(x, y, 0.48, 0.48, 0.13, 0.13);
  const inRightWing = isPointInEllipse(x, y, 0.66, 0.47, 0.13, 0.14);
  const inTail = isPointInEllipse(x, y, 0.43, 0.62, 0.08, 0.11);

  return inBody || inLeftWing || inRightWing || inTail;
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
    edgePadding: 18,
    offscreenPadding: 120,
    speedMin: 0.34,
    speedMax: 0.58,
    laneYRatio: 0.84,
    sitMin: 1800,
    sitMax: 5200,
    walkMin: 3600,
    walkMax: 9000,
    reentryMin: 900,
    reentryMax: 2400,
  };

  const catSize = () => roamingCat.getBoundingClientRect();
  const catWorldWidth = () => window.innerWidth * 2;
  const pointerWorldX = (event) => event.clientX + getSceneViewportOffset();
  const laneY = () => {
    const rect = catSize();
    return Math.max(58, Math.min(window.innerHeight - rect.height - 18, window.innerHeight * config.laneYRatio));
  };
  const clampCat = () => {
    const rect = catSize();
    catState.x = Math.max(-rect.width - config.offscreenPadding, Math.min(catWorldWidth() + config.offscreenPadding, catState.x));
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
    return catState.x < catWorldWidth() / 2 ? "left" : "right";
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
    catState.x = side === "left" ? leftLandmarkEntryX() : catWorldWidth() + randomBetween(14, 70);
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
    catState.x = pointerWorldX(event) - catState.dragOffsetX;
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
        const canMoveOutward = side === "left" ? catState.x > -catSize().width * 0.6 : catState.x < catWorldWidth() - catSize().width * 0.4;
        const outward = side === "left" ? -1 : 1;
        const inward = side === "left" ? 1 : -1;
        startWalking(Math.random() > 0.46 && canMoveOutward ? outward : inward);
      }
    } else {
      const rect = catSize();
      catState.y = laneY();
      catState.x += catState.direction * catState.speed;
      catState.face = catState.direction;

      if (catState.x > catWorldWidth() + config.offscreenPadding) {
        scheduleReentry("left");
      } else if (catState.x < -rect.width - config.offscreenPadding) {
        scheduleReentry("right");
      } else if (now >= catState.walkUntil && catState.x > 0 && catState.x < catWorldWidth() - rect.width) {
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
  const body = letterBody.value.trim() || "Buraya i?inden ge?enleri yaz...";
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
    website: letterWebsite?.value || "",
    formStartedAt: letterFormStartedAt || Date.now(),
    submittedAt: Date.now(),
  };

  if (!payload.body) {
    setLetterBodyMessage("Mektup bo? olamaz.", true);
    showToast("Mektup Bo? Olamaz.");
    letterBody.focus();
    return;
  }

  if (payload.body.length < 500) {
    setLetterBodyMessage("Minimum 500 karakter yazmal?s?n.", true);
    showToast("Minimum 500 Karakter yazmal?s?n.");
    letterBody.focus();
    return;
  }

  setLetterBodyMessage("Minimum 500 karakter yazmal?s?n.");

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
      const error = new Error(errorBody.error || `HTTP ${response.status}`);
      error.status = response.status;
      throw error;
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
    letterFormStartedAt = 0;
    if (letterWebsite) letterWebsite.value = "";
    textColor.value = "#2d2926";
    senderColor.value = "#6b4f2a";
    paperStyle.value = "warm";
    envelopeStyle.value = "blue";
    syncVisualChoices();
    updatePreview();
    updateLetterCount();
    dropEnvelope(letter);
    showToast("Mektubun Yuvaya Ula?t?.");
  } catch (error) {
    console.error("Letter could not be saved to the API.", error);
    showToast(getLetterSubmitErrorMessage(error));
  } finally {
    setLetterFormBusy(false);
  }
}

function updateLetterCount() {
  const total = getLetters().length;
  letterCountLabel.textContent = `${total} - ki\u015fi yuvaya mektup b\u0131rakt\u0131`;
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
  envelope.setAttribute("aria-label", "Yuvaya b?rak?lm?? mektup zarf?");
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
  sendButton.textContent = isBusy ? "G?nderiliyor..." : "G?nder";
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
  if (anonymousBird.checked) return "anonim ku?";
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

function showToast(message = "Mektubun Yuvaya Ula?t?.") {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function getLetterSubmitErrorMessage(error) {
  if (error?.status === 409) return "Bu mektup yak?n zamanda g?nderildi.";
  if (error?.status === 429) return "?ok h?zl? g?nderim yap?ld?, biraz sonra tekrar dene.";
  if (String(error?.message || "").includes("500 characters")) return "Minimum 500 Karakter yazmal?s?n.";
  if (String(error?.message || "").includes("little more time")) return "G?ndermeden ?nce biraz daha bekle.";
  return "Mektup G?nderilemedi, Tekrar Dene.";
}

function setLetterBodyMessage(message, isError = false) {
  if (!letterBodyHint) return;
  letterBodyHint.textContent = message;
  letterBodyHint.classList.toggle("is-error", isError);
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
    scheduleNextShootingStar(1800, 3600);
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
