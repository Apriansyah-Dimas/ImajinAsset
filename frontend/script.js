// Global variables
let currentSection = "dashboard";
let currentPage = 1;
let itemsPerPage = 10;
let assets = [];
let categories = [];
let locations = [];
let currentUser = null;

// Apps Script URL - Replace with your deployed Apps Script URL
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbx3YzcWoO6kQjYlFiCeOzLDTOPz331qGjLKtGp5FJVjyanSTaoRvLYi15Vj-CKJf5yfyQ/exec";

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

function initializeApp() {
  setupEventListeners();
  checkAuthentication();
  loadInitialData();
}

function setupEventListeners() {
  // Navigation
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const section = this.getAttribute("data-section");
      showSection(section);
    });
  });

  // Asset Management
  document
    .getElementById("addAssetBtn")
    .addEventListener("click", showAddAssetModal);
  document
    .getElementById("assetForm")
    .addEventListener("submit", handleAssetSubmit);

  // Modal close buttons
  document.querySelectorAll(".close, .cancel-btn").forEach((btn) => {
    btn.addEventListener("click", closeModal);
  });

  // Search and filters
  document
    .getElementById("searchAsset")
    .addEventListener("input", filterAssets);
  document
    .getElementById("categoryFilter")
    .addEventListener("change", filterAssets);
  document
    .getElementById("locationFilter")
    .addEventListener("change", filterAssets);
  document
    .getElementById("statusFilter")
    .addEventListener("change", filterAssets);

  // Pagination
  document
    .getElementById("prevPage")
    .addEventListener("click", () => changePage(-1));
  document
    .getElementById("nextPage")
    .addEventListener("click", () => changePage(1));

  // Categories and Locations
  document
    .getElementById("addCategoryBtn")
    .addEventListener("click", showAddCategoryModal);
  document
    .getElementById("addLocationBtn")
    .addEventListener("click", showAddLocationModal);

  // Reports
  document
    .getElementById("generateReportBtn")
    .addEventListener("click", generateReport);

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", logout);

  // Window click for modal close
  window.addEventListener("click", function (e) {
    if (e.target.classList.contains("modal")) {
      closeModal();
    }
  });
}

function showSection(sectionName) {
  // Hide all sections
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.remove("active");
  });

  // Show selected section
  document.getElementById(sectionName).classList.add("active");

  // Update navigation
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active");
  });
  document
    .querySelector(`[data-section="${sectionName}"]`)
    .classList.add("active");

  currentSection = sectionName;

  // Load section-specific data
  switch (sectionName) {
    case "dashboard":
      loadDashboardData();
      break;
    case "assets":
      loadAssets();
      break;
    case "categories":
      loadCategories();
      break;
    case "locations":
      loadLocations();
      break;
    case "reports":
      loadReportsData();
      break;
  }
}

// Authentication functions
function checkAuthentication() {
  // In a real implementation, this would check with Google Apps Script
  // For demo purposes, we'll simulate authentication
  const user = localStorage.getItem("currentUser");
  if (user) {
    currentUser = JSON.parse(user);
    updateUserInfo();
  } else {
    // Show login modal or redirect to login page
    showLoginModal();
  }
}

function updateUserInfo() {
  if (currentUser) {
    document.getElementById("userName").textContent =
      currentUser.name || currentUser.email;
    document.getElementById("logoutBtn").style.display = "block";
  }
}

function logout() {
  localStorage.removeItem("currentUser");
  currentUser = null;
  document.getElementById("userName").textContent = "Loading...";
  document.getElementById("logoutBtn").style.display = "none";
  showLoginModal();
}

function showLoginModal() {
  // In a real implementation, this would show a login modal
  // For demo purposes, we'll simulate login
  currentUser = {
    email: "demo@example.com",
    name: "Demo User",
  };
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  updateUserInfo();
}

// API functions
async function callAppsScript(functionName, params = {}) {
  showLoading();
  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        function: functionName,
        parameters: params,
      }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error calling Apps Script:", error);
    showToast("Error: " + error.message, "error");
    return null;
  } finally {
    hideLoading();
  }
}

// Data loading functions
async function loadInitialData() {
  await Promise.all([loadCategories(), loadLocations()]);
  loadDashboardData();
}

async function loadDashboardData() {
  try {
    const data = await callAppsScript("getDashboardData");
    if (data) {
      updateDashboardStats(data.stats);
      updateDashboardCharts(data.charts);
      updateRecentActivities(data.activities);
    }
  } catch (error) {
    console.error("Error loading dashboard data:", error);
  }
}

function updateDashboardStats(stats) {
  document.getElementById("totalAssets").textContent = stats.totalAssets || 0;
  document.getElementById("totalCategories").textContent =
    stats.totalCategories || 0;
  document.getElementById("totalLocations").textContent =
    stats.totalLocations || 0;
  document.getElementById("maintenanceNeeded").textContent =
    stats.maintenanceNeeded || 0;
}

