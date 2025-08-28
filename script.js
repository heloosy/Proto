// Simple in-memory storage (replace with real database in production)
const users = JSON.parse(localStorage.getItem("users") || "[]");
const complaints = JSON.parse(localStorage.getItem("complaints") || "[]");
let currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
  setupEventListeners();
});

function initializeApp() {
  if (currentUser) {
    showDashboard();
    updateNavigation();
    loadUserComplaints();
  } else {
    showLanding();
  }
}

function setupEventListeners() {
  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  document.getElementById("registerForm").addEventListener("submit", handleRegister);
  document.getElementById("complaintForm").addEventListener("submit", handleComplaintSubmission);
  document.getElementById("complaintType").addEventListener("input", updateDepartmentPreview);
  document.getElementById("complaintTitle").addEventListener("input", updateDepartmentPreview);
  document.getElementById("complaintDescription").addEventListener("input", updateDepartmentPreview);
}

// SPA Navigation Functions
function showLanding() {
  hideAllSections();
  document.getElementById("landingPage")?.classList.remove("hidden");
}

function showLogin() {
  hideAllSections();
  document.getElementById("loginSection")?.classList.remove("hidden");
}

function showRegister() {
  hideAllSections();
  document.getElementById("registerSection")?.classList.remove("hidden");
}

function showDashboard() {
  hideAllSections();
  document.getElementById("dashboardSection")?.classList.remove("hidden");
  updateDashboardStats();
}

function showComplaintForm() {
  hideAllSections();
  document.getElementById("complaintSection")?.classList.remove("hidden");
}

function hideAllSections() {
  document.querySelectorAll(".section").forEach(section => section.classList.add("hidden"));
}

function updateNavigation() {
  if (currentUser) {
    document.getElementById("navButtons")?.classList.add("hidden");
    document.getElementById("userMenu")?.classList.remove("hidden");
    document.getElementById("userName").textContent = currentUser.name;
  } else {
    document.getElementById("navButtons")?.classList.remove("hidden");
    document.getElementById("userMenu")?.classList.add("hidden");
  }
}

// Authentication
function handleLogin(e) {
  e.preventDefault();
  showLoading();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  setTimeout(() => {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      currentUser = user;
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      updateNavigation();
      showDashboard();
      loadUserComplaints();
      showSuccess("Login successful!");
    } else {
      showError("Invalid email or password");
    }
    hideLoading();
  }, 1000);
}

function handleRegister(e) {
  e.preventDefault();
  showLoading();
  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const phone = document.getElementById("registerPhone").value;
  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    showError("Passwords do not match");
    hideLoading();
    return;
  }

  if (users.find(u => u.email === email)) {
    showError("Email already registered");
    hideLoading();
    return;
  }

  setTimeout(() => {
    const newUser = {
      id: Date.now(),
      name,
      email,
      phone,
      password,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    currentUser = newUser;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    updateNavigation();
    showDashboard();
    showSuccess("Registration successful!");
    hideLoading();
  }, 1000);
}

function logout() {
  currentUser = null;
  localStorage.removeItem("currentUser");
  updateNavigation();
  showLanding();
  showSuccess("Logged out successfully");
}

// Complaint functions
function handleComplaintSubmission(e) {
  e.preventDefault();
  showLoading();

  const type = document.getElementById("complaintType").value;
  const title = document.getElementById("complaintTitle").value;
  const description = document.getElementById("complaintDescription").value;
  const location = document.getElementById("complaintLocation").value;
  const priority = document.getElementById("complaintPriority").value;
  const department = getDepartment(type, description);

  setTimeout(() => {
    const newComplaint = {
      id: Date.now(),
      userId: currentUser.id,
      type,
      title,
      description,
      location,
      priority,
      department,
      status: "pending",
      source: "manual",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    complaints.push(newComplaint);
    localStorage.setItem("complaints", JSON.stringify(complaints));

    document.getElementById("complaintForm").reset();
    document.getElementById("departmentPreview")?.classList.add("hidden");

    showDashboard();
    loadUserComplaints();
    showSuccess(`Complaint submitted successfully! Routed to: ${department}`);
    hideLoading();
  }, 1000);
}

function loadUserComplaints() {
  if (!currentUser) return;
  const userComplaints = complaints.filter(c => c.userId === currentUser.id);
  const container = document.getElementById("complaintsContainer");

  if (userComplaints.length === 0) {
    container.innerHTML = '<p class="no-complaints">No complaints submitted yet.</p>';
    return;
  }

  container.innerHTML = userComplaints.map(c => `
    <div class="complaint-item">
      <div class="complaint-header">
        <div class="complaint-title">${c.title}</div>
        <div class="complaint-status status-${c.status}">${c.status.replace("-", " ")}</div>
      </div>
      <div class="complaint-meta">
        <strong>Type:</strong> ${c.type} | 
        <strong>Priority:</strong> ${c.priority} | 
        <strong>Department:</strong> ${c.department} |
        <strong>Source:</strong> ${c.source} |
        <strong>Location:</strong> ${c.location} | 
        <strong>Date:</strong> ${new Date(c.createdAt).toLocaleDateString()}
      </div>
      <div class="complaint-description">${c.description}</div>
    </div>
  `).join("");
}

function updateDashboardStats() {
  if (!currentUser) return;
  const userComplaints = complaints.filter(c => c.userId === currentUser.id);
  document.getElementById("totalComplaints").textContent = userComplaints.length;
  document.getElementById("pendingComplaints").textContent = userComplaints.filter(c => c.status === "pending").length;
  document.getElementById("resolvedComplaints").textContent = userComplaints.filter(c => c.status === "resolved").length;
}

// Utility
function showLoading() { document.getElementById("loadingOverlay")?.classList.remove("hidden"); }
function hideLoading() { document.getElementById("loadingOverlay")?.classList.add("hidden"); }
function showSuccess(msg) { alert("✅ " + msg); }
function showError(msg) { alert("❌ " + msg); }

// Department logic
function getDepartment(type, description) {
  const text = (type + " " + description).toLowerCase();
  if (text.includes("fire") || text.includes("smoke") || text.includes("burning")) return "Fire Department";
  if (text.includes("accident") || text.includes("crime") || text.includes("theft")) return "Police Department";
  if (text.includes("medical") || text.includes("injury") || text.includes("ambulance")) return "Emergency Medical Services";
  if (text.includes("pothole") || text.includes("road") || text.includes("traffic") || text.includes("water")) return "Public Works Department";
  if (text.includes("garbage") || text.includes("pollution") || text.includes("waste")) return "Environmental Services";
  return "General Services";
}

function updateDepartmentPreview() {
  const type = document.getElementById("complaintType").value;
  const title = document.getElementById("complaintTitle").value;
  const description = document.getElementById("complaintDescription").value;

  if (type || title || description) {
    const department = getDepartment(type, title + " " + description);
    const preview = document.getElementById("departmentPreview");
    const departmentName = document.getElementById("departmentName");
    departmentName.textContent = department;
    preview.classList.remove("hidden");
  } else {
    document.getElementById("departmentPreview")?.classList.add("hidden");
  }
}

// Expose functions for HTML onclick
window.showLogin = showLogin;
window.showRegister = showRegister;
window.showDashboard = showDashboard;
window.showComplaintForm = showComplaintForm;
window.logout = logout;
