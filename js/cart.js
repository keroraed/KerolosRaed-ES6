const CART_KEY = "cartItems";

function getCart() {
  const raw = localStorage.getItem(CART_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const pill = document.getElementById("cart-count");
  if (!pill) return;
  const total = getCart().reduce((sum, item) => sum + item.qty, 0);
  pill.textContent = total;
}

function addToCart(productId) {
  const product = findProductById(productId);
  if (!product) return;
  const cart = getCart();
  const existing = cart.find((item) => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: product.id, qty: 1 });
  }
  saveCart(cart);
}

function changeQuantity(productId, delta) {
  const cart = getCart();
  const item = cart.find((row) => row.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    const filtered = cart.filter((row) => row.id !== productId);
    saveCart(filtered);
  } else {
    saveCart(cart);
  }
  renderCart();
}

function renderCart() {
  const list = document.getElementById("cart-list");
  const empty = document.getElementById("empty-message");
  const totalBox = document.getElementById("total-box");
  const totalLabel = document.getElementById("cart-total");
  if (!list) return;

  const cart = getCart();
  if (!cart.length) {
    list.innerHTML = "";
    if (empty) empty.classList.add("show");
    if (totalBox) totalBox.style.display = "none";
    return;
  }

  if (empty) empty.classList.remove("show");
  list.innerHTML = cart
    .map((item) => {
      const product = findProductById(item.id);
      if (!product) return "";
      const lineTotal = (product.price * item.qty).toFixed(2);
      return `
        <div class="cart-row">
          <div>
            <div class="tag">${product.category} · ${product.size}</div>
            <strong>${product.name}</strong>
          </div>
          <span>$${product.price}</span>
          <div class="qty-controls">
            <button aria-label="decrease" onclick="changeQuantity(${product.id}, -1)">-</button>
            <span>${item.qty}</span>
            <button aria-label="increase" onclick="changeQuantity(${product.id}, 1)">+</button>
          </div>
          <strong>$${lineTotal}</strong>
        </div>
      `;
    })
    .join("");

  const total = cart.reduce((sum, item) => {
    const product = findProductById(item.id);
    return product ? sum + product.price * item.qty : sum;
  }, 0);

  if (totalLabel) totalLabel.textContent = `$${total.toFixed(2)}`;
  if (totalBox) totalBox.style.display = "flex";
}

document.addEventListener("DOMContentLoaded", updateCartCount);
