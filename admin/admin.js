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
  const GOOGLE_SHEET_KEY = 'mmc_google_sheet_webhook';

  const APPS_SCRIPT_CODE = `/**
 * ============================================================
 * EDUCATION MENTOR AWARDS — GOOGLE APPS SCRIPT WEBHOOK
 * ============================================================
 * 
 * INSTRUCTIONS TO CONNECT GOOGLE SHEET:
 * 1. Open your Google Sheet (create a blank one at sheets.new).
 * 2. In the top menu, click: Extensions → Apps Script.
 * 3. Delete any existing code, and paste this ENTIRE block.
 * 4. Click "Save" (Disk icon or Ctrl+S).
 * 5. In the top right corner, click: Deploy → New deployment.
 * 6. Click the gear icon (⚙️) next to "Select type" and choose "Web app".
 * 7. Set the settings:
 *    - Description: Education Mentor Awards Webhook
 *    - Execute as: "Me" (your email)
 *    - Who has access: "Anyone" (IMPORTANT: must be "Anyone")
 * 8. Click "Deploy", authorize access when prompted.
 * 9. Copy the "Web app URL" (ends in /exec).
 * 10. Open Admin Portal, click "Google Sheet", paste URL & Save!
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    // Ensure Sheet Headers Exist
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "ID",
        "Full Name",
        "Role",
        "School / Institution",
        "City",
        "Email",
        "Phone",
        "Award Category",
        "Review Status"
      ]);
      
      var headerRange = sheet.getRange(1, 1, 1, 10);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#0b111c");
      headerRange.setFontColor("#dfba73");
      headerRange.setFontFamily("Arial");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
    
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "No payload received"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    var payload = JSON.parse(e.postData.contents);
    
    // Support Batch Sync (Array of nominations from Admin Dashboard)
    if (Array.isArray(payload)) {
      var rows = [];
      for (var i = 0; i < payload.length; i++) {
        var item = payload[i];
        rows.push([
          item.created_at || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          item.id || "",
          item.full_name || item.fullName || "",
          item.role || "",
          item.school || "",
          item.city || "",
          item.email || "",
          item.phone || "",
          item.category || "",
          item.status || "Pending"
        ]);
      }
      if (rows.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 10).setValues(rows);
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        count: rows.length,
        message: rows.length + " nominations synced successfully"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Support Single Submission (From Landing Page Form)
    sheet.appendRow([
      payload.created_at || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      payload.id || "",
      payload.full_name || payload.fullName || "",
      payload.role || "",
      payload.school || "",
      payload.city || "",
      payload.email || "",
      payload.phone || "",
      payload.category || "",
      payload.status || "Pending"
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Nomination appended to Google Sheet"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    service: "Education Mentor Awards Google Sheet Sync",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}`;

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

  // DOM Elements - Google Sheet Modal
  const googleSheetBtn = document.getElementById('googleSheetBtn');
  const sheetBtnText = document.getElementById('sheetBtnText');
  const sheetModal = document.getElementById('sheetModal');
  const sheetModalCloseBtn = document.getElementById('sheetModalCloseBtn');
  const sheetModalDoneBtn = document.getElementById('sheetModalDoneBtn');
  const sheetConnectionBadge = document.getElementById('sheetConnectionBadge');
  const sheetWebhookInput = document.getElementById('sheetWebhookInput');
  const saveSheetUrlBtn = document.getElementById('saveSheetUrlBtn');
  const sheetMsg = document.getElementById('sheetMsg');
  const syncAllSheetBtn = document.getElementById('syncAllSheetBtn');
  const testSheetBtn = document.getElementById('testSheetBtn');
  const copyAppsScriptBtn = document.getElementById('copyAppsScriptBtn');
  const copyScriptText = document.getElementById('copyScriptText');

  // State Store
  let rawSubmissions = [];
  let filteredSubmissions = [];
  let activeModalRecord = null;

  // Initialize
  function init() {
    populateCategoryFilter();
    setupEventListeners();
    updateSheetBadgeAndStatus();
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

    // Google Sheet Modal Events
    googleSheetBtn.addEventListener('click', openSheetModal);
    sheetModalCloseBtn.addEventListener('click', closeSheetModal);
    sheetModalDoneBtn.addEventListener('click', closeSheetModal);
    sheetModal.addEventListener('click', (e) => {
      if (e.target === sheetModal) closeSheetModal();
    });

    saveSheetUrlBtn.addEventListener('click', saveGoogleSheetWebhook);
    syncAllSheetBtn.addEventListener('click', syncAllToGoogleSheet);
    testSheetBtn.addEventListener('click', sendTestRowToGoogleSheet);
    copyAppsScriptBtn.addEventListener('click', copyAppsScriptCode);

    // Escape key closes modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (dossierModal.style.display === 'flex') closeModal();
        if (sheetModal.style.display === 'flex') closeSheetModal();
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
        if (result.google_sheet_webhook && !localStorage.getItem(GOOGLE_SHEET_KEY)) {
          localStorage.setItem(GOOGLE_SHEET_KEY, result.google_sheet_webhook);
          updateSheetBadgeAndStatus();
        }
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

  // ============================================================
  // GOOGLE SHEET SYNCHRONIZATION HANDLERS
  // ============================================================

  function updateSheetBadgeAndStatus() {
    const url = localStorage.getItem(GOOGLE_SHEET_KEY);
    if (url && url.startsWith('http')) {
      sheetConnectionBadge.textContent = 'Connected';
      sheetConnectionBadge.className = 'sheet-status-badge badge-connected';
      sheetBtnText.textContent = 'Google Sheet (Active)';
      googleSheetBtn.classList.add('is-connected');
      if (sheetWebhookInput) sheetWebhookInput.value = url;
    } else {
      sheetConnectionBadge.textContent = 'Not Connected';
      sheetConnectionBadge.className = 'sheet-status-badge badge-pending';
      sheetBtnText.textContent = 'Google Sheet';
      googleSheetBtn.classList.remove('is-connected');
    }
  }

  function openSheetModal() {
    updateSheetBadgeAndStatus();
    sheetMsg.style.display = 'none';
    sheetMsg.textContent = '';
    sheetModal.style.display = 'flex';
  }

  function closeSheetModal() {
    sheetModal.style.display = 'none';
  }

  function saveGoogleSheetWebhook() {
    const url = (sheetWebhookInput.value || '').trim();
    if (!url) {
      localStorage.removeItem(GOOGLE_SHEET_KEY);
      updateSheetBadgeAndStatus();
      showSheetMsg('Google Sheet webhook disconnected.', 'error');
      return;
    }
    if (!url.startsWith('https://')) {
      showSheetMsg('Please enter a valid HTTPS URL (e.g. https://script.google.com/macros/s/.../exec)', 'error');
      return;
    }
    localStorage.setItem(GOOGLE_SHEET_KEY, url);
    updateSheetBadgeAndStatus();
    showSheetMsg('Webhook URL saved! Real-time synchronization is now active.', 'success');
  }

  async function sendTestRowToGoogleSheet() {
    const url = (sheetWebhookInput.value || localStorage.getItem(GOOGLE_SHEET_KEY) || '').trim();
    if (!url || !url.startsWith('https://')) {
      showSheetMsg('Please enter and save a valid Google Apps Script Web App URL first.', 'error');
      return;
    }

    testSheetBtn.disabled = true;
    const originalText = testSheetBtn.textContent;
    testSheetBtn.textContent = 'Sending Test...';

    const testPayload = {
      id: 'TEST-' + Math.floor(100 + Math.random() * 900),
      full_name: 'Dr. Test Leader (Verification)',
      role: 'Principal',
      school: 'Demo School of Excellence',
      city: 'New Delhi',
      email: 'verification@education-mentor.in',
      phone: '+91 99999 11111',
      category: 'Best School Leadership Award',
      created_at: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      status: 'Verified'
    };

    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(testPayload)
      });
      showSheetMsg('✓ Test record dispatched to your Google Sheet! Please check your spreadsheet.', 'success');
    } catch (err) {
      showSheetMsg('Error dispatching test record: ' + err.message, 'error');
    } finally {
      testSheetBtn.disabled = false;
      testSheetBtn.textContent = originalText;
    }
  }

  async function syncAllToGoogleSheet() {
    const url = (sheetWebhookInput.value || localStorage.getItem(GOOGLE_SHEET_KEY) || '').trim();
    if (!url || !url.startsWith('https://')) {
      showSheetMsg('Please enter and save a valid Google Apps Script Web App URL first.', 'error');
      return;
    }

    if (!rawSubmissions || rawSubmissions.length === 0) {
      showSheetMsg('No nominations found to sync.', 'error');
      return;
    }

    syncAllSheetBtn.disabled = true;
    const btnSpan = syncAllSheetBtn.querySelector('span');
    const originalText = btnSpan ? btnSpan.textContent : 'Sync All to Google Sheet';
    if (btnSpan) btnSpan.textContent = `Syncing ${rawSubmissions.length} records...`;

    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(rawSubmissions)
      });
      showSheetMsg(`✓ Successfully synced ${rawSubmissions.length} nominations to your Google Sheet!`, 'success');
    } catch (err) {
      showSheetMsg('Error syncing nominations to Google Sheet: ' + err.message, 'error');
    } finally {
      syncAllSheetBtn.disabled = false;
      if (btnSpan) btnSpan.textContent = originalText;
    }
  }

  async function copyAppsScriptCode() {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_CODE);
      copyScriptText.textContent = '✓ Apps Script Code Copied!';
      copyAppsScriptBtn.style.borderColor = '#2ecc71';
      copyAppsScriptBtn.style.color = '#2ecc71';
      setTimeout(() => {
        copyScriptText.textContent = 'Copy Ready-to-Use Apps Script Code';
        copyAppsScriptBtn.style.borderColor = '';
        copyAppsScriptBtn.style.color = '';
      }, 3000);
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = APPS_SCRIPT_CODE;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      copyScriptText.textContent = '✓ Apps Script Code Copied!';
      setTimeout(() => {
        copyScriptText.textContent = 'Copy Ready-to-Use Apps Script Code';
      }, 3000);
    }
  }

  function showSheetMsg(text, type) {
    sheetMsg.textContent = text;
    sheetMsg.className = `sheet-msg msg-${type}`;
    sheetMsg.style.display = 'block';
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
