const recipient = document.querySelector("#recipient");
const refresh = document.querySelector("#refresh");
const statusLabel = document.querySelector("#status");
const countLabel = document.querySelector("#count");
const sedoCountLabel = document.querySelector("#sedoCount");
const iroCountLabel = document.querySelector("#iroCount");
const lettersRoot = document.querySelector("#letters");
const refreshChat = document.querySelector("#refreshChat");
const reportedChat = document.querySelector("#reportedChat");
const allChat = document.querySelector("#allChat");
const chatStatus = document.querySelector("#chatStatus");
const chatModeration = document.querySelector("#chatModeration");
let allLetters = [];
let chatFilter = "";

async function loadLetters() {
  const params = new URLSearchParams({ limit: "500" });
  statusLabel.textContent = "Yükleniyor...";

  try {
    const response = await fetch(`/api/admin/letters?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    allLetters = data.letters || [];
    renderLetters();
    statusLabel.textContent = "Güncel";
  } catch (error) {
    console.error(error);
    statusLabel.textContent = "Yüklenemedi";
  }
}

function renderLetters() {
  const letters = recipient.value ? allLetters.filter((letter) => letter.recipient === recipient.value) : allLetters;
  const sedoCount = allLetters.filter((letter) => letter.recipient === "SEDO").length;
  const iroCount = allLetters.filter((letter) => letter.recipient === "IRO").length;

  countLabel.textContent = String(allLetters.length);
  sedoCountLabel.textContent = String(sedoCount);
  iroCountLabel.textContent = String(iroCount);

  if (!letters.length) {
    lettersRoot.innerHTML = '<div class="empty">Kayıt Bulunamadı.</div>';
    return;
  }

  const ipCounts = allLetters.reduce((counts, letter) => {
    if (letter.ipAddress) counts.set(letter.ipAddress, (counts.get(letter.ipAddress) || 0) + 1);
    return counts;
  }, new Map());

  lettersRoot.innerHTML = "";
  letters.forEach((letter) => lettersRoot.append(createLetterElement(letter, ipCounts.get(letter.ipAddress) || 0)));
}

function createLetterElement(letter, ipCount) {
  const article = document.createElement("article");
  const meta = document.createElement("div");
  const body = document.createElement("p");
  const actions = document.createElement("div");
  const editForm = document.createElement("form");
  const editRow = document.createElement("div");
  const authorInput = document.createElement("input");
  const recipientSelect = document.createElement("select");
  const bodyInput = document.createElement("textarea");
  const saveButton = document.createElement("button");
  const cancelButton = document.createElement("button");
  const editButton = document.createElement("button");
  const deleteButton = document.createElement("button");
  const deleteIpButton = document.createElement("button");
  const blockIpButton = document.createElement("button");

  article.dataset.id = letter.id;
  meta.className = "meta";
  body.className = "body";
  actions.className = "letter-actions";
  editForm.className = "edit-form";
  editRow.className = "edit-row";

  meta.append(
    makeMeta(`Kime: ${letter.recipient}`, "recipient"),
    makeMeta(`Kimden: ${letter.author || "-"}`),
    makeMeta(`IP: ${letter.ipAddress || "eski kayıt"}`),
    ...(letter.ipAddress ? [makeMeta(`Bu IP: ${ipCount} mektup`)] : []),
    makeMeta(formatDate(letter.createdAt)),
  );

  body.textContent = letter.body;

  editButton.type = "button";
  editButton.className = "ghost-button";
  editButton.textContent = "Düzenle";
  editButton.addEventListener("click", () => article.classList.add("is-editing"));

  deleteButton.type = "button";
  deleteButton.className = "danger-button";
  deleteButton.textContent = "Sil";
  deleteButton.addEventListener("click", () => deleteLetter(letter));

  actions.append(editButton, deleteButton);

  if (letter.ipHash) {
    deleteIpButton.type = "button";
    deleteIpButton.className = "danger-button";
    deleteIpButton.textContent = "Bu IP'yi Temizle";
    deleteIpButton.addEventListener("click", () => deleteLettersByIp(letter));

    blockIpButton.type = "button";
    blockIpButton.className = "danger-button";
    blockIpButton.textContent = "Bu IP'yi Engelle";
    blockIpButton.addEventListener("click", () => blockIp(letter));

    actions.append(deleteIpButton, blockIpButton);
  }

  authorInput.name = "author";
  authorInput.value = letter.author || "";
  authorInput.placeholder = "Gönderen";
  authorInput.maxLength = 48;

  recipientSelect.name = "recipient";
  recipientSelect.innerHTML = `
    <option value="SEDO">SEDO</option>
    <option value="IRO">IRO</option>
  `;
  recipientSelect.value = letter.recipient;

  bodyInput.name = "body";
  bodyInput.value = letter.body || "";
  bodyInput.required = true;
  bodyInput.maxLength = 5000;

  saveButton.type = "submit";
  saveButton.textContent = "Kaydet";

  cancelButton.type = "button";
  cancelButton.className = "ghost-button";
  cancelButton.textContent = "Vazgeç";
  cancelButton.addEventListener("click", () => article.classList.remove("is-editing"));

  editRow.append(authorInput, recipientSelect);
  editForm.append(editRow, bodyInput, saveButton, cancelButton);
  editForm.addEventListener("submit", (event) => {
    event.preventDefault();
    updateLetter(letter.id, {
      author: authorInput.value,
      recipient: recipientSelect.value,
      body: bodyInput.value,
    });
  });

  article.append(meta, body, actions, editForm);
  return article;
}

async function updateLetter(id, payload) {
  statusLabel.textContent = "Kaydediliyor...";

  try {
    const response = await fetch(`/api/admin/letters/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const updated = await response.json();
    allLetters = allLetters.map((letter) => (letter.id === id ? updated : letter));
    renderLetters();
    statusLabel.textContent = "Kaydedildi";
  } catch (error) {
    console.error(error);
    statusLabel.textContent = "Kaydedilemedi";
  }
}

async function deleteLetter(letter) {
  const label = letter.author ? `${letter.author} adlı kişinin mektubu` : "Bu mektup";

  if (!window.confirm(`${label} silinsin mi?`)) {
    return;
  }

  statusLabel.textContent = "Siliniyor...";

  try {
    const response = await fetch(`/api/admin/letters/${letter.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    allLetters = allLetters.filter((item) => item.id !== letter.id);
    renderLetters();
    statusLabel.textContent = "Silindi";
  } catch (error) {
    console.error(error);
    statusLabel.textContent = "Silinemedi";
  }
}

async function deleteLettersByIp(letter) {
  const count = allLetters.filter((item) => item.ipHash === letter.ipHash).length;

  if (!window.confirm(`${letter.ipAddress || "Bu IP"} adresinden gelen ${count} mektup silinsin mi?`)) {
    return;
  }

  statusLabel.textContent = "Siliniyor...";

  try {
    const response = await fetch(`/api/admin/letters/by-ip/${encodeURIComponent(letter.ipHash)}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    allLetters = allLetters.filter((item) => item.ipHash !== letter.ipHash);
    renderLetters();
    statusLabel.textContent = "IP mektupları silindi";
  } catch (error) {
    console.error(error);
    statusLabel.textContent = "IP mektupları silinemedi";
  }
}

async function blockIp(letter) {
  if (!window.confirm(`${letter.ipAddress || "Bu IP"} bundan sonra mektup gönderemesin mi?`)) {
    return;
  }

  statusLabel.textContent = "Engelleniyor...";

  try {
    const response = await fetch(`/api/admin/blocked-ips/${encodeURIComponent(letter.ipHash)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ipAddress: letter.ipAddress || "",
        reason: "admin panel",
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    statusLabel.textContent = "IP engellendi";
  } catch (error) {
    console.error(error);
    statusLabel.textContent = "IP engellenemedi";
  }
}

async function loadChatModeration() {
  if (!chatModeration) return;
  chatStatus.textContent = "Yükleniyor...";

  try {
    const params = new URLSearchParams();
    if (chatFilter) params.set("filter", chatFilter);
    const response = await fetch(`/api/admin/chat/messages?${params.toString()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    renderChatModeration(data.messages || []);
    chatStatus.textContent = "Güncel";
  } catch (error) {
    console.error(error);
    chatStatus.textContent = "Sohbet yüklenemedi";
  }
}

function renderChatModeration(messages) {
  chatModeration.innerHTML = "";
  if (!messages.length) {
    chatModeration.innerHTML = '<div class="empty">Sohbet kaydı bulunamadı.</div>';
    return;
  }

  messages.forEach((message) => {
    const article = document.createElement("article");
    const meta = document.createElement("div");
    const body = document.createElement("p");
    const actions = document.createElement("div");
    const hideButton = document.createElement("button");
    const approveButton = document.createElement("button");
    const deleteButton = document.createElement("button");
    const banButton = document.createElement("button");
    const clearSpamButton = document.createElement("button");

    meta.className = "meta";
    body.className = "body";
    actions.className = "letter-actions";
    meta.append(
      makeMeta(`${message.nickname || "YUVA"}${message.isAdmin ? " (admin)" : ""}`),
      makeMeta(formatDate(message.createdAt)),
      makeMeta(`reported: ${message.reportCount || 0}`),
      makeMeta(`session: ${message.userSessionId || "-"}`),
      makeMeta(message.hidden ? "gizli" : "görünür"),
    );
    body.textContent = message.text || "";

    hideButton.type = "button";
    hideButton.className = "ghost-button";
    hideButton.textContent = message.hidden ? "Göster" : "Gizle";
    hideButton.addEventListener("click", () => updateChatMessage(message.id, { hidden: !message.hidden }));

    approveButton.type = "button";
    approveButton.className = "ghost-button";
    approveButton.textContent = message.approved ? "Onayı Kaldır" : "Onayla";
    approveButton.addEventListener("click", () => updateChatMessage(message.id, { approved: !message.approved }));

    deleteButton.type = "button";
    deleteButton.className = "danger-button";
    deleteButton.textContent = "Sil";
    deleteButton.addEventListener("click", () => deleteChatMessage(message.id));

    actions.append(hideButton, approveButton, deleteButton);

    if (message.userSessionId) {
      clearSpamButton.type = "button";
      clearSpamButton.className = "danger-button";
      clearSpamButton.textContent = "Spamı Temizle";
      clearSpamButton.addEventListener("click", () => clearChatSpam(message));

      banButton.type = "button";
      banButton.className = "danger-button";
      banButton.textContent = "Session Ban";
      banButton.addEventListener("click", () => banChatUser(message));
      actions.append(clearSpamButton, banButton);
    }

    article.append(meta, body, actions);
    chatModeration.append(article);
  });
}

async function updateChatMessage(id, payload) {
  chatStatus.textContent = "Kaydediliyor...";
  try {
    const response = await fetch(`/api/admin/chat/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await loadChatModeration();
  } catch (error) {
    console.error(error);
    chatStatus.textContent = "Kaydedilemedi";
  }
}

async function deleteChatMessage(id) {
  if (!window.confirm("Bu sohbet mesajı silinsin mi?")) return;
  chatStatus.textContent = "Siliniyor...";
  try {
    const response = await fetch(`/api/admin/chat/messages/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await loadChatModeration();
  } catch (error) {
    console.error(error);
    chatStatus.textContent = "Silinemedi";
  }
}

async function banChatUser(message) {
  if (!window.confirm(`${message.nickname || "Bu kullanıcı"} sohbetten engellensin mi?`)) return;
  chatStatus.textContent = "Engelleniyor...";
  try {
    const response = await fetch("/api/admin/chat/bans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userSessionId: message.userSessionId,
        nickname: message.nickname,
        reason: "admin panel",
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    chatStatus.textContent = "Engellendi";
  } catch (error) {
    console.error(error);
    chatStatus.textContent = "Engellenemedi";
  }
}

async function clearChatSpam(message) {
  if (!window.confirm(`${message.nickname || "Bu session"} için tüm sohbet mesajları gizlensin mi?`)) return;
  chatStatus.textContent = "Spam temizleniyor...";
  try {
    const response = await fetch(`/api/admin/chat/messages/by-session/${encodeURIComponent(message.userSessionId)}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await loadChatModeration();
  } catch (error) {
    console.error(error);
    chatStatus.textContent = "Spam temizlenemedi";
  }
}

function makeMeta(text, className = "") {
  const span = document.createElement("span");
  span.textContent = text;
  if (className) span.className = className;
  return span;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

recipient.addEventListener("change", renderLetters);
refresh.addEventListener("click", loadLetters);
refreshChat?.addEventListener("click", loadChatModeration);
reportedChat?.addEventListener("click", () => {
  chatFilter = "reported";
  loadChatModeration();
});
allChat?.addEventListener("click", () => {
  chatFilter = "";
  loadChatModeration();
});

loadLetters();
loadChatModeration();
