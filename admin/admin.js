/**
 * Education Mentor Awards · Leadership Command Center Client Logic
 * Cloudflare D1 Database Integration: "awards-data" (47a46db1-2e59-4595-bcf5-01ee1fd29210)
 */

(function () {
  'use strict';

  const TOKEN_KEY = 'awards_admin_token';
  const LOCAL_STORAGE_KEY = 'mmc_awards_nominations';
  const D1_NAME = 'awards-data';
  const D1_KEY = '47a46db1-2e59-4595-bcf5-01ee1fd29210';
  const ADMIN_PASSWORD_FALLBACK = 'Awardsmmc@123';

  // 25 Education Mentor Award Categories
  const AWARD_CATEGORIES = [
    'Best School Leadership Award',
    'Best Academic Excellence Award',
    'Best Teaching Excellence Award',
    'Best Teacher Development Award',
    'Best Career Guidance Award',
    'Best Student Counselling Award',
    'Best Student Mental Health Award',
    'Best STEM Education Award',
    'Best Digital Education Award',
    'Best Innovative Teaching Award',
    'Best Experiential Learning Award',
    'Best NEP 2020 Implementation Award',
    'Best Inclusive Education Award',
    'Best Sports Education Award',
    'Best Arts & Cultural Education Award',
    'Best Life Skills Education Award',
    'Best Student Leadership Award',
    'Best Alumni Engagement Award',
    'Best Parent-School Engagement Award',
    'Best Community Engagement Award',
    'Best Environmental Education Award',
    'Best School Innovation Award',
    'Best Holistic Education Award',
    'Best Higher Education Guidance Award',
    'Best Global Education & Scholarship Guidance Award'
  ];

  // DOM Elements - Login
  const loginScreen = document.getElementById('loginScreen');
  const loginForm = document.getElementById('loginForm');
  const adminPassword = document.getElementById('adminPassword');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const loginError = document.getElementById('loginError');

  // DOM Elements - Dashboard
  const dashboardScreen = document.getElementById('dashboardScreen');
  const syncStatus = document.getElementById('syncStatus');
  const refreshBtn = document.getElementById('refreshBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  // DOM Elements - KPIs
  const kpiTotal = document.getElementById('kpiTotal');
  const kpiSchools = document.getElementById('kpiSchools');
  const kpiPrincipals = document.getElementById('kpiPrincipals');
  const kpiVpCounsellors = document.getElementById('kpiVpCounsellors');

  // DOM Elements - Toolbar
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const roleFilter = document.getElementById('roleFilter');
  const categoryFilter = document.getElementById('categoryFilter');
  const statusFilter = document.getElementById('statusFilter');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const showingCount = document.getElementById('showingCount');
  const totalRecordsCount = document.getElementById('totalRecordsCount');

  // DOM Elements - Table & States
  const nominationsTableBody = document.getElementById('nominationsTableBody');
  const tableLoading = document.getElementById('tableLoading');
  const emptyState = document.getElementById('emptyState');
  const emptyStateMsg = document.getElementById('emptyStateMsg');

  // DOM Elements - Dossier Modal
  const dossierModal = document.getElementById('dossierModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalDoneBtn = document.getElementById('modalDoneBtn');
  const modalPrintBtn = document.getElementById('modalPrintBtn');
  const modalNomineeName = document.getElementById('modalNomineeName');
  const modalCategoryBadge = document.getElementById('modalCategoryBadge');
  const modalId = document.getElementById('modalId');
  const modalDate = document.getElementById('modalDate');
  const modalRole = document.getElementById('modalRole');
  const modalStatus = document.getElementById('modalStatus');
  const modalSchool = document.getElementById('modalSchool');
  const modalCity = document.getElementById('modalCity');
  const modalEmail = document.getElementById('modalEmail');
  const modalPhone = document.getElementById('modalPhone');
  const modalCategory = document.getElementById('modalCategory');
  const modalStatusSelect = document.getElementById('modalStatusSelect');

  // State Store
  let rawSubmissions = [];
  let filteredSubmissions = [];
  let activeModalRecord = null;

  // Initialize
  function init() {
    populateCategoryFilter();
    setupEventListeners();
    checkAuthSession();
  }

  // Populate Categories in Toolbar Filter
  function populateCategoryFilter() {
    categoryFilter.innerHTML = '<option value="ALL">All 25 Categories</option>';
    AWARD_CATEGORIES.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      categoryFilter.appendChild(opt);
    });
  }

  // Event Listeners
  function setupEventListeners() {
    // Password toggle
    togglePasswordBtn.addEventListener('click', () => {
      const type = adminPassword.getAttribute('type') === 'password' ? 'text' : 'password';
      adminPassword.setAttribute('type', type);
      togglePasswordBtn.style.color = type === 'text' ? 'var(--gold-light)' : 'var(--text-muted)';
    });

    // Login submit
    loginForm.addEventListener('submit', handleLogin);

    // Logout
    logoutBtn.addEventListener('click', handleLogout);

    // Refresh
    refreshBtn.addEventListener('click', () => {
      refreshBtn.style.opacity = '0.5';
      fetchSubmissions().finally(() => {
        refreshBtn.style.opacity = '1';
      });
    });

    // Export CSV
    exportCsvBtn.addEventListener('click', exportToCsv);

    // Search and filters
    searchInput.addEventListener('input', () => {
      clearSearchBtn.style.display = searchInput.value ? 'block' : 'none';
      applyFilters();
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      applyFilters();
      searchInput.focus();
    });

    roleFilter.addEventListener('change', applyFilters);
    categoryFilter.addEventListener('change', applyFilters);
    statusFilter.addEventListener('change', applyFilters);

    resetFiltersBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      roleFilter.value = 'ALL';
      categoryFilter.value = 'ALL';
      statusFilter.value = 'ALL';
      applyFilters();
    });

    // Modal Events
    modalCloseBtn.addEventListener('click', closeModal);
    modalDoneBtn.addEventListener('click', closeModal);
    modalPrintBtn.addEventListener('click', () => window.print());
    dossierModal.addEventListener('click', (e) => {
      if (e.target === dossierModal) closeModal();
    });

    modalStatusSelect.addEventListener('change', (e) => {
      if (activeModalRecord) {
        updateSubmissionStatus(activeModalRecord.id, e.target.value);
      }
    });

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dossierModal.style.display === 'flex') {
        closeModal();
      }
    });
  }

  // Check auth session
  function checkAuthSession() {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      showDashboard();
      fetchSubmissions();
    } else {
      showLogin();
    }
  }

  function showLogin() {
    loginScreen.style.display = 'flex';
    dashboardScreen.style.display = 'none';
    adminPassword.value = '';
    adminPassword.focus();
  }

  function showDashboard() {
    loginScreen.style.display = 'none';
    dashboardScreen.style.display = 'block';
  }

  // Handle Login Authentication
  async function handleLogin(e) {
    e.preventDefault();
    loginError.style.display = 'none';
    loginSubmitBtn.disabled = true;
    loginSubmitBtn.querySelector('span').textContent = 'Authenticating...';

    const password = adminPassword.value.trim();

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();

      if (res.ok && data.success && data.token) {
        sessionStorage.setItem(TOKEN_KEY, data.token);
        showDashboard();
        fetchSubmissions();
      } else {
        showLoginError(data.error || 'Invalid password. Please verify your credentials.');
      }
    } catch (err) {
      // In offline / local file / fallback scenario, check password directly
      if (password === ADMIN_PASSWORD_FALLBACK) {
        const fallbackToken = btoa(`${ADMIN_PASSWORD_FALLBACK}:session_${Date.now()}`);
        sessionStorage.setItem(TOKEN_KEY, fallbackToken);
        showDashboard();
        fetchSubmissions();
      } else {
        showLoginError('Incorrect password. Access denied.');
      }
    } finally {
      loginSubmitBtn.disabled = false;
      loginSubmitBtn.querySelector('span').textContent = 'Authenticate & Enter Portal';
    }
  }

  function showLoginError(msg) {
    loginError.textContent = msg;
    loginError.style.display = 'block';
    adminPassword.value = '';
    adminPassword.focus();
  }

  function handleLogout() {
    sessionStorage.removeItem(TOKEN_KEY);
    showLogin();
  }

  // Fetch Submissions from D1 API + Merge with LocalStorage Buffer
  async function fetchSubmissions() {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return;

    tableLoading.style.display = 'flex';
    nominationsTableBody.innerHTML = '';
    emptyState.style.display = 'none';
    syncStatus.textContent = 'Syncing...';

    let serverList = [];
    let d1Connected = true;

    try {
      const res = await fetch('/api/admin/submissions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      const result = await res.json();

      if (result.success && Array.isArray(result.data)) {
        serverList = result.data;
      } else {
        d1Connected = false;
        console.warn('D1 notice:', result.error || result.warning);
      }
    } catch (err) {
      d1Connected = false;
      console.warn('API fetch notice:', err);
    }

    // Read any locally buffered submissions from localStorage
    let localList = [];
    try {
      localList = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
      if (!Array.isArray(localList)) localList = [];
    } catch (e) {
      localList = [];
    }

    // Attempt background sync of unsynced local submissions to backend
    if (d1Connected && localList.length > 0) {
      syncLocalSubmissionsToBackend(localList);
    }

    // Deduplicate and merge server records + local records
    const combined = [...serverList];
    localList.forEach(localItem => {
      // Check if this record already exists in server list
      const exists = combined.some(s => {
        if (s.id && localItem.id && String(s.id) === String(localItem.id)) return true;
        if (s.email && localItem.email && s.email.toLowerCase().trim() === localItem.email.toLowerCase().trim()) {
          if (s.category === localItem.category) return true;
        }
        return false;
      });

      if (!exists) {
        // Ensure consistent field naming
        combined.unshift({
          id: localItem.id || ('LOC-' + Math.floor(Math.random() * 1000)),
          full_name: localItem.full_name || localItem.fullName || 'Nominee',
          role: localItem.role || 'Principal',
          school: localItem.school || 'School',
          city: localItem.city || 'India',
          email: localItem.email || '—',
          phone: localItem.phone || '—',
          category: localItem.category || 'General',
          created_at: localItem.created_at || new Date().toISOString().replace('T', ' ').substring(0, 19),
          status: localItem.status || 'Pending',
          is_local: true
        });
      }
    });

    rawSubmissions = combined;
    updateKpis(rawSubmissions);
    applyFilters();

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (d1Connected) {
      syncStatus.textContent = `Connected · Synced ${now}`;
      syncStatus.style.color = '#2ecc71';
    } else {
      syncStatus.textContent = `Local Buffer Active · ${now}`;
      syncStatus.style.color = '#f39c12';
    }

    tableLoading.style.display = 'none';
  }

  // Background sync helper
  async function syncLocalSubmissionsToBackend(localList) {
    const unsynced = localList.filter(item => !item.synced);
    for (const item of unsynced) {
      try {
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: item.full_name || item.fullName,
            role: item.role,
            school: item.school,
            city: item.city,
            email: item.email,
            phone: item.phone,
            category: item.category
          })
        });
        const d = await res.json();
        if (d && d.success) {
          item.synced = true;
          if (d.id) item.id = d.id;
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localList));
        }
      } catch (e) {
        // ignore background sync errors
      }
    }
  }

  // Update KPI counters
  function updateKpis(data) {
    const total = data.length;
    const schools = new Set(data.map(d => (d.school || '').toLowerCase().trim()).filter(Boolean)).size;
    const principals = data.filter(d => (d.role || '').toLowerCase().includes('principal') && !(d.role || '').toLowerCase().includes('vice')).length;
    const vpCounsellors = data.filter(d => {
      const r = (d.role || '').toLowerCase();
      return r.includes('vice') || r.includes('counsel');
    }).length;

    kpiTotal.textContent = total;
    kpiSchools.textContent = schools;
    kpiPrincipals.textContent = principals;
    kpiVpCounsellors.textContent = vpCounsellors;
    totalRecordsCount.textContent = total;
  }

  // Apply Search & Filters
  function applyFilters() {
    const query = searchInput.value.toLowerCase().trim();
    const roleVal = roleFilter.value;
    const catVal = categoryFilter.value;
    const statusVal = statusFilter.value;

    filteredSubmissions = rawSubmissions.filter(item => {
      // Role filter
      if (roleVal !== 'ALL' && (item.role || '').toLowerCase() !== roleVal.toLowerCase()) {
        return false;
      }
      // Category filter
      if (catVal !== 'ALL' && item.category !== catVal) {
        return false;
      }
      // Status filter
      if (statusVal !== 'ALL' && (item.status || 'Pending').toLowerCase() !== statusVal.toLowerCase()) {
        return false;
      }
      // Search query
      if (query) {
        const matchString = [
          item.full_name,
          item.school,
          item.city,
          item.email,
          item.phone,
          item.category,
          item.role,
          String(item.id)
        ].join(' ').toLowerCase();

        if (!matchString.includes(query)) {
          return false;
        }
      }
      return true;
    });

    showingCount.textContent = filteredSubmissions.length;
    renderTable(filteredSubmissions);
  }

  // Render Table Rows
  function renderTable(data) {
    nominationsTableBody.innerHTML = '';

    if (data.length === 0) {
      emptyState.style.display = 'block';
      if (rawSubmissions.length === 0) {
        emptyStateMsg.textContent = 'No nominations have been submitted yet. Form submissions on the landing page will appear here.';
      } else {
        emptyStateMsg.textContent = 'No nominations match your active search and filter criteria.';
      }
      return;
    }

    emptyState.style.display = 'none';

    data.forEach(item => {
      const tr = document.createElement('tr');

      // Format Date
      let formattedDate = '—';
      if (item.created_at) {
        const d = new Date(item.created_at);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }) + '<br><span style="color:var(--text-dim);font-size:0.7rem">' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</span>';
        } else {
          formattedDate = escapeHtml(item.created_at);
        }
      }

      // Role pill class
      const roleLower = (item.role || '').toLowerCase();
      let roleClass = 'role-principal';
      if (roleLower.includes('vice')) roleClass = 'role-vp';
      else if (roleLower.includes('counsel')) roleClass = 'role-counsellor';

      // Avatar initials
      const rawFullName = item.full_name || item.fullName || 'Nominee';
      const names = rawFullName.trim().split(/\s+/);
      const initials = names.length > 1 
        ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
        : names[0].substring(0, 2).toUpperCase();

      const currentStatus = item.status || 'Pending';

      tr.innerHTML = `
        <td class="col-id">#${escapeHtml(String(item.id || ''))}</td>
        <td class="col-date">${formattedDate}</td>
        <td>
          <div class="nominee-cell">
            <div class="avatar-badge">${initials}</div>
            <div>
              <div class="nominee-name">${escapeHtml(rawFullName)}</div>
              <span class="role-pill ${roleClass}">${escapeHtml(item.role || 'Leader')}</span>
            </div>
          </div>
        </td>
        <td>
          <div class="school-name">${escapeHtml(item.school || '—')}</div>
          <span class="city-tag">${escapeHtml(item.city || 'India')}</span>
        </td>
        <td class="contact-cell">
          <a href="mailto:${escapeHtml(item.email || '')}" title="Send Email">${escapeHtml(item.email || '—')}</a>
          <div class="contact-phone">${escapeHtml(item.phone || '—')}</div>
        </td>
        <td>
          <span class="category-badge">${escapeHtml(item.category || '—')}</span>
        </td>
        <td>
          <select class="status-select status-${escapeHtml(currentStatus)}" data-id="${item.id}">
            <option value="Pending" ${currentStatus === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Shortlisted" ${currentStatus === 'Shortlisted' ? 'selected' : ''}>Shortlisted</option>
            <option value="Verified" ${currentStatus === 'Verified' ? 'selected' : ''}>Verified</option>
            <option value="Awarded" ${currentStatus === 'Awarded' ? 'selected' : ''}>Awarded</option>
            <option value="Rejected" ${currentStatus === 'Rejected' ? 'selected' : ''}>Rejected</option>
          </select>
        </td>
        <td class="actions-cell">
          <button class="btn-action-view" data-id="${item.id}">Dossier</button>
          <button class="btn-action-delete" data-id="${item.id}" title="Delete Record">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </td>
      `;

      // Status change listener
      const statusSelect = tr.querySelector('.status-select');
      statusSelect.addEventListener('change', (e) => {
        const newStatus = e.target.value;
        statusSelect.className = `status-select status-${newStatus}`;
        updateSubmissionStatus(item.id, newStatus);
      });

      // View Dossier listener
      const viewBtn = tr.querySelector('.btn-action-view');
      viewBtn.addEventListener('click', () => openModal(item));

      // Delete listener
      const delBtn = tr.querySelector('.btn-action-delete');
      delBtn.addEventListener('click', () => deleteSubmission(item.id, rawFullName));

      nominationsTableBody.appendChild(tr);
    });
  }

  // Update Status in D1 and LocalStorage
  async function updateSubmissionStatus(id, newStatus) {
    const token = sessionStorage.getItem(TOKEN_KEY);

    // Update in local array
    const record = rawSubmissions.find(r => String(r.id) === String(id));
    if (record) record.status = newStatus;
    if (activeModalRecord && String(activeModalRecord.id) === String(id)) {
      modalStatus.textContent = newStatus;
      modalStatusSelect.value = newStatus;
    }

    // Update in localStorage
    try {
      const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
      const loc = stored.find(s => String(s.id) === String(id));
      if (loc) {
        loc.status = newStatus;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stored));
      }
    } catch (e) {}

    // Update via backend API if authenticated
    if (token) {
      try {
        await fetch('/api/admin/submissions', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ id, status: newStatus })
        });
      } catch (err) {
        console.warn('Backend status update notice:', err);
      }
    }
  }

  // Delete Record in D1 and LocalStorage
  async function deleteSubmission(id, name) {
    if (!confirm(`Are you sure you want to remove nomination #${id} (${name})? This cannot be undone.`)) {
      return;
    }

    // Remove from local state
    rawSubmissions = rawSubmissions.filter(r => String(r.id) !== String(id));
    updateKpis(rawSubmissions);
    applyFilters();

    // Remove from localStorage
    try {
      let stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
      stored = stored.filter(s => String(s.id) !== String(id));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stored));
    } catch (e) {}

    // Remove via backend API if authenticated
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        await fetch(`/api/admin/submissions?id=${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (err) {
        console.warn('Backend delete notice:', err);
      }
    }
  }

  // Open Dossier Modal
  function openModal(item) {
    activeModalRecord = item;
    const name = item.full_name || item.fullName || 'Nominee';
    modalNomineeName.textContent = name;
    modalCategoryBadge.textContent = item.category || 'General';
    modalId.textContent = `#${item.id}`;
    modalDate.textContent = item.created_at || '—';
    modalRole.textContent = item.role || '—';
    modalStatus.textContent = item.status || 'Pending';
    modalSchool.textContent = item.school || '—';
    modalCity.textContent = item.city || '—';
    modalEmail.textContent = item.email || '—';
    modalPhone.textContent = item.phone || '—';
    modalCategory.textContent = item.category || '—';
    modalStatusSelect.value = item.status || 'Pending';

    dossierModal.style.display = 'flex';
  }

  function closeModal() {
    dossierModal.style.display = 'none';
    activeModalRecord = null;
  }

  // Export to CSV Function
  function exportToCsv() {
    if (rawSubmissions.length === 0) {
      alert('No nominations available to export.');
      return;
    }

    const headers = [
      'ID',
      'Full Name',
      'Role',
      'School / Institution',
      'City',
      'Email',
      'Phone',
      'Award Category',
      'Submission Date',
      'Review Status'
    ];

    const rows = rawSubmissions.map(item => [
      item.id,
      `"${(item.full_name || item.fullName || '').replace(/"/g, '""')}"`,
      `"${(item.role || '').replace(/"/g, '""')}"`,
      `"${(item.school || '').replace(/"/g, '""')}"`,
      `"${(item.city || '').replace(/"/g, '""')}"`,
      `"${(item.email || '').replace(/"/g, '""')}"`,
      `"${(item.phone || '').replace(/"/g, '""')}"`,
      `"${(item.category || '').replace(/"/g, '""')}"`,
      `"${(item.created_at || '').replace(/"/g, '""')}"`,
      `"${(item.status || 'Pending').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const dateStr = new Date().toISOString().substring(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `education-mentor-awards-nominations-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Helper escape
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Start app
  document.addEventListener('DOMContentLoaded', init);

})();
