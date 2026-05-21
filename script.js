const form = document.getElementById("supplyForm");
const inventoryList = document.getElementById("inventoryList");
const searchInput = document.getElementById("search");

let supplies = JSON.parse(localStorage.getItem("sewingSupplies")) || [];

function saveSupplies() {
  localStorage.setItem("sewingSupplies", JSON.stringify(supplies));
}

function renderSupplies() {
  const searchTerm = searchInput.value.toLowerCase();

  const filteredSupplies = supplies.filter((item) => {
    return (
      item.name.toLowerCase().includes(searchTerm) ||
      item.category.toLowerCase().includes(searchTerm) ||
      item.details.toLowerCase().includes(searchTerm) ||
      item.location.toLowerCase().includes(searchTerm)
    );
  });

  inventoryList.innerHTML = "";

  if (filteredSupplies.length === 0) {
    inventoryList.innerHTML = `<p class="empty">No supplies found.</p>`;
    return;
  }

  filteredSupplies.forEach((item) => {
    const isLow =
      item.lowStock !== "" &&
      Number(item.quantity) <= Number(item.lowStock);

    const supplyElement = document.createElement("div");
    supplyElement.className = "supplyItem";

    supplyElement.innerHTML = `
      <div class="supplyTop">
        <div>
          <h3>${item.name}</h3>
          <span class="badge">${item.category}</span>
          ${isLow ? `<span class="badge low">Low Stock</span>` : ""}
        </div>
        <strong>Qty: ${item.quantity}</strong>
      </div>

      <p><strong>Details:</strong> ${item.details || "—"}</p>
      <p><strong>Location:</strong> ${item.location || "—"}</p>
      <p><strong>Notes:</strong> ${item.notes || "—"}</p>

      <div class="actions">
        <button onclick="changeQuantity(${item.id}, -1)">-1</button>
        <button onclick="changeQuantity(${item.id}, 1)">+1</button>
        <button onclick="deleteSupply(${item.id})">Delete</button>
      </div>
    `;

    inventoryList.appendChild(supplyElement);
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const newSupply = {
    id: Date.now(),
    name: document.getElementById("name").value.trim(),
    category: document.getElementById("category").value,
    details: document.getElementById("details").value.trim(),
    quantity: document.getElementById("quantity").value,
    lowStock: document.getElementById("lowStock").value,
    location: document.getElementById("location").value.trim(),
    notes: document.getElementById("notes").value.trim(),
  };

  supplies.push(newSupply);
  saveSupplies();
  renderSupplies();
  form.reset();
});

function changeQuantity(id, amount) {
  supplies = supplies.map((item) => {
    if (item.id === id) {
      const newQuantity = Math.max(0, Number(item.quantity) + amount);
      return { ...item, quantity: newQuantity };
    }

    return item;
  });

  saveSupplies();
  renderSupplies();
}

function deleteSupply(id) {
  supplies = supplies.filter((item) => item.id !== id);
  saveSupplies();
  renderSupplies();
}

searchInput.addEventListener("input", renderSupplies);

renderSupplies();