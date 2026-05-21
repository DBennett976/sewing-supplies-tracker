const storageKey = "sewingSupplyTrackerData";

let appData = loadData();

const form = document.getElementById("supplyForm");
const inventoryList = document.getElementById("inventoryList");
const shoppingList = document.getElementById("shoppingList");

const collectionSelect = document.getElementById("collectionSelect");
const addCollectionBtn = document.getElementById("addCollectionBtn");
const deleteCollectionBtn = document.getElementById("deleteCollectionBtn");

const searchInput = document.getElementById("search");
const categoryFilter = document.getElementById("categoryFilter");
const stockFilter = document.getElementById("stockFilter");
const sortBy = document.getElementById("sortBy");

const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const darkModeBtn = document.getElementById("darkModeBtn");
const scrollToFormBtn = document.getElementById("scrollToFormBtn");

function loadData() {
  const oldSupplies = JSON.parse(localStorage.getItem("sewingSupplies") || "null");
  const saved = JSON.parse(localStorage.getItem(storageKey) || "null");

  if (saved) return saved;

  return {
    currentCollection: "Main Supplies",
    darkMode: false,
    collections: {
      "Main Supplies": oldSupplies || []
    },
    shoppingList: []
  };
}

function saveData() {
  localStorage.setItem(storageKey, JSON.stringify(appData));
}

function currentSupplies() {
  return appData.collections[appData.currentCollection] || [];
}

function setCurrentSupplies(items) {
  appData.collections[appData.currentCollection] = items;
  saveData();
}

function escapeHTML(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getCategoryIcon(category) {
  return {
    Thread: "🧵",
    Needles: "🪡",
    Fabric: "🧶",
    Bobbins: "⭕",
    "Presser Feet": "🦶",
    Tools: "✂️",
    Parts: "⚙️",
    "Oil / Maintenance": "🛢️",
    Other: "📦"
  }[category] || "📦";
}

function isLowStock(item) {
  return item.lowStock !== "" && Number(item.quantity) <= Number(item.lowStock);
}

function readPhotoFile(file) {
  return new Promise((resolve) => {
    if (!file) return resolve("");

    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 800;

        let width = img.width;
        let height = img.height;

        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressedPhoto = canvas.toDataURL("image/jpeg", 0.65);
        resolve(compressedPhoto);
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
}

function renderCollections() {
  collectionSelect.innerHTML = "";

  Object.keys(appData.collections).forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    if (name === appData.currentCollection) option.selected = true;
    collectionSelect.appendChild(option);
  });
}

function getFilteredSupplies() {
  const searchTerm = searchInput.value.toLowerCase();

  let filtered = currentSupplies().filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm) ||
      item.category.toLowerCase().includes(searchTerm) ||
      item.details.toLowerCase().includes(searchTerm) ||
      item.location.toLowerCase().includes(searchTerm) ||
      item.notes.toLowerCase().includes(searchTerm);

    const matchesCategory =
      categoryFilter.value === "All" || item.category === categoryFilter.value;

    const matchesStock =
      stockFilter.value === "All" || isLowStock(item);

    return matchesSearch && matchesCategory && matchesStock;
  });

  filtered.sort((a, b) => {
    if (sortBy.value === "name") return a.name.localeCompare(b.name);
    if (sortBy.value === "category") return a.category.localeCompare(b.category);
    if (sortBy.value === "quantityLow") return Number(a.quantity) - Number(b.quantity);
    if (sortBy.value === "quantityHigh") return Number(b.quantity) - Number(a.quantity);
    return Number(b.id) - Number(a.id);
  });

  return filtered;
}

function renderDashboard() {
  const supplies = currentSupplies();
  const categories = new Set(supplies.map((item) => item.category));

  document.getElementById("totalItems").textContent = supplies.length;
  document.getElementById("lowStockCount").textContent = supplies.filter(isLowStock).length;
  document.getElementById("categoryCount").textContent = categories.size;
  document.getElementById("shoppingCount").textContent = appData.shoppingList.length;
}

