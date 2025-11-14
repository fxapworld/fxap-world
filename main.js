// ===== CONFIGURATION =====
// IMPORTANT: Replace 'YOUR_STORE_NAME' with your actual Sell.app store name
// Example: If your store is https://sell.app/@fxapworld, use 'fxapworld'
const STORE_NAME = 'YOUR_STORE_NAME';
const API_BASE = `https://sell.app/api/v1/shops/${STORE_NAME}`;

// ===== STATE MANAGEMENT =====
let allProducts = [];
let currentCategory = 'all';
let currentSearchTerm = '';

// ===== DOM ELEMENTS =====
const productGrid = document.getElementById('product-grid');
const loading = document.getElementById('loading');
const emptyState = document.getElementById('empty-state');
const categoryFilter = document.getElementById('category-filter');
const searchInput = document.getElementById('fx-search');
const searchBtn = document.getElementById('search-btn');

// ===== INITIALIZE APP =====
document.addEventListener('DOMContentLoaded', () => {
  fetchProducts();
  setupEventListeners();
});

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // Search button click
  searchBtn.addEventListener('click', handleSearch);
  
  // Search on Enter key
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  });
  
  // Clear search when input is cleared
  searchInput.addEventListener('input', (e) => {
    if (e.target.value === '') {
      currentSearchTerm = '';
      filterAndRenderProducts();
    }
  });
}

// ===== FETCH PRODUCTS FROM SELL.APP API =====
async function fetchProducts() {
  try {
    showLoading();
    
    const response = await fetch(`${API_BASE}/products`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    allProducts = data.products || [];
    
    if (allProducts.length === 0) {
      showEmptyState('No products available at the moment.');
      return;
    }
    
    // Extract and render unique categories
    const categories = extractCategories(allProducts);
    renderCategories(categories);
    
    // Render all products initially
    renderProducts(allProducts);
    
    hideLoading();
    
  } catch (error) {
    console.error('Error fetching products:', error);
    showEmptyState(
      'Error loading products. Please check your store name in script.js and try again.'
    );
  }
}

// ===== EXTRACT UNIQUE CATEGORIES =====
function extractCategories(products) {
  const categories = [...new Set(
    products
      .map(p => p.category)
      .filter(Boolean)
  )];
  return categories;
}

// ===== RENDER CATEGORY BUTTONS =====
function renderCategories(categories) {
  // Clear existing categories (except "All Products")
  categoryFilter.innerHTML = '<button class="cat-btn active" data-category="all">All Products</button>';
  
  // Add category buttons
  categories.forEach(category => {
    const btn = document.createElement('button');
    btn.classList.add('cat-btn');
    btn.textContent = category;
    btn.dataset.category = category;
    btn.addEventListener('click', () => filterByCategory(category));
    categoryFilter.appendChild(btn);
  });
}

// ===== FILTER BY CATEGORY =====
function filterByCategory(category) {
  currentCategory = category;
  
  // Update active button
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.category === category) {
      btn.classList.add('active');
    }
  });
  
  // Filter and render
  filterAndRenderProducts();
}

// ===== HANDLE SEARCH =====
function handleSearch() {
  currentSearchTerm = searchInput.value.trim().toLowerCase();
  filterAndRenderProducts();
}

// ===== FILTER AND RENDER PRODUCTS =====
function filterAndRenderProducts() {
  let filtered = allProducts;
  
  // Filter by category
  if (currentCategory !== 'all') {
    filtered = filtered.filter(p => p.category === currentCategory);
  }
  
  // Filter by search term
  if (currentSearchTerm) {
    filtered = filtered.filter(p => 
      p.title.toLowerCase().includes(currentSearchTerm) ||
      (p.description && p.description.toLowerCase().includes(currentSearchTerm)) ||
      (p.category && p.category.toLowerCase().includes(currentSearchTerm))
    );
  }
  
  renderProducts(filtered);
}

// ===== RENDER PRODUCTS =====
function renderProducts(products) {
  productGrid.innerHTML = '';
  
  if (products.length === 0) {
    showEmptyState('No products found. Try a different search or category.');
    return;
  }
  
  productGrid.style.display = 'grid';
  emptyState.style.display = 'none';
  
  products.forEach(product => {
    const card = createProductCard(product);
    productGrid.appendChild(card);
  });
}

// ===== CREATE PRODUCT CARD =====
function createProductCard(product) {
  const card = document.createElement('div');
  card.classList.add('card');
  
  // Get product image
  const imageUrl = product.image_url || 
                   product.thumbnail || 
                   product.image || 
                   'https://via.placeholder.com/300x200/121212/ff1a1a?text=No+Image';
  
  // Format price
  const price = formatPrice(product.price);
  
  // Truncate description
  const description = product.description 
    ? truncateText(product.description, 80)
    : '';
  
  // Build card HTML
  card.innerHTML = `
    <div class="thumb" style="background-image: url('${imageUrl}');"></div>
    <div class="meta">
      <h3 class="title">${escapeHtml(product.title)}</h3>
      ${product.category ? `<span class="cat-tag">${escapeHtml(product.category)}</span>` : ''}
      ${description ? `<p class="desc">${escapeHtml(description)}</p>` : ''}
    </div>
    <div class="price-row">
      <span class="price">${price}</span>
      <button class="buy-btn" data-product-id="${product.id}">Buy Now</button>
    </div>
  `;
  
  // Add buy button event listener
  const buyBtn = card.querySelector('.buy-btn');
  buyBtn.addEventListener('click', () => buyProduct(product.id));
  
  return card;
}

// ===== BUY PRODUCT =====
function buyProduct(productId) {
  // Redirect to Sell.app product page
  window.location.href = `https://sell.app/@${STORE_NAME}/product/${productId}`;
}

// ===== UTILITY FUNCTIONS =====

function formatPrice(price) {
  if (!price || price === 0) return 'Free';
  // Sell.app prices are in cents
  return `$${(price / 100).toFixed(2)}`;
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showLoading() {
  loading.style.display = 'block';
  productGrid.style.display = 'none';
  emptyState.style.display = 'none';
}

function hideLoading() {
  loading.style.display = 'none';
}

function showEmptyState(message) {
  loading.style.display = 'none';
  productGrid.style.display = 'none';
  emptyState.style.display = 'block';
  emptyState.querySelector('p').textContent = message;
}

// ===== PERFORMANCE OPTIMIZATION =====
// Debounce function for search input (optional enhancement)
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Optional: Add debounced search on input
// searchInput.addEventListener('input', debounce(handleSearch, 300));
