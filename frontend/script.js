/**
 * CampusCare – Student Complaint & Request Management System
 * Frontend Controller & API Integration Script
 * 
 * Features:
 * - Dynamic API Base URL detection (works both when served from Node.js and via Live Server)
 * - REST API CRUD operations (GET, POST, PUT, PATCH, DELETE)
 * - Student Complaint Submission with validation
 * - Dynamic Dashboard metrics and status calculations
 * - Real-time client-side and server-side filtering
 * - Native accessible Modal Dialogs (<dialog>)
 * - Non-blocking Toast notification system
 */

// =========================================================================
// CONFIGURATION & API BASE URL
// =========================================================================

// Determine API URL:
// If running from Node server (port 5000), use relative path '/api'.
// If running from VS Code Live Server (port 5500) or file://, use 'http://localhost:5000/api'.
const API_BASE_URL =
  window.location.origin.includes(':5000')
    ? '/api'
    : 'http://localhost:5000/api';

console.log('CampusCare Initialized. API Base URL:', API_BASE_URL);
// ADMIN AUTHENTICATION HELPER

function getAdminToken() {
  return sessionStorage.getItem('campuscare_admin_token');
}

async function adminFetch(url, options = {}) {
  const token = getAdminToken();

  if (!token) {
    window.location.href = '/login.html';
    throw new Error('Admin login required');
  }

  const headers = Object.assign(
    {},
    options.headers || {},
    { Authorization: `Bearer ${token}` }
  );

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401 || response.status === 403) {
    sessionStorage.removeItem('campuscare_admin_token');
    window.location.href = '/login.html';
    throw new Error('Session expired. Please login again.');
  }

  return response;
}

// =========================================================================
// STUDENT AUTHENTICATION HELPERS
// =========================================================================

function getStudentToken() {
  return (
    localStorage.getItem('campuscare_student_token') ||
    sessionStorage.getItem('campuscare_student_token')
  );
}

function getStudentUser() {
  const userStr =
    localStorage.getItem('campuscare_student_user') ||
    sessionStorage.getItem('campuscare_student_user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
}

function clearStudentSession() {
  localStorage.removeItem('campuscare_student_token');
  sessionStorage.removeItem('campuscare_student_token');
  localStorage.removeItem('campuscare_student_user');
  sessionStorage.removeItem('campuscare_student_user');
  localStorage.removeItem('campuscare_student');
}

async function studentFetch(url, options = {}) {
  const token = getStudentToken();

  if (!token) {
    clearStudentSession();
    window.location.replace('student-login.html');
    throw new Error('Student login required');
  }

  const headers = Object.assign(
    {},
    options.headers || {},
    { Authorization: `Bearer ${token}` }
  );

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401 || response.status === 403) {
    clearStudentSession();
    window.location.replace('student-login.html');
    throw new Error('Student session expired. Please login again.');
  }

  return response;
}

// =========================================================================
// TOAST NOTIFICATION UTILITY
// =========================================================================

function showToast(message, type = 'info', title = '') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconSvg = {
    success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
    info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
  }[type] || '';

  const defaultTitle = {
    success: 'Success',
    error: 'Error',
    info: 'Notice'
  }[type];

  toast.innerHTML = `
    <div class="toast-icon">${iconSvg}</div>
    <div class="toast-content">
      <div class="toast-title">${title || defaultTitle}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" aria-label="Close Notification">&times;</button>
  `;

  // Dismiss on close button
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.remove();
  });

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 250);
  }, 4000);

  container.appendChild(toast);
}

// =========================================================================
// HELPER FUNCTIONS & FORMATTERS
// =========================================================================

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getStatusBadgeHtml(status) {
  const normalized = (status || 'Pending').toLowerCase().replace(/\s+/g, '-');
  return `<span class="badge-status ${normalized}">${status}</span>`;
}

// Toggle mobile sidebar
function setupSidebarToggle() {
  const toggleBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar');
  const closeBtn = document.getElementById('sidebar-close-btn');

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  if (closeBtn && sidebar) {
    closeBtn.addEventListener('click', () => {
      sidebar.classList.remove('open');
    });
  }
}

// Setup Tab Navigation
function setupTabs() {
  const navLinks = document.querySelectorAll('.nav-link[data-tab]');
  const tabContents = document.querySelectorAll('.tab-content');

  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = link.getAttribute('data-tab');

      navLinks.forEach((l) => l.classList.remove('active'));
      link.classList.add('active');

      tabContents.forEach((content) => {
        if (content.id === `tab-${targetTab}`) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });

      // Update page title in header
      const pageTitle = document.getElementById('header-page-title');
      if (pageTitle) {
        pageTitle.textContent = link.getAttribute('data-title') || 'Dashboard';
      }

      // Close mobile sidebar if open
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.remove('open');
    });
  });
}