function renderSupplies() {
  const supplies = getFilteredSupplies();
  inventoryList.innerHTML = "";

  document.getElementById("itemCount").textContent =
    `${supplies.length} item${supplies.length === 1 ? "" : "s"}`;

  if (supplies.length === 0) {
    inventoryList.innerHTML = `<p class="empty">No supplies found.</p>`;
    renderDashboard();
    return;
  }

  supplies.forEach((item) => {
    const card = document.createElement("article");
    card.className = "supplyCard";

    card.innerHTML = `
      ${item.photo ? `<img src="${item.photo}" class="supplyPhoto" alt="${escapeHTML(item.name)}">` : ""}

      <div class="supplyBody">
        <div class="supplyTop">
          <div>
            <h3>${getCategoryIcon(item.category)} ${escapeHTML(item.name)}</h3>
            <div class="badges">
              <span class="badge">${escapeHTML(item.category)}</span>
              ${isLowStock(item) ? `<span class="badge low">Low Stock</span>` : ""}
            </div>
          </div>
          <div class="qty">Qty: ${escapeHTML(item.quantity)}</div>
        </div>

        <div class="details">
          <p><strong>Details:</strong> ${escapeHTML(item.details) || "—"}</p>
          <p><strong>Location:</strong> ${escapeHTML(item.location) || "—"}</p>
          <p><strong>Low warning:</strong> ${escapeHTML(item.lowStock) || "—"}</p>
          <p><strong>Notes:</strong> ${escapeHTML(item.notes) || "—"}</p>
        </div>

        <div class="actions">
          <button onclick="changeQuantity(${item.id}, -1)">-1</button>
          <button onclick="changeQuantity(${item.id}, 1)">+1</button>
          <button onclick="editSupply(${item.id})">Edit</button>
          <button onclick="addItemToShopping('${escapeHTML(item.name)}')">Buy</button>
          <button class="deleteBtn" onclick="deleteSupply(${item.id})">Delete</button>
        </div>
      </div>
    `;

    inventoryList.appendChild(card);
  });

  renderDashboard();
}

function renderShoppingList() {
  shoppingList.innerHTML = "";

  if (appData.shoppingList.length === 0) {
    shoppingList.innerHTML = `<p class="empty">Shopping list is empty.</p>`;
    renderDashboard();
    return;
  }

  appData.shoppingList.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "shoppingItem";
    row.innerHTML = `
      <span>${escapeHTML(item)}</span>
      <button onclick="removeShoppingItem(${index})">Remove</button>
    `;
    shoppingList.appendChild(row);
  });

  renderDashboard();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const editId = document.getElementById("editId").value;
  const photoFile = document.getElementById("photo").files[0];
  const newPhoto = await readPhotoFile(photoFile);

  const supplyData = {
    name: document.getElementById("name").value.trim(),
    category: document.getElementById("category").value,
    details: document.getElementById("details").value.trim(),
    quantity: document.getElementById("quantity").value,
    lowStock: document.getElementById("lowStock").value,
    location: document.getElementById("location").value.trim(),
    notes: document.getElementById("notes").value.trim()
  };

  let supplies = currentSupplies();

  if (editId) {
    supplies = supplies.map((item) =>
      String(item.id) === editId
        ? { ...item, ...supplyData, photo: newPhoto || item.photo || "" }
        : item
    );
  } else {
    supplies.push({
      id: Date.now(),
      ...supplyData,
      photo: newPhoto
    });
  }

  setCurrentSupplies(supplies);
  resetForm();
  renderAll();
});

function changeQuantity(id, amount) {
  const supplies = currentSupplies().map((item) =>
    item.id === id
      ? { ...item, quantity: Math.max(0, Number(item.quantity) + amount) }
      : item
  );

  setCurrentSupplies(supplies);
  renderAll();
}

