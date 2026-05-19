const recipient = document.querySelector("#recipient");
const refresh = document.querySelector("#refresh");
const statusLabel = document.querySelector("#status");
const countLabel = document.querySelector("#count");
const sedoCountLabel = document.querySelector("#sedoCount");
const iroCountLabel = document.querySelector("#iroCount");
const lettersRoot = document.querySelector("#letters");
let allLetters = [];

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

loadLetters();
