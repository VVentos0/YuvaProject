/* YUVA · Mektup Odası (/sedoveiro) — recipient reading room client.
   Loaded as an external script (CSP blocks inline scripts). Dependency-free. */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const gate = $("gate");
  const gateForm = $("gateForm");
  const gatePassword = $("gatePassword");
  const gateButton = $("gateButton");
  const gateError = $("gateError");
  const gateCard = gateForm;

  const room = $("room");
  const grid = $("grid");
  const emptyMsg = $("empty");
  const logoutButton = $("logoutButton");

  const progressText = $("progressText");
  const progressPct = $("progressPct");
  const progressFill = $("progressFill");

  const tabSEDO = $("tabSEDO");
  const tabIRO = $("tabIRO");
  const countSEDO = $("countSEDO");
  const countIRO = $("countIRO");
  const badgeSEDO = $("badgeSEDO");
  const badgeIRO = $("badgeIRO");

  const filterSeg = $("filterSeg");
  const sortSelect = $("sortSelect");

  const reader = $("reader");
  const readerBackdrop = $("readerBackdrop");
  const letterSheet = $("letterSheet");
  const sheetSticker = $("sheetSticker");
  const sheetMeta = $("sheetMeta");
  const sheetTitle = $("sheetTitle");
  const sheetBody = $("sheetBody");
  const sheetSign = $("sheetSign");
  const readerPrev = $("readerPrev");
  const readerNext = $("readerNext");
  const readerPos = $("readerPos");
  const readerClose = $("readerClose");
  const toggleReadButton = $("toggleReadButton");
  const letterSound = $("letterSound");

  const PAPER = ["warm", "linen", "blue", "rose"];
  const FONTS = ["modern", "serif", "soft", "pixel", "mono", "hand", "dream"];
  const ENVELOPE_FILTERS = {
    cream: "sepia(0.18) saturate(1.12) hue-rotate(236deg) brightness(0.92) contrast(0.88)",
    rose: "sepia(0.18) saturate(0.92) hue-rotate(312deg) brightness(0.98) contrast(0.88)",
    blue: "sepia(0.34) saturate(1.04) hue-rotate(14deg) brightness(1) contrast(0.9)",
    sage: "sepia(0.3) saturate(0.82) hue-rotate(58deg) brightness(0.94) contrast(0.88)",
  };

  const state = {
    letters: [],
    tab: "SEDO",
    filter: "all",
    sort: "new",
    snapshot: [], // ids in reader-navigation order
    index: -1,
    firstRender: true, // gradual staggered reveal only on the very first grid paint
  };

  const dateFmt = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" });
  const fullDateFmt = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" });

  const safeSticker = (value) =>
    typeof value === "string" && /^images\/[\w.-]+\.(avif|png|webp|gif|svg)$/i.test(value) ? value : "";

  // ---------- fireflies ----------
  function spawnFireflies() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const host = $("fireflies");
    if (!host) return;
    const count = window.innerWidth < 640 ? 14 : 26;
    for (let i = 0; i < count; i++) {
      const f = document.createElement("span");
      f.className = "firefly";
      f.style.left = Math.random() * 100 + "vw";
      f.style.top = Math.random() * 100 + "vh";
      f.style.setProperty("--dx", (Math.random() * 60 - 30).toFixed(0) + "px");
      f.style.setProperty("--dy", (-30 - Math.random() * 50).toFixed(0) + "px");
      f.style.setProperty("--dur", (7 + Math.random() * 8).toFixed(1) + "s");
      f.style.setProperty("--delay", (Math.random() * 8).toFixed(1) + "s");
      host.appendChild(f);
    }
  }

  // ---------- data ----------
  async function fetchLetters() {
    const res = await fetch("/api/sedoveiro/letters", { credentials: "same-origin" });
    if (res.status === 401) return null;
    if (!res.ok) throw new Error("load failed");
    const data = await res.json();
    return Array.isArray(data.letters) ? data.letters : [];
  }

  async function patchRead(id, read) {
    const res = await fetch(`/api/sedoveiro/letters/${id}/read`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ read }),
    });
    if (!res.ok) throw new Error("read failed");
    const data = await res.json();
    return data.letter;
  }

  // ---------- views ----------
  function currentList() {
    let list = state.letters.filter((l) => l.recipient === state.tab);
    if (state.filter === "unread") list = list.filter((l) => !l.readAt);
    const byNew = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
    if (state.sort === "old") list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    else if (state.sort === "unread") list.sort((a, b) => (!!a.readAt - !!b.readAt) || byNew(a, b));
    else list.sort(byNew);
    return list;
  }

  function renderStats() {
    const sedo = state.letters.filter((l) => l.recipient === "SEDO");
    const iro = state.letters.filter((l) => l.recipient === "IRO");
    countSEDO.textContent = sedo.length;
    countIRO.textContent = iro.length;

    const unread = (arr) => arr.filter((l) => !l.readAt).length;
    const uS = unread(sedo);
    const uI = unread(iro);
    badgeSEDO.hidden = uS === 0;
    badgeSEDO.textContent = uS;
    badgeIRO.hidden = uI === 0;
    badgeIRO.textContent = uI;

    const active = state.tab === "SEDO" ? sedo : iro;
    const read = active.length - unread(active);
    const pct = active.length ? Math.round((read / active.length) * 100) : 0;
    progressText.textContent = `${read} / ${active.length} okundu`;
    progressPct.textContent = `%${pct}`;
    progressFill.style.width = pct + "%";
  }

  function makeMeta(text, extraClass) {
    const span = document.createElement("span");
    span.textContent = text;
    if (extraClass) span.className = extraClass;
    return span;
  }

  function senderLabel(letter) {
    if (letter.anonymous || !letter.author) return "Anonim";
    return letter.author;
  }

  function renderGrid() {
    renderStats();
    const list = currentList();
    grid.textContent = "";

    if (!list.length) {
      emptyMsg.hidden = false;
      return;
    }
    emptyMsg.hidden = true;

    // Gradual "letters arriving" reveal on first open; snappier on re-renders.
    const step = state.firstRender ? 26 : 8;
    const cap = state.firstRender ? 1500 : 320;

    list.forEach((letter, i) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "env-card " + (letter.readAt ? "is-read" : "is-unread");
      card.dataset.id = letter.id;
      card.style.setProperty("--stagger", Math.min(i * step, cap) + "ms");
      card.setAttribute("aria-label", `${letter.recipient} · ${senderLabel(letter)} · ${letter.readAt ? "okundu" : "okunmadı"}`);

      const check = document.createElement("span");
      check.className = "env-check";
      check.textContent = "✓";

      const imgWrap = document.createElement("span");
      imgWrap.className = "env-image";
      imgWrap.style.setProperty("--envelope-filter", ENVELOPE_FILTERS[letter.envelope] || ENVELOPE_FILTERS.cream);
      const img = document.createElement("img");
      img.src = "images/envelope.png";
      img.alt = "";
      img.draggable = false;
      imgWrap.appendChild(img);

      const foot = document.createElement("span");
      foot.className = "env-foot";
      const rec = document.createElement("span");
      rec.className = "env-recipient";
      rec.dataset.r = letter.recipient;
      rec.textContent = letter.recipient;
      const from = document.createElement("span");
      from.className = "env-from";
      from.textContent = senderLabel(letter);
      const date = document.createElement("span");
      date.className = "env-date";
      date.textContent = dateFmt.format(new Date(letter.createdAt));
      foot.append(rec, from, date);

      card.append(check, imgWrap, foot);
      card.addEventListener("click", () => openReader(letter.id));
      grid.appendChild(card);
    });

    state.firstRender = false;
  }

  // Lightweight in-place update of one card's read state (no full re-render, so
  // the grid doesn't re-run its entrance animation while a letter is open).
  function updateCardState(id) {
    const card = grid.querySelector(`.env-card[data-id="${id}"]`);
    const letter = state.letters.find((l) => l.id === id);
    if (!card || !letter) return;
    card.classList.toggle("is-read", !!letter.readAt);
    card.classList.toggle("is-unread", !letter.readAt);
  }

  // ---------- reader ----------
  function renderSheet(letter, swap) {
    const paper = "paper-" + (PAPER.includes(letter.paper) ? letter.paper : "warm");
    const font = "font-" + (FONTS.includes(letter.font) ? letter.font : "modern");
    // Reset then force reflow so the open/swap animation (and the staggered
    // inner-content reveal below) restarts cleanly on every letter.
    letterSheet.className = "letter-sheet " + paper + " " + font;
    void letterSheet.offsetWidth;
    letterSheet.classList.add(swap ? "swapping" : "opening");
    letterSheet.style.color = letter.color || "";

    sheetMeta.textContent = "";
    sheetMeta.append(
      makeMeta(letter.recipient + "'ya"),
      makeMeta(senderLabel(letter) + "'den"),
      makeMeta(fullDateFmt.format(new Date(letter.createdAt))),
    );

    sheetTitle.textContent = letter.title || "";
    sheetBody.textContent = letter.body || "";

    const sign = letter.anonymous || !letter.author ? "" : "— " + letter.author;
    sheetSign.textContent = sign;
    if (letter.senderColor) sheetSign.style.color = letter.senderColor;

    const sticker = safeSticker(letter.sticker);
    sheetSticker.textContent = "";
    if (sticker) {
      const img = document.createElement("img");
      img.src = sticker;
      img.alt = "";
      sheetSticker.appendChild(img);
    }

    letterSheet.scrollTop = 0;
  }

  function updateReaderControls() {
    readerPrev.disabled = state.index <= 0;
    readerNext.disabled = state.index >= state.snapshot.length - 1;
    readerPos.textContent = `${state.index + 1} / ${state.snapshot.length}`;
    const letter = state.letters.find((l) => l.id === state.snapshot[state.index]);
    toggleReadButton.textContent = letter && letter.readAt ? "Okunmadı işaretle" : "Okundu işaretle";
  }

  async function autoMarkRead(letter) {
    if (!letter || letter.readAt) return;
    // optimistic
    letter.readAt = new Date().toISOString();
    renderStats();
    updateCardState(letter.id);
    updateReaderControls();
    try {
      const updated = await patchRead(letter.id, true);
      if (updated) letter.readAt = updated.readAt;
    } catch (e) {
      letter.readAt = null; // revert on failure
      renderStats();
      updateCardState(letter.id);
      updateReaderControls();
    }
  }

  function showLetterAt(index, swap) {
    state.index = index;
    const id = state.snapshot[index];
    const letter = state.letters.find((l) => l.id === id);
    if (!letter) return;
    renderSheet(letter, swap);
    updateReaderControls();
    autoMarkRead(letter);
  }

  function openReader(id) {
    // snapshot the currently displayed list so navigation is stable while read-state changes
    state.snapshot = currentList().map((l) => l.id);
    if (!state.snapshot.includes(id)) state.snapshot.unshift(id);
    const index = state.snapshot.indexOf(id);
    reader.hidden = false;
    document.body.style.overflow = "hidden";
    playLetterSound();
    showLetterAt(index, false);
    readerClose.focus();
  }

  function closeReader() {
    reader.hidden = true;
    document.body.style.overflow = "";
    renderGrid();
  }

  function playLetterSound() {
    if (!letterSound) return;
    try {
      letterSound.currentTime = 0;
      const p = letterSound.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) {}
  }

  async function toggleCurrentRead() {
    const letter = state.letters.find((l) => l.id === state.snapshot[state.index]);
    if (!letter) return;
    const next = !letter.readAt;
    const prev = letter.readAt;
    letter.readAt = next ? new Date().toISOString() : null;
    renderStats();
    updateCardState(letter.id);
    updateReaderControls();
    try {
      const updated = await patchRead(letter.id, next);
      if (updated) letter.readAt = updated.readAt;
    } catch (e) {
      letter.readAt = prev;
      renderStats();
      updateCardState(letter.id);
      updateReaderControls();
    }
  }

  // ---------- room / gate ----------
  function enterRoom(letters) {
    state.letters = letters;
    gate.hidden = true;
    room.hidden = false;
    renderGrid();
  }

  function setTab(recipient) {
    state.tab = recipient;
    tabSEDO.classList.toggle("is-active", recipient === "SEDO");
    tabIRO.classList.toggle("is-active", recipient === "IRO");
    tabSEDO.setAttribute("aria-selected", recipient === "SEDO");
    tabIRO.setAttribute("aria-selected", recipient === "IRO");
    renderGrid();
  }

  async function handleLogin(event) {
    event.preventDefault();
    gateError.hidden = true;
    gateButton.disabled = true;
    gateButton.textContent = "…";
    try {
      const res = await fetch("/api/sedoveiro/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password: gatePassword.value }),
      });
      if (!res.ok) throw new Error("bad");
      const letters = await fetchLetters();
      if (letters === null) throw new Error("bad");
      // Animate the gate away, then reveal the room.
      gate.classList.add("is-leaving");
      await new Promise((r) => setTimeout(r, 460));
      enterRoom(letters);
      return;
    } catch (e) {
      gateError.hidden = false;
      gateCard.classList.remove("shake");
      void gateCard.offsetWidth; // restart animation
      gateCard.classList.add("shake");
      gatePassword.value = "";
      gatePassword.focus();
    } finally {
      gateButton.disabled = false;
      gateButton.textContent = "Gir";
    }
  }

  async function logout() {
    try {
      await fetch("/api/sedoveiro/logout", { method: "POST", credentials: "same-origin" });
    } catch (e) {}
    window.location.href = "/"; // back to the main YUVA site
  }

  // ---------- wire up ----------
  function bind() {
    gateForm.addEventListener("submit", handleLogin);
    logoutButton.addEventListener("click", logout);
    tabSEDO.addEventListener("click", () => setTab("SEDO"));
    tabIRO.addEventListener("click", () => setTab("IRO"));

    filterSeg.addEventListener("click", (e) => {
      const btn = e.target.closest(".seg-btn");
      if (!btn) return;
      state.filter = btn.dataset.filter;
      filterSeg.querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("is-active", b === btn));
      renderGrid();
    });

    sortSelect.addEventListener("change", () => {
      state.sort = sortSelect.value;
      renderGrid();
    });

    readerPrev.addEventListener("click", () => {
      if (state.index > 0) showLetterAt(state.index - 1, true);
    });
    readerNext.addEventListener("click", () => {
      if (state.index < state.snapshot.length - 1) showLetterAt(state.index + 1, true);
    });
    readerClose.addEventListener("click", closeReader);
    readerBackdrop.addEventListener("click", closeReader);
    toggleReadButton.addEventListener("click", toggleCurrentRead);

    document.addEventListener("keydown", (e) => {
      if (reader.hidden) return;
      if (e.key === "Escape") closeReader();
      else if (e.key === "ArrowLeft" && state.index > 0) showLetterAt(state.index - 1, true);
      else if (e.key === "ArrowRight" && state.index < state.snapshot.length - 1) showLetterAt(state.index + 1, true);
    });
  }

  async function init() {
    spawnFireflies();
    bind();
    // Already authenticated? (cookie present) → skip the gate.
    try {
      const letters = await fetchLetters();
      if (letters !== null) {
        enterRoom(letters);
        return;
      }
    } catch (e) {
      /* show gate below */
    }
    gate.hidden = false;
    gatePassword.focus();
  }

  init();
})();