function updateDashboardCharts(charts) {
  // Category Chart
  const categoryCtx = document.getElementById("categoryChart").getContext("2d");
  new Chart(categoryCtx, {
    type: "doughnut",
    data: {
      labels: charts.categories.labels,
      datasets: [
        {
          data: charts.categories.data,
          backgroundColor: [
            "#667eea",
            "#764ba2",
            "#f093fb",
            "#f5576c",
            "#4facfe",
            "#00f2fe",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });

  // Location Chart
  const locationCtx = document.getElementById("locationChart").getContext("2d");
  new Chart(locationCtx, {
    type: "bar",
    data: {
      labels: charts.locations.labels,
      datasets: [
        {
          label: "Assets by Location",
          data: charts.locations.data,
          backgroundColor: "#667eea",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

function updateRecentActivities(activities) {
  const activitiesList = document.getElementById("recentActivitiesList");
  activitiesList.innerHTML = "";

  activities.forEach((activity) => {
    const activityItem = document.createElement("div");
    activityItem.className = "activity-item";
    activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="fas ${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-content">
                <p>${activity.description}</p>
                <small>${formatDate(activity.timestamp)}</small>
            </div>
        `;
    activitiesList.appendChild(activityItem);
  });
}

function getActivityIcon(type) {
  const icons = {
    create: "fa-plus",
    update: "fa-edit",
    delete: "fa-trash",
    maintenance: "fa-wrench",
    location: "fa-map-marker-alt",
  };
  return icons[type] || "fa-circle";
}

async function loadAssets() {
  try {
    const data = await callAppsScript("getAssets");
    if (data) {
      assets = data;
      renderAssetsTable();
      updateAssetFilters();
    }
  } catch (error) {
    console.error("Error loading assets:", error);
  }
}

function renderAssetsTable() {
  const tbody = document.getElementById("assetsTableBody");
  tbody.innerHTML = "";

  const filteredAssets = getFilteredAssets();
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageAssets = filteredAssets.slice(startIndex, endIndex);

  pageAssets.forEach((asset) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${asset.id}</td>
            <td>${asset.name}</td>
            <td>${asset.category}</td>
            <td>${asset.location}</td>
            <td><span class="status-badge status-${asset.status.toLowerCase()}">${
      asset.status
    }</span></td>
            <td>${formatDate(asset.purchaseDate)}</td>
            <td>$${asset.value ? asset.value.toFixed(2) : "0.00"}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" onclick="editAsset('${asset.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteAsset('${
                      asset.id
                    }')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
    tbody.appendChild(row);
  });

  updatePagination(filteredAssets.length);
}

function getFilteredAssets() {
  const searchTerm = document.getElementById("searchAsset").value.toLowerCase();
  const categoryFilter = document.getElementById("categoryFilter").value;
  const locationFilter = document.getElementById("locationFilter").value;
  const statusFilter = document.getElementById("statusFilter").value;

  return assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm) ||
      asset.id.toLowerCase().includes(searchTerm);
    const matchesCategory =
      !categoryFilter || asset.category === categoryFilter;
    const matchesLocation =
      !locationFilter || asset.location === locationFilter;
    const matchesStatus = !statusFilter || asset.status === statusFilter;

    return matchesSearch && matchesCategory && matchesLocation && matchesStatus;
  });
}

function updateAssetFilters() {
  const categoryFilter = document.getElementById("categoryFilter");
  const locationFilter = document.getElementById("locationFilter");

  // Update category filter
  const currentCategory = categoryFilter.value;
  categoryFilter.innerHTML = '<option value="">All Categories</option>';
  categories.forEach((category) => {
    categoryFilter.innerHTML += `<option value="${category.name}">${category.name}</option>`;
  });
  categoryFilter.value = currentCategory;

  // Update location filter
  const currentLocation = locationFilter.value;
  locationFilter.innerHTML = '<option value="">All Locations</option>';
  locations.forEach((location) => {
    locationFilter.innerHTML += `<option value="${location.name}">${location.name}</option>`;
  });
  locationFilter.value = currentLocation;
}

function filterAssets() {
  currentPage = 1;
  renderAssetsTable();
}

function updatePagination(totalItems) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  document.getElementById(
    "pageInfo"
  ).textContent = `Page ${currentPage} of ${totalPages}`;

  document.getElementById("prevPage").disabled = currentPage === 1;
  document.getElementById("nextPage").disabled = currentPage === totalPages;
}

function changePage(direction) {
  const filteredAssets = getFilteredAssets();
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);

  currentPage += direction;
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  renderAssetsTable();
}

async function loadCategories() {
  try {
    const data = await callAppsScript("getCategories");
    if (data) {
      categories = data;
      renderCategoriesTable();
    }
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}

function renderCategoriesTable() {
  const tbody = document.getElementById("categoriesTableBody");
  tbody.innerHTML = "";

  categories.forEach((category) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${category.id}</td>
            <td>${category.name}</td>
            <td>${category.description || "-"}</td>
            <td>${category.assetCount || 0}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" onclick="editCategory('${
                      category.id
                    }')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteCategory('${
                      category.id
                    }')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
    tbody.appendChild(row);
  });
}

async function loadLocations() {
  try {
    const data = await callAppsScript("getLocations");
    if (data) {
      locations = data;
      renderLocationsTable();
    }
  } catch (error) {
    console.error("Error loading locations:", error);
  }
}

function renderLocationsTable() {
  const tbody = document.getElementById("locationsTableBody");
  tbody.innerHTML = "";

  locations.forEach((location) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${location.id}</td>
            <td>${location.name}</td>
            <td>${location.address || "-"}</td>
            <td>${location.assetCount || 0}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" onclick="editLocation('${
                      location.id
                    }')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteLocation('${
                      location.id
                    }')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
    tbody.appendChild(row);
  });
}

// Modal functions
function showAddAssetModal() {
  document.getElementById("assetModalTitle").textContent = "Add New Asset";
  document.getElementById("assetForm").reset();

  // Populate category and location dropdowns
  const categorySelect = document.getElementById("assetCategory");
  categorySelect.innerHTML = '<option value="">Select Category</option>';
  categories.forEach((category) => {
    categorySelect.innerHTML += `<option value="${category.name}">${category.name}</option>`;
  });

  const locationSelect = document.getElementById("assetLocation");
  locationSelect.innerHTML = '<option value="">Select Location</option>';
  locations.forEach((location) => {
    locationSelect.innerHTML += `<option value="${location.name}">${location.name}</option>`;
  });

  document.getElementById("assetModal").style.display = "block";
}

function showAddCategoryModal() {
  // Implementation for category modal
  showToast("Category modal not implemented yet", "warning");
}

function showAddLocationModal() {
  // Implementation for location modal
  showToast("Location modal not implemented yet", "warning");
}

function closeModal() {
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.style.display = "none";
  });
}

// Form handling
async function handleAssetSubmit(e) {
  e.preventDefault();

  const formData = {
    name: document.getElementById("assetName").value,
    category: document.getElementById("assetCategory").value,
    location: document.getElementById("assetLocation").value,
    status: document.getElementById("assetStatus").value,
    purchaseDate: document.getElementById("assetPurchaseDate").value,
    value: parseFloat(document.getElementById("assetValue").value) || 0,
    description: document.getElementById("assetDescription").value,
  };

  try {
    const result = await callAppsScript("createAsset", formData);
    if (result && result.success) {
      showToast("Asset created successfully!", "success");
      closeModal();
      loadAssets();
      loadDashboardData();
    } else {
      showToast("Error creating asset", "error");
    }
  } catch (error) {
    console.error("Error creating asset:", error);
    showToast("Error creating asset", "error");
  }
}

// CRUD operations
async function editAsset(assetId) {
  showToast("Edit functionality not implemented yet", "warning");
}

async function deleteAsset(assetId) {
  if (confirm("Are you sure you want to delete this asset?")) {
    try {
      const result = await callAppsScript("deleteAsset", { id: assetId });
      if (result && result.success) {
        showToast("Asset deleted successfully!", "success");
        loadAssets();
        loadDashboardData();
      } else {
        showToast("Error deleting asset", "error");
      }
    } catch (error) {
      console.error("Error deleting asset:", error);
      showToast("Error deleting asset", "error");
    }
  }
}

async function editCategory(categoryId) {
  showToast("Edit category functionality not implemented yet", "warning");
}

async function deleteCategory(categoryId) {
  if (confirm("Are you sure you want to delete this category?")) {
    showToast("Delete category functionality not implemented yet", "warning");
  }
}

async function editLocation(locationId) {
  showToast("Edit location functionality not implemented yet", "warning");
}

async function deleteLocation(locationId) {
  if (confirm("Are you sure you want to delete this location?")) {
    showToast("Delete location functionality not implemented yet", "warning");
  }
}

// Reports
async function loadReportsData() {
  // Load initial reports data
  document.getElementById("reportContent").innerHTML =
    "<p>Select report type and generate report to view results.</p>";
}

async function generateReport() {
  const reportType = document.getElementById("reportType").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  try {
    const result = await callAppsScript("generateReport", {
      type: reportType,
      startDate: startDate,
      endDate: endDate,
    });

    if (result) {
      displayReport(result);
    } else {
      showToast("Error generating report", "error");
    }
  } catch (error) {
    console.error("Error generating report:", error);
    showToast("Error generating report", "error");
  }
}

function displayReport(reportData) {
  const reportContent = document.getElementById("reportContent");

  // Basic report display - can be enhanced based on report type
  let html = `
        <h3>Report Generated</h3>
        <p>Generated on: ${formatDate(new Date())}</p>
        <div class="report-data">
            <pre>${JSON.stringify(reportData, null, 2)}</pre>
        </div>
    `;

  reportContent.innerHTML = html;
}

// Utility functions
function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");

  toast.className = "toast show " + type;
  toastMessage.textContent = message;

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function showLoading() {
  document.getElementById("loadingSpinner").style.display = "flex";
}

function hideLoading() {
  document.getElementById("loadingSpinner").style.display = "none";
}