function editSupply(id) {
  const item = currentSupplies().find((supply) => supply.id === id);
  if (!item) return;

  document.getElementById("editId").value = item.id;
  document.getElementById("name").value = item.name;
  document.getElementById("category").value = item.category;
  document.getElementById("details").value = item.details;
  document.getElementById("quantity").value = item.quantity;
  document.getElementById("lowStock").value = item.lowStock;
  document.getElementById("location").value = item.location;
  document.getElementById("notes").value = item.notes;

  formTitle.textContent = "Edit Supply";
  submitBtn.textContent = "Save Changes";
  cancelEditBtn.classList.remove("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteSupply(id) {
  const item = currentSupplies().find((supply) => supply.id === id);
  if (!item) return;

  if (!confirm(`Delete "${item.name}"?`)) return;

  setCurrentSupplies(currentSupplies().filter((item) => item.id !== id));
  renderAll();
}

function resetForm() {
  form.reset();
  document.getElementById("editId").value = "";
  formTitle.textContent = "Add Supply";
  submitBtn.textContent = "Add Supply";
  cancelEditBtn.classList.add("hidden");
}

function addItemToShopping(name) {
  if (!appData.shoppingList.includes(name)) {
    appData.shoppingList.push(name);
    saveData();
    renderShoppingList();
  }
}

function removeShoppingItem(index) {
  appData.shoppingList.splice(index, 1);
  saveData();
  renderShoppingList();
}

function addLowStockItems() {
  currentSupplies()
    .filter(isLowStock)
    .forEach((item) => addItemToShopping(item.name));
}

function exportCSV() {
  const supplies = currentSupplies();

  if (supplies.length === 0) return alert("No supplies to export.");

  const headers = ["Name", "Category", "Details", "Quantity", "Low Stock", "Location", "Notes"];

  const rows = supplies.map((item) => [
    item.name,
    item.category,
    item.details,
    item.quantity,
    item.lowStock,
    item.location,
    item.notes
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  downloadFile(csv, `${appData.currentCollection}-supplies.csv`, "text/csv");
}

function exportJSON() {
  downloadFile(
    JSON.stringify(appData, null, 2),
    "sewing-supply-tracker-backup.json",
    "application/json"
  );
}

function restoreJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const restored = JSON.parse(reader.result);

      if (!restored.collections) {
        alert("That backup file does not look right.");
        return;
      }

      appData = restored;
      saveData();
      applyDarkMode();
      renderAll();
      alert("Backup restored.");
    } catch {
      alert("Could not restore that file.");
    }
  };

  reader.readAsText(file);
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function printLabels() {
  const supplies = currentSupplies();

  if (supplies.length === 0) return alert("No labels to print.");

  const labelWindow = window.open("", "_blank");

  const labels = supplies.map((item) => {
    const data = encodeURIComponent(
      `${item.name} | ${item.category} | Qty: ${item.quantity} | Location: ${item.location}`
    );

    return `
      <div class="label">
        <h3>${escapeHTML(item.name)}</h3>
        <p>${escapeHTML(item.category)}</p>
        <p>Qty: ${escapeHTML(item.quantity)}</p>
        <p>${escapeHTML(item.location || "")}</p>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${data}">
      </div>
    `;
  }).join("");

  labelWindow.document.write(`
    <html>
      <head>
        <title>Supply Labels</title>
        <style>
          body { font-family: Arial, sans-serif; }
          .sheet {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            padding: 12px;
          }
          .label {
            border: 1px solid #222;
            border-radius: 10px;
            padding: 10px;
            text-align: center;
            page-break-inside: avoid;
          }
          .label h3 { margin: 0 0 6px; }
          .label p { margin: 3px 0; }
          img { margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="sheet">${labels}</div>
        <script>window.print();<\/script>
      </body>
    </html>
  `);

  labelWindow.document.close();
}

function addCollection() {
  const name = prompt("Collection name? Example: Fabric Stash, Machine Parts, Thread");
  if (!name) return;

  if (appData.collections[name]) {
    alert("That collection already exists.");
    return;
  }

  appData.collections[name] = [];
  appData.currentCollection = name;
  saveData();
  renderAll();
}

function deleteCollection() {
  const names = Object.keys(appData.collections);

  if (names.length === 1) {
    alert("You need at least one collection.");
    return;
  }

  if (!confirm(`Delete collection "${appData.currentCollection}"?`)) return;

  delete appData.collections[appData.currentCollection];
  appData.currentCollection = Object.keys(appData.collections)[0];

  saveData();
  renderAll();
}

function toggleDarkMode() {
  appData.darkMode = !appData.darkMode;
  saveData();
  applyDarkMode();
}

function applyDarkMode() {
  document.body.classList.toggle("dark", appData.darkMode);
  darkModeBtn.textContent = appData.darkMode ? "☀️ Light Mode" : "🌙 Dark Mode";
}

function renderAll() {
  renderCollections();
  renderSupplies();
  renderShoppingList();
  renderDashboard();
}

collectionSelect.addEventListener("change", () => {
  appData.currentCollection = collectionSelect.value;
  saveData();
  renderAll();
});

addCollectionBtn.addEventListener("click", addCollection);
deleteCollectionBtn.addEventListener("click", deleteCollection);

searchInput.addEventListener("input", renderSupplies);
categoryFilter.addEventListener("change", renderSupplies);
stockFilter.addEventListener("change", renderSupplies);
sortBy.addEventListener("change", renderSupplies);

document.getElementById("exportCsvBtn").addEventListener("click", exportCSV);
document.getElementById("exportJsonBtn").addEventListener("click", exportJSON);
document.getElementById("restoreJsonInput").addEventListener("change", restoreJSON);
document.getElementById("printLabelsBtn").addEventListener("click", printLabels);

document.getElementById("addShoppingBtn").addEventListener("click", () => {
  const input = document.getElementById("manualShoppingItem");
  const value = input.value.trim();

  if (value) {
    addItemToShopping(value);
    input.value = "";
  }
});

document.getElementById("addLowStockBtn").addEventListener("click", addLowStockItems);

cancelEditBtn.addEventListener("click", resetForm);
darkModeBtn.addEventListener("click", toggleDarkMode);

scrollToFormBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

applyDarkMode();
renderAll();