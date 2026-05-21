const form = document.getElementById("supplyForm");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const inventoryList = document.getElementById("inventoryList");
const itemCount = document.getElementById("itemCount");

const searchInput = document.getElementById("search");
const categoryFilter = document.getElementById("categoryFilter");
const stockFilter = document.getElementById("stockFilter");
const sortBy = document.getElementById("sortBy");

const exportCsvBtn = document.getElementById("exportCsvBtn");
const exportJsonBtn = document.getElementById("exportJsonBtn");
const scrollToFormBtn = document.getElementById("scrollToFormBtn");

let supplies = JSON.parse(localStorage.getItem("sewingSupplies")) || [];

function saveSupplies() {
  localStorage.setItem("sewingSupplies", JSON.stringify(supplies));
}

function getCategoryIcon(category) {
  const icons = {
    Thread: "🧵",
    Needles: "🪡",
    Fabric: "🧶",
    Bobbins: "⭕",
    "Presser Feet": "🦶",
    Tools: "✂️",
    Parts: "⚙️",
    "Oil / Maintenance": "🛢️",
    Other: "📦"
  };

  return icons[category] || "📦";
}

function isLowStock(item) {
  return item.lowStock !== "" && Number(item.quantity) <= Number(item.lowStock);
}

function getFilteredSupplies() {
  const searchTerm = searchInput.value.toLowerCase();

  let filtered = supplies.filter((item) => {
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

function renderSupplies() {
  const filteredSupplies = getFilteredSupplies();

  inventoryList.innerHTML = "";
  itemCount.textContent = `${filteredSupplies.length} item${filteredSupplies.length === 1 ? "" : "s"}`;

  if (filteredSupplies.length === 0) {
    inventoryList.innerHTML = `<p class="empty">No supplies found.</p>`;
    return;
  }

  filteredSupplies.forEach((item) => {
    const card = document.createElement("article");
    card.className = "supplyCard";

    card.innerHTML = `
      ${item.photo ? `<img src="${item.photo}" class="supplyPhoto" alt="${item.name}">` : ""}

      <div class="supplyBody">
        <div class="supplyTop">
          <div>
            <h3>${getCategoryIcon(item.category)} ${item.name}</h3>
            <div class="badges">
              <span class="badge">${item.category}</span>
              ${isLowStock(item) ? `<span class="badge low">Low Stock</span>` : ""}
            </div>
          </div>
          <div class="qty">Qty: ${item.quantity}</div>
        </div>

        <div class="details">
          <p><strong>Details:</strong> ${item.details || "—"}</p>
          <p><strong>Location:</strong> ${item.location || "—"}</p>
          <p><strong>Low warning:</strong> ${item.lowStock || "—"}</p>
          <p><strong>Notes:</strong> ${item.notes || "—"}</p>
        </div>

        <div class="actions">
          <button onclick="changeQuantity(${item.id}, -1)">-1</button>
          <button onclick="changeQuantity(${item.id}, 1)">+1</button>
          <button onclick="editSupply(${item.id})">Edit</button>
          <button class="deleteBtn" onclick="deleteSupply(${item.id})">Delete</button>
        </div>
      </div>
    `;

    inventoryList.appendChild(card);
  });
}

function readPhotoFile(file) {
  return new Promise((resolve) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.readAsDataURL(file);
  });
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

  if (editId) {
    supplies = supplies.map((item) => {
      if (String(item.id) === editId) {
        return {
          ...item,
          ...supplyData,
          photo: newPhoto || item.photo || ""
        };
      }

      return item;
    });
  } else {
    supplies.push({
      id: Date.now(),
      ...supplyData,
      photo: newPhoto
    });
  }

  saveSupplies();
  resetForm();
  renderSupplies();
});

function changeQuantity(id, amount) {
  supplies = supplies.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        quantity: Math.max(0, Number(item.quantity) + amount)
      };
    }

    return item;
  });

  saveSupplies();
  renderSupplies();
}

function editSupply(id) {
  const item = supplies.find((supply) => supply.id === id);
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

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function deleteSupply(id) {
  const item = supplies.find((supply) => supply.id === id);
  if (!item) return;

  const confirmed = confirm(`Delete "${item.name}"?`);

  if (!confirmed) return;

  supplies = supplies.filter((item) => item.id !== id);
  saveSupplies();
  renderSupplies();
}

function resetForm() {
  form.reset();
  document.getElementById("editId").value = "";
  formTitle.textContent = "Add Supply";
  submitBtn.textContent = "Add Supply";
  cancelEditBtn.classList.add("hidden");
}

function exportCSV() {
  if (supplies.length === 0) {
    alert("No supplies to export.");
    return;
  }

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

  const csvContent = [headers, ...rows]
    .map((row) =>
      row
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\n");

  downloadFile(csvContent, "sewing-supplies.csv", "text/csv");
}

function exportJSON() {
  if (supplies.length === 0) {
    alert("No supplies to backup.");
    return;
  }

  const jsonContent = JSON.stringify(supplies, null, 2);
  downloadFile(jsonContent, "sewing-supplies-backup.json", "application/json");
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

searchInput.addEventListener("input", renderSupplies);
categoryFilter.addEventListener("change", renderSupplies);
stockFilter.addEventListener("change", renderSupplies);
sortBy.addEventListener("change", renderSupplies);

exportCsvBtn.addEventListener("click", exportCSV);
exportJsonBtn.addEventListener("click", exportJSON);
cancelEditBtn.addEventListener("click", resetForm);

scrollToFormBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});

renderSupplies();