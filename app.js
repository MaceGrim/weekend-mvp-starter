"use strict";

const STORAGE_KEY = "weekend-mvp-starter-v1";
const allowedCategories = ["Inquiry", "Quote", "Follow-up", "Task"];
const allowedStatuses = ["New", "In progress", "Done"];

const samples = [
  {
    id: "sample-1",
    title: "Fictional patio estimate",
    description: "Jordan would like a sample estimate for a small patio cleanup next Tuesday.",
    category: "Quote",
    status: "New"
  },
  {
    id: "sample-2",
    title: "Sample workshop follow-up",
    description: "Send the fictional resource list after the community workshop.",
    category: "Follow-up",
    status: "In progress"
  },
  {
    id: "sample-3",
    title: "Demo directory correction",
    description: "Update the fictional bakery listing with its weekend hours.",
    category: "Task",
    status: "Done"
  }
];

const elements = {
  form: document.querySelector("#item-form"),
  id: document.querySelector("#item-id"),
  title: document.querySelector("#title"),
  description: document.querySelector("#description"),
  category: document.querySelector("#category"),
  status: document.querySelector("#status"),
  save: document.querySelector("#save-button"),
  cancel: document.querySelector("#cancel-button"),
  formMessage: document.querySelector("#form-message"),
  dataMessage: document.querySelector("#data-message"),
  list: document.querySelector("#item-list"),
  empty: document.querySelector("#empty-state"),
  summary: document.querySelector("#summary"),
  search: document.querySelector("#search"),
  filterStatus: document.querySelector("#filter-status"),
  exportButton: document.querySelector("#export-button"),
  importButton: document.querySelector("#import-button"),
  importFile: document.querySelector("#import-file"),
  resetButton: document.querySelector("#reset-button")
};

let items = loadItems();

function makeId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isValidItem(item) {
  return item && typeof item.id === "string" && typeof item.title === "string" &&
    item.title.trim().length > 0 && item.title.length <= 80 &&
    typeof item.description === "string" && item.description.trim().length > 0 &&
    item.description.length <= 500 && allowedCategories.includes(item.category) &&
    allowedStatuses.includes(item.status);
}

function loadItems() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) && saved.every(isValidItem) ? saved : structuredSamples();
  } catch {
    return structuredSamples();
  }
}

function structuredSamples() {
  return samples.map((item) => ({ ...item }));
}

function saveItems() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch {
    setMessage(elements.dataMessage, "This browser could not save the records. Export a copy before closing.", true);
    return false;
  }
}

function setMessage(target, text, isError = false) {
  target.textContent = text;
  target.classList.toggle("error", isError);
}

function render() {
  const query = elements.search.value.trim().toLowerCase();
  const status = elements.filterStatus.value;
  const visible = items.filter((item) => {
    const matchesText = `${item.title} ${item.description}`.toLowerCase().includes(query);
    return matchesText && (status === "all" || item.status === status);
  });

  elements.list.replaceChildren(...visible.map(createItemCard));
  elements.empty.hidden = visible.length !== 0;

  const done = items.filter((item) => item.status === "Done").length;
  elements.summary.textContent = `${items.length} total · ${done} done · ${visible.length} shown`;
}

function createItemCard(item) {
  const article = document.createElement("article");
  article.className = "item";
  article.dataset.id = item.id;

  const top = document.createElement("div");
  top.className = "item-top";
  const content = document.createElement("div");
  const heading = document.createElement("h3");
  heading.textContent = item.title;
  const description = document.createElement("p");
  description.textContent = item.description;
  const badges = document.createElement("div");
  badges.className = "badges";
  [item.category, item.status].forEach((value) => {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = value;
    badges.append(badge);
  });
  content.append(heading, description, badges);

  const actions = document.createElement("div");
  actions.className = "item-actions";
  const edit = document.createElement("button");
  edit.type = "button";
  edit.className = "secondary";
  edit.textContent = "Edit";
  edit.setAttribute("aria-label", `Edit ${item.title}`);
  edit.addEventListener("click", () => startEdit(item.id));
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "delete";
  remove.textContent = "Delete";
  remove.setAttribute("aria-label", `Delete ${item.title}`);
  remove.addEventListener("click", () => deleteItem(item.id));
  actions.append(edit, remove);
  top.append(content, actions);
  article.append(top);
  return article;
}

function resetForm() {
  elements.form.reset();
  elements.id.value = "";
  elements.save.textContent = "Add request";
  elements.cancel.hidden = true;
  document.querySelector("#form-heading").textContent = "Add a request";
}

function startEdit(id) {
  const item = items.find((entry) => entry.id === id);
  if (!item) return;
  elements.id.value = item.id;
  elements.title.value = item.title;
  elements.description.value = item.description;
  elements.category.value = item.category;
  elements.status.value = item.status;
  elements.save.textContent = "Save changes";
  elements.cancel.hidden = false;
  document.querySelector("#form-heading").textContent = "Edit request";
  elements.title.focus();
  setMessage(elements.formMessage, `Editing “${item.title}”.`);
}

function deleteItem(id) {
  const item = items.find((entry) => entry.id === id);
  if (!item || !confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
  items = items.filter((entry) => entry.id !== id);
  saveItems();
  if (elements.id.value === id) resetForm();
  setMessage(elements.dataMessage, "Request deleted.");
  render();
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const next = {
    id: elements.id.value || makeId(),
    title: elements.title.value.trim(),
    description: elements.description.value.trim(),
    category: elements.category.value,
    status: elements.status.value
  };
  if (!isValidItem(next)) {
    setMessage(elements.formMessage, "Please provide a title and description using the available choices.", true);
    return;
  }
  const existingIndex = items.findIndex((item) => item.id === next.id);
  if (existingIndex >= 0) {
    items[existingIndex] = next;
    setMessage(elements.formMessage, "Changes saved.");
  } else {
    items.unshift(next);
    setMessage(elements.formMessage, "Request added.");
  }
  saveItems();
  resetForm();
  render();
});

elements.cancel.addEventListener("click", () => {
  resetForm();
  setMessage(elements.formMessage, "Edit canceled.");
});
elements.search.addEventListener("input", render);
elements.filterStatus.addEventListener("change", render);

elements.exportButton.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "weekend-mvp-data.json";
  link.click();
  URL.revokeObjectURL(link.href);
  setMessage(elements.dataMessage, "JSON export created.");
});

elements.importButton.addEventListener("click", () => elements.importFile.click());
elements.importFile.addEventListener("change", async () => {
  const [file] = elements.importFile.files;
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported) || !imported.every(isValidItem)) {
      throw new Error("invalid shape");
    }
    items = imported.map((item) => ({ ...item }));
    saveItems();
    render();
    setMessage(elements.dataMessage, `${items.length} record(s) imported.`);
  } catch {
    setMessage(elements.dataMessage, "That file is not a valid Weekend MVP JSON export. No records were changed.", true);
  } finally {
    elements.importFile.value = "";
  }
});

elements.resetButton.addEventListener("click", () => {
  if (!confirm("Replace all current records with the fictional samples?")) return;
  items = structuredSamples();
  saveItems();
  resetForm();
  elements.search.value = "";
  elements.filterStatus.value = "all";
  setMessage(elements.dataMessage, "Fictional sample records restored.");
  render();
});

render();