// =========================================================================
// STUDENT MODULE
// =========================================================================

const StudentApp = {
  complaints: [],
  currentStudent: {
    id: '',
    name: '',
    email: '',
    regNo: '',
    dept: 'Computer Science and Engineering'
  },

  init() {
    // Authenticated access verification
    const token = getStudentToken();
    if (!token) {
      clearStudentSession();
      window.location.replace('student-login.html');
      return;
    }

    this.loadSavedStudentSession();
    this.bindEvents();
    this.loadDashboardStats();
    this.loadComplaints();
    this.initDefaultDate();
  },

  initDefaultDate() {
    const dateInput = document.getElementById('complaint-date');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.value = today;
    }
  },

  loadSavedStudentSession() {
    const studentUser = getStudentUser();
    if (studentUser) {
      this.currentStudent = {
        id: studentUser.id || '',
        name: studentUser.name || 'Student',
        email: studentUser.email || '',
        regNo: studentUser.registerNumber || studentUser.regNo || '',
        dept: studentUser.department || 'Computer Science and Engineering'
      };
    } else {
      const saved = localStorage.getItem('campuscare_student');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.currentStudent = {
            id: '',
            name: parsed.name || 'Student',
            email: parsed.email || '',
            regNo: parsed.regNo || '',
            dept: parsed.dept || 'Computer Science and Engineering'
          };
        } catch (e) {}
      }
    }

    // Populate top dashboard welcome card
    const welcomeGreeting = document.getElementById('welcome-student-greeting');
    const welcomeEmail = document.getElementById('welcome-student-email');
    const welcomeReg = document.getElementById('welcome-student-reg');

    if (welcomeGreeting) welcomeGreeting.textContent = `Welcome, ${this.currentStudent.name || 'Student'} 👋`;
    if (welcomeEmail) welcomeEmail.textContent = this.currentStudent.email || '';
    if (welcomeReg) welcomeReg.textContent = `Register Number: ${this.currentStudent.regNo || '--------'}`;

    // Populate bottom-left UI with authenticated student's details
    const studentNameDisplay = document.getElementById('student-name-display');
    const studentEmailDisplay = document.getElementById('student-email-display');
    const studentRegDisplay = document.getElementById('student-reg-display');
    const studentAvatar = document.getElementById('student-avatar');

    if (studentNameDisplay) studentNameDisplay.textContent = this.currentStudent.name || 'Student';
    if (studentEmailDisplay) studentEmailDisplay.textContent = this.currentStudent.email || '';
    if (studentRegDisplay) studentRegDisplay.textContent = this.currentStudent.regNo || '';
    if (studentAvatar && this.currentStudent.name) {
      studentAvatar.textContent = this.currentStudent.name.trim().charAt(0).toUpperCase();
    }

    // Auto-fill complaint form inputs with authenticated student details
    const inputName = document.getElementById('student-name');
    const inputReg = document.getElementById('student-reg');
    const selectDept = document.getElementById('student-dept');

    if (inputName) inputName.value = this.currentStudent.name;
    if (inputReg) inputReg.value = this.currentStudent.regNo;
    if (selectDept && this.currentStudent.dept) selectDept.value = this.currentStudent.dept;
  },

  saveStudentSession(name, regNo, dept) {
    this.currentStudent.name = name;
    this.currentStudent.regNo = regNo;
    this.currentStudent.dept = dept;

    const existingUser = getStudentUser() || {};
    existingUser.name = name;
    existingUser.registerNumber = regNo;
    existingUser.department = dept;

    localStorage.setItem('campuscare_student_user', JSON.stringify(existingUser));
    sessionStorage.setItem('campuscare_student_user', JSON.stringify(existingUser));
    this.loadSavedStudentSession();
  },

  bindEvents() {
    // Submit complaint form
    const form = document.getElementById('submit-complaint-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmitComplaint(e));
    }

    // Filter controls in Student My Complaints
    const statusFilter = document.getElementById('student-filter-status');
    const categoryFilter = document.getElementById('student-filter-category');
    const searchInput = document.getElementById('student-search-input');

    if (statusFilter) statusFilter.addEventListener('change', () => this.applyFilters());
    if (categoryFilter) categoryFilter.addEventListener('change', () => this.applyFilters());
    if (searchInput) {
      searchInput.addEventListener('input', () => this.applyFilters());
    }

    // Student Logout Handlers
    const logoutHandler = (e) => {
      e.preventDefault();
      clearStudentSession();
      showToast('Logged out successfully', 'info');
      setTimeout(() => {
        window.location.replace('student-login.html');
      }, 300);
    };

    const sidebarLogoutBtn = document.getElementById('student-logout-btn');
    const topLogoutBtn = document.getElementById('top-logout-btn');

    if (sidebarLogoutBtn) sidebarLogoutBtn.addEventListener('click', logoutHandler);
    if (topLogoutBtn) topLogoutBtn.addEventListener('click', logoutHandler);
  },

  async loadDashboardStats() {
    try {
      const res = await studentFetch(`${API_BASE_URL}/complaints/stats`);
      const result = await res.json();

      if (result.success) {
        document.getElementById('stat-student-total').textContent = result.data.total;
        document.getElementById('stat-student-pending').textContent = result.data.pending;
        document.getElementById('stat-student-progress').textContent = result.data.inProgress;
        document.getElementById('stat-student-resolved').textContent = result.data.resolved;
      }
    } catch (err) {
      console.error('Failed to load student statistics:', err);
    }
  },

  async loadComplaints() {
    const tableBody = document.getElementById('student-complaints-tbody');
    const emptyState = document.getElementById('student-empty-state');
    const loadingState = document.getElementById('student-loading-state');

    if (loadingState) loadingState.style.display = 'flex';
    if (tableBody) tableBody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'none';

    try {
      const res = await studentFetch(`${API_BASE_URL}/complaints`);
      const result = await res.json();

      if (loadingState) loadingState.style.display = 'none';

      if (result.success) {
        this.complaints = result.data;
        this.renderTable(this.complaints);
      } else {
        showToast(result.message || 'Error loading complaints', 'error');
      }
    } catch (err) {
      if (loadingState) loadingState.style.display = 'none';
      console.error('Error fetching complaints:', err);
    }
  },

  applyFilters() {
    const statusVal = document.getElementById('student-filter-status')?.value || 'All';
    const categoryVal = document.getElementById('student-filter-category')?.value || 'All';
    const searchVal = document.getElementById('student-search-input')?.value.toLowerCase().trim() || '';

    const filtered = this.complaints.filter((item) => {
      const matchesStatus = statusVal === 'All' || item.status === statusVal;
      const matchesCategory = categoryVal === 'All' || item.category === categoryVal;
      const matchesSearch =
        searchVal === '' ||
        (item.title && item.title.toLowerCase().includes(searchVal)) ||
        (item.ticketId && item.ticketId.toLowerCase().includes(searchVal)) ||
        (item.description && item.description.toLowerCase().includes(searchVal));

      return matchesStatus && matchesCategory && matchesSearch;
    });

    this.renderTable(filtered);
  },

  renderTable(list) {
    const tableBody = document.getElementById('student-complaints-tbody');
    const emptyState = document.getElementById('student-empty-state');
    const tableContainer = document.getElementById('student-table-container');

    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (!list || list.length === 0) {
      if (tableContainer) tableContainer.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (tableContainer) tableContainer.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';

    list.forEach((item) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="ticket-pill">${item.ticketId || 'CC-ID'}</span></td>
        <td class="table-title-cell" title="${item.title}">${item.title}</td>
        <td><span class="category-tag">${item.category}</span></td>
        <td>${formatDate(item.date || item.createdAt)}</td>
        <td>${getStatusBadgeHtml(item.status)}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon view" title="View Details" onclick="StudentApp.openDetailsModal('${item._id}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  },

  async handleSubmitComplaint(e) {
    e.preventDefault();

    const studentName = document.getElementById('student-name').value.trim();
    const registerNumber = document.getElementById('student-reg').value.trim();
    const department = document.getElementById('student-dept').value;
    const category = document.getElementById('complaint-category').value;
    const title = document.getElementById('complaint-title').value.trim();
    const description = document.getElementById('complaint-desc').value.trim();
    const date = document.getElementById('complaint-date').value;
    const priority = document.getElementById('complaint-priority')?.value || 'Medium';

    // Basic Validation
    if (!studentName || !registerNumber || !department || !category || !title || !description) {
      showToast('Please fill in all mandatory fields.', 'error');
      return;
    }

    const payload = {
      studentName,
      registerNumber,
      department,
      category,
      title,
      description,
      date,
      priority
    };

    const submitBtn = document.getElementById('btn-submit-complaint');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `Submitting...`;

    try {
      const res = await studentFetch(`${API_BASE_URL}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;

      if (result.success) {
        showToast('Complaint submitted successfully! Ticket ID: ' + (result.data.ticketId || ''), 'success');

        // Reset title & description
        document.getElementById('complaint-title').value = '';
        document.getElementById('complaint-desc').value = '';

        // Refresh statistics and complaints list
        this.loadDashboardStats();
        this.loadComplaints();

        // Switch to "My Complaints" tab
        const myComplaintsLink = document.querySelector('.nav-link[data-tab="my-complaints"]');
        if (myComplaintsLink) myComplaintsLink.click();
      } else {
        showToast(result.message || 'Submission failed.', 'error');
      }
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      console.error('Error submitting complaint:', err);
      showToast('Server connection failed. Ensure backend server is running.', 'error');
    }
  },

  async openDetailsModal(id) {
    const dialog = document.getElementById('complaint-details-dialog');
    if (!dialog) return;

    try {
      const res = await studentFetch(`${API_BASE_URL}/complaints/${id}`);
      const result = await res.json();

      if (result.success) {
        const item = result.data;
        document.getElementById('modal-ticket-id').textContent = item.ticketId || 'N/A';
        document.getElementById('modal-detail-title').textContent = item.title;
        document.getElementById('modal-detail-status').innerHTML = getStatusBadgeHtml(item.status);
        document.getElementById('modal-detail-category').textContent = item.category;
        document.getElementById('modal-detail-priority').textContent = item.priority || 'Medium';
        document.getElementById('modal-detail-date').textContent = formatDate(item.date || item.createdAt);
        document.getElementById('modal-detail-department').textContent = item.department;
        document.getElementById('modal-detail-student').textContent = `${item.studentName} (${item.registerNumber})`;
        document.getElementById('modal-detail-desc').textContent = item.description;

        const remarksContainer = document.getElementById('modal-remarks-container');
        const remarksText = document.getElementById('modal-detail-remarks');
        if (remarksContainer && remarksText) {
          if (item.adminRemarks) {
            remarksContainer.style.display = 'block';
            remarksText.textContent = item.adminRemarks;
          } else {
            remarksContainer.style.display = 'none';
          }
        }

        dialog.showModal();
      }
    } catch (err) {
      showToast('Could not load complaint details', 'error');
    }
  }
};

// =========================================================================
// ADMIN MODULE
// =========================================================================

const AdminApp = {
  complaints: [],
  selectedId: null,

  init() {
    if (!getAdminToken()) {
      window.location.href = '/login.html';
      return;
    }

    this.bindEvents();

    const logoutButton = document.getElementById('admin-logout');

    if (logoutButton) {
      logoutButton.addEventListener('click', function (event) {
        event.preventDefault();

        sessionStorage.removeItem('campuscare_admin_token');

        window.location.href = '/login.html';
      });
    }

    this.loadDashboardStats();
    this.loadComplaints();
  },

  bindEvents() {
    // Filter controls
    const searchInput = document.getElementById('admin-search-input');
    const deptFilter = document.getElementById('admin-filter-dept');
    const catFilter = document.getElementById('admin-filter-cat');
    const statusFilter = document.getElementById('admin-filter-status');

    if (searchInput) searchInput.addEventListener('input', () => this.applyFilters());
    if (deptFilter) deptFilter.addEventListener('change', () => this.applyFilters());
    if (catFilter) catFilter.addEventListener('change', () => this.applyFilters());
    if (statusFilter) statusFilter.addEventListener('change', () => this.applyFilters());

    // Status update form inside modal
    const statusForm = document.getElementById('admin-status-form');
    if (statusForm) {
      statusForm.addEventListener('submit', (e) => this.handleUpdateStatus(e));
    }

    // Full edit form
    const editForm = document.getElementById('admin-edit-form');
    if (editForm) {
      editForm.addEventListener('submit', (e) => this.handleSaveEdit(e));
    }

    // Seed sample button
    const seedBtn = document.getElementById('btn-seed-data');
    if (seedBtn) {
      seedBtn.addEventListener('click', () => this.seedSampleData());
    }

    // Confirm delete button
    const confirmDeleteBtn = document.getElementById('btn-confirm-delete');
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', () => this.executeDelete());
    }
  },

  async loadDashboardStats() {
    try {
      const response = await adminFetch(`${API_BASE_URL}/complaints/stats`);
      const result = await response.json();

      if (result.success) {
        document.getElementById('stat-admin-total').textContent = result.data.total;
        document.getElementById('stat-admin-pending').textContent = result.data.pending;
        document.getElementById('stat-admin-progress').textContent = result.data.inProgress;
        document.getElementById('stat-admin-resolved').textContent = result.data.resolved;
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    }
  },

  async loadComplaints() {
    const tableBody = document.getElementById('admin-complaints-tbody');
    const emptyState = document.getElementById('admin-empty-state');
    const loadingState = document.getElementById('admin-loading-state');
    const tableContainer = document.getElementById('admin-table-container');

    if (loadingState) loadingState.style.display = 'flex';
    if (tableBody) tableBody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'none';

    try {
      const res = await adminFetch(`${API_BASE_URL}/complaints`);
      const result = await res.json();

      if (loadingState) loadingState.style.display = 'none';

      if (result.success) {
        this.complaints = result.data;
        this.renderTable(this.complaints);
      } else {
        showToast(result.message || 'Error fetching complaints', 'error');
      }
    } catch (err) {
      if (loadingState) loadingState.style.display = 'none';
      console.error('Error fetching complaints:', err);
      showToast('Cannot connect to backend server. Make sure MongoDB and Node server are active.', 'error');
    }
  },

  applyFilters() {
    const searchVal = document.getElementById('admin-search-input')?.value.toLowerCase().trim() || '';
    const deptVal = document.getElementById('admin-filter-dept')?.value || 'All';
    const catVal = document.getElementById('admin-filter-cat')?.value || 'All';
    const statusVal = document.getElementById('admin-filter-status')?.value || 'All';

    const filtered = this.complaints.filter((item) => {
      const matchesDept = deptVal === 'All' || item.department === deptVal;
      const matchesCat = catVal === 'All' || item.category === catVal;
      const matchesStatus = statusVal === 'All' || item.status === statusVal;

      const matchesSearch =
        searchVal === '' ||
        (item.studentName && item.studentName.toLowerCase().includes(searchVal)) ||
        (item.registerNumber && item.registerNumber.toLowerCase().includes(searchVal)) ||
        (item.title && item.title.toLowerCase().includes(searchVal)) ||
        (item.ticketId && item.ticketId.toLowerCase().includes(searchVal));

      return matchesDept && matchesCat && matchesStatus && matchesSearch;
    });

    this.renderTable(filtered);
  },

  renderTable(list) {
    const tableBody = document.getElementById('admin-complaints-tbody');
    const emptyState = document.getElementById('admin-empty-state');
    const tableContainer = document.getElementById('admin-table-container');
    const countBadge = document.getElementById('admin-complaint-count');

    if (!tableBody) return;

    tableBody.innerHTML = '';
    if (countBadge) countBadge.textContent = `${list.length} Records`;

    if (!list || list.length === 0) {
      if (tableContainer) tableContainer.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (tableContainer) tableContainer.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';

    list.forEach((item) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="ticket-pill">${item.ticketId || 'CC-ID'}</span></td>
        <td>
          <div style="font-weight: 600; color: var(--slate-900);">${item.studentName}</div>
          <div style="font-size: 0.78rem; color: var(--slate-500);">${item.registerNumber}</div>
        </td>
        <td style="font-size: 0.85rem;">${item.department}</td>
        <td class="table-title-cell" title="${item.title}">${item.title}</td>
        <td><span class="category-tag">${item.category}</span></td>
        <td>${formatDate(item.date || item.createdAt)}</td>
        <td>${getStatusBadgeHtml(item.status)}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon view" title="View Details" onclick="AdminApp.openDetailsModal('${item._id}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
            <button class="btn-icon edit" title="Update Status & Remarks" onclick="AdminApp.openStatusModal('${item._id}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="btn-icon delete" title="Delete Complaint" onclick="AdminApp.openDeleteModal('${item._id}', '${item.ticketId || item.title}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  },

  async openDetailsModal(id) {
    const dialog = document.getElementById('admin-details-dialog');
    if (!dialog) return;

    try {
      const res = await adminFetch(`${API_BASE_URL}/complaints/${id}`);
      const result = await res.json();

      if (result.success) {
        const item = result.data;
        document.getElementById('admin-modal-ticket-id').textContent = item.ticketId || 'N/A';
        document.getElementById('admin-modal-title').textContent = item.title;
        document.getElementById('admin-modal-status').innerHTML = getStatusBadgeHtml(item.status);
        document.getElementById('admin-modal-category').textContent = item.category;
        document.getElementById('admin-modal-priority').textContent = item.priority || 'Medium';
        document.getElementById('admin-modal-date').textContent = formatDate(item.date || item.createdAt);
        document.getElementById('admin-modal-student').textContent = `${item.studentName} (${item.registerNumber})`;
        document.getElementById('admin-modal-dept').textContent = item.department;
        document.getElementById('admin-modal-desc').textContent = item.description;

        const remarksDisplay = document.getElementById('admin-modal-remarks');
        if (remarksDisplay) {
          remarksDisplay.textContent = item.adminRemarks || 'No remarks recorded yet.';
        }

        dialog.showModal();
      }
    } catch (err) {
      showToast('Error loading details', 'error');
    }
  },

  async openStatusModal(id) {
    this.selectedId = id;
    const dialog = document.getElementById('admin-status-dialog');
    if (!dialog) return;

    try {
      const res = await adminFetch(`${API_BASE_URL}/complaints/${id}`);
      const result = await res.json();

      if (result.success) {
        const item = result.data;
        document.getElementById('status-modal-ticket').textContent = item.ticketId || 'N/A';
        document.getElementById('status-modal-title').textContent = item.title;
        document.getElementById('update-status-select').value = item.status;
        document.getElementById('update-admin-remarks').value = item.adminRemarks || '';

        dialog.showModal();
      }
    } catch (err) {
      showToast('Error loading complaint for status update', 'error');
    }
  },

  async handleUpdateStatus(e) {
    e.preventDefault();
    if (!this.selectedId) return;

    const status = document.getElementById('update-status-select').value;
    const adminRemarks = document.getElementById('update-admin-remarks').value.trim();

    try {
      const res = await adminFetch(`${API_BASE_URL}/complaints/${this.selectedId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminRemarks })
      });

      const result = await res.json();

      if (result.success) {
        showToast(result.message, 'success');
        document.getElementById('admin-status-dialog').close();
        this.loadDashboardStats();
        this.loadComplaints();
      } else {
        showToast(result.message || 'Status update failed', 'error');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Server error while updating status', 'error');
    }
  },

  openDeleteModal(id, ticketLabel) {
    this.selectedId = id;
    const dialog = document.getElementById('admin-delete-dialog');
    const labelSpan = document.getElementById('delete-complaint-label');

    if (labelSpan) labelSpan.textContent = ticketLabel;
    if (dialog) dialog.showModal();
  },

  async executeDelete() {
    if (!this.selectedId) return;

    try {
      const res = await adminFetch(`${API_BASE_URL}/complaints/${this.selectedId}`, {
        method: 'DELETE'
      });

      const result = await res.json();

      if (result.success) {
        showToast(result.message, 'success');
        document.getElementById('admin-delete-dialog').close();
        this.selectedId = null;
        this.loadDashboardStats();
        this.loadComplaints();
      } else {
        showToast(result.message || 'Failed to delete complaint', 'error');
      }
    } catch (err) {
      console.error('Error deleting complaint:', err);
      showToast('Server error while deleting complaint', 'error');
    }
  },

  async seedSampleData() {
    if (!confirm('Add demo complaints to MongoDB? Existing records must be preserved. Proceed?')) {
      return;
    }

    try {
      const res = await adminFetch(`${API_BASE_URL}/complaints/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const result = await res.json();

      if (result.success) {
        showToast(result.message, 'success');
        this.loadDashboardStats();
        this.loadComplaints();
      } else {
        showToast(result.message || 'Failed to seed sample complaints', 'error');
      }
    } catch (err) {
      console.error('Error seeding data:', err);
      showToast('Server connection error during seeding', 'error');
    }
  }
};

// =========================================================================
// GLOBAL SETUP ON DOM CONTENT LOADED
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
  setupSidebarToggle();
  setupTabs();

  // Close modals when clicking backdrop or close buttons
  document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.querySelectorAll('.modal-close-btn, .btn-modal-cancel').forEach((btn) => {
      btn.addEventListener('click', () => dialog.close());
    });

    // Close when clicking directly on backdrop
    dialog.addEventListener('click', (e) => {
      const rect = dialog.getBoundingClientRect();
      const isInDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;

      if (!isInDialog) {
        dialog.close();
      }
    });
  });

  // Detect whether we are on Student or Admin page
  if (document.body.classList.contains('student-page')) {
    StudentApp.init();
  } else if (document.body.classList.contains('admin-page')) {
    AdminApp.init();
  }
});
