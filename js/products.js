const productData = [
  { id: 1, name: "Lumen Linen Shirt", price: 68, size: "M", category: "Apparel", image: "images/LumenLinenShirt.jpg" },
  { id: 2, name: "Aero Knit Sneakers", price: 120, size: "L", category: "Shoes", image: "images/AeroKnitSneakers.jpg" },
  { id: 3, name: "Crisp Cotton Tee", price: 32, size: "S", category: "Apparel", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80" },
  { id: 4, name: "Orbit Smartwatch", price: 210, size: "M", category: "Accessories", image: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=800&q=80" },
  { id: 5, name: "Studio Backpack", price: 95, size: "L", category: "Gear", image: "images/StudioBackpack.jpg" },
  { id: 6, name: "Summit Trail Boots", price: 185, size: "XL", category: "Shoes", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80" },
  { id: 7, name: "Feather Down Jacket", price: 240, size: "M", category: "Apparel", image: "images/FeatherDownJacket.jpg" },
  { id: 8, name: "Everyday Joggers", price: 74, size: "XS", category: "Apparel", image: "images/EverydayJoggers.jpg" },
  { id: 9, name: "Canvas Tote", price: 28, size: "S", category: "Gear", image: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=800&q=80" },
  { id: 10, name: "Daylight Hoodie", price: 88, size: "L", category: "Apparel", image: "images/DaylightHoodie.jpg" }
];

function findProductById(id) {
  return productData.find((item) => item.id === id);
}

function getProducts() {
  return [...productData];
}

function applyFilters(filters) {
  const { price, size } = filters;
  return getProducts().filter((item) => {
    let pricePass = true;
    if (price && price !== "all") {
      if (price === "0-50") pricePass = item.price < 50;
      if (price === "50-100") pricePass = item.price >= 50 && item.price < 100;
      if (price === "100-200") pricePass = item.price >= 100 && item.price < 200;
      if (price === "200+") pricePass = item.price >= 200;
    }

    const sizePass = size === "all" || !size ? true : item.size === size;
    return pricePass && sizePass;
  });
}

function renderProducts(list) {
  const container = document.getElementById("product-list");
  if (!container) return;
  if (!list.length) {
    container.innerHTML = "<p>No products match these filters.</p>";
    return;
  }
  container.innerHTML = list
    .map(
      (item) => `
        <div class="card">
          <img src="${item.image}" alt="${item.name}" />
          <div class="tag">${item.category} · ${item.size}</div>
          <h3>${item.name}</h3>
          <div class="price">$${item.price}</div>
          <div class="card-actions">
            <a class="btn btn-ghost" href="product.html?id=${item.id}">Details</a>
            <div style="display:flex;gap:8px;align-items:center;">
              <button class="btn btn-primary" onclick="addToCart(${item.id})">Add</button>
              <button class="btn" onclick="addToCart(${item.id})">+</button>
            </div>
          </div>
        </div>
      `
    )
    .join("");
}

function initProductsPage() {
  const priceFilter = document.getElementById("price-filter");
  const sizeFilter = document.getElementById("size-filter");
  const productList = document.getElementById("product-list");
  if (!productList) return;

  const handleFilters = () => {
    const products = applyFilters({ price: priceFilter.value, size: sizeFilter.value });
    renderProducts(products);
  };

  priceFilter.addEventListener("change", handleFilters);
  sizeFilter.addEventListener("change", handleFilters);

  renderProducts(getProducts());
}

document.addEventListener("DOMContentLoaded", initProductsPage);
