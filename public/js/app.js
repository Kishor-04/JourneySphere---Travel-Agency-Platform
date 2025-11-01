// JourneySphere localStorage-based auth (temporary, client-side only)
(function() {
  const STORAGE = {
    users: 'js_users',
    currentUser: 'js_current_user',
  currentAdmin: 'js_current_admin',
  packages: 'js_packages',
  bookings: 'js_bookings',
  editPackageId: 'js_edit_package_id',
  pendingBookingPackageId: 'js_pending_booking_pkg_id'
  };

  const ADMIN = { username: 'kishor', password: 'Kishor@2004' };

  // Helpers
  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE.users)) || [];
    } catch { return []; }
  }

  function saveUsers(users) {
    localStorage.setItem(STORAGE.users, JSON.stringify(users));
  }

  function setCurrentUser(user) {
    localStorage.setItem(STORAGE.currentUser, JSON.stringify(user));
    // ensure admin session cleared
    localStorage.removeItem(STORAGE.currentAdmin);
  }

  function setCurrentAdmin(admin) {
    localStorage.setItem(STORAGE.currentAdmin, JSON.stringify(admin));
    // ensure user session cleared
    localStorage.removeItem(STORAGE.currentUser);
  }

  function getCurrentAdmin() {
    try { return JSON.parse(localStorage.getItem(STORAGE.currentAdmin)); } catch { return null; }
  }

  function logoutAll() {
    localStorage.removeItem(STORAGE.currentUser);
    localStorage.removeItem(STORAGE.currentAdmin);
  }

  function isPage(name) {
    return location.pathname.toLowerCase().endsWith(name.toLowerCase());
  }

  // Page initializers
  // Validation helpers
  function isValidEmail(email) {
    if (!email) return false;
    // Simple, robust email regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }

  function strongPasswordIssues(pw) {
    const issues = [];
    if (!pw || pw.length < 8) issues.push('at least 8 characters');
    if (!/^[A-Z]/.test(pw)) issues.push('start with an uppercase letter');
    if (!/[a-z]/.test(pw)) issues.push('include a lowercase letter');
    if (!/\d/.test(pw)) issues.push('include a digit');
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw)) issues.push('include a special character');
    return issues;
  }

  function isValidUrlMaybeEmpty(url) {
    if (!url) return true;
    try {
      const u = new URL(url);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function isNonEmptyAlphaName(name) {
    if (!name) return false;
    const trimmed = name.trim();
    if (trimmed.length < 2) return false;
    return /^[A-Za-z ]+$/.test(trimmed);
  }

  function sanitizePhone(phone) {
    return (phone || '').replace(/[^\d]/g, '');
  }

  function isValidPhone(phone) {
    const d = sanitizePhone(phone);
    return d.length >= 10 && d.length <= 15;
  }

  function isTodayOrFuture(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    d.setHours(0,0,0,0);
    return d.getTime() >= today.getTime();
  }
  // Packages helpers
  function getPackages() {
    try { return JSON.parse(localStorage.getItem(STORAGE.packages)) || []; } catch { return []; }
  }
  function savePackages(list) { localStorage.setItem(STORAGE.packages, JSON.stringify(list)); }
  function getBookings() { try { return JSON.parse(localStorage.getItem(STORAGE.bookings)) || []; } catch { return []; } }
  function saveBookings(list) { localStorage.setItem(STORAGE.bookings, JSON.stringify(list)); }

  // ID generator
  function uid() { return 'id_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

  // Admin dashboard wiring
  function initAdminDashboard() {
    const btnManage = document.getElementById('goManagePackages');
    const btnBookings = document.getElementById('goViewBookings');
    const addBtn = document.getElementById('addPackageBtn');
    const backBtn = document.getElementById('backToDashboardBtn');
    const pkgList = document.getElementById('packageList');
    const bookingsList = document.getElementById('bookingList');
    const pkgSection = document.getElementById('packageManager');
    const bookSection = document.getElementById('bookingsSection');

    if (btnManage) btnManage.onclick = () => { if (pkgSection) pkgSection.scrollIntoView({ behavior: 'smooth' }); };
    if (btnBookings) btnBookings.onclick = () => { if (bookSection) bookSection.scrollIntoView({ behavior: 'smooth' }); };
    if (addBtn) addBtn.onclick = () => { localStorage.removeItem(STORAGE.editPackageId); window.open('PackageForm.html', '_blank'); };
    if (backBtn) backBtn.onclick = () => { location.href = 'Dashboard.html'; };

    // render packages
    if (pkgList) renderAdminPackages(pkgList);
    // render bookings
    if (bookingsList) renderAdminBookings(bookingsList);

    // auto-refresh when localStorage changes from other tabs
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE.packages && pkgList) renderAdminPackages(pkgList);
      if (e.key === STORAGE.bookings && bookingsList) renderAdminBookings(bookingsList);
    });
  }

  function renderAdminPackages(container) {
    const list = getPackages();
    container.innerHTML = '';
    if (!list.length) {
      container.innerHTML = '<p style="color:#666;">No packages yet. Click "Add New Package" to create one.</p>';
      return;
    }
    list.forEach(pkg => {
      const row = document.createElement('div');
      row.className = 'package-item';
      row.style.borderBottom = '1px solid #eee';
      row.style.padding = '0.75rem 0';
      row.innerHTML = `
        <div>
          <strong>${pkg.title}</strong> - ${pkg.description}
          <div style="color:#666; font-size:0.9rem;">${pkg.location} • ${pkg.days} days • ₹${Number(pkg.price).toFixed(2)}</div>
        </div>
        <div>
          <button class="admin-btn" data-action="edit" data-id="${pkg.id}">Edit</button>
          <button class="admin-btn" style="margin-left:8px;" data-action="delete" data-id="${pkg.id}">Delete</button>
        </div>`;
      container.appendChild(row);
    });
    container.onclick = (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      if (action === 'edit') {
        localStorage.setItem(STORAGE.editPackageId, id);
        window.open('PackageForm.html', '_blank');
      }
      if (action === 'delete') {
        if (!confirm('Delete this package?')) return;
        const list = getPackages().filter(p => p.id !== id);
        savePackages(list);
        renderAdminPackages(container);
        // also remove related pendingBooking target id if any
      }
    };
  }

  function renderAdminBookings(container) {
    const list = getBookings();
    if (!list.length) {
      container.innerHTML = '<p style="color:#666;">No bookings yet.</p>';
      return;
    }
    container.innerHTML = '';
    list.forEach(b => {
      const div = document.createElement('div');
      div.style.borderBottom = '1px solid #eee';
      div.style.padding = '0.75rem 0';
      div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong>${b.packageTitle}</strong> • ${b.travellers} traveller(s) • ${b.startDate}
            <div style="color:#666; font-size:0.9rem;">${b.name} — ${b.email} — ${b.phone}</div>
          </div>
          <div style="color:#999; font-size:0.85rem;">${new Date(b.createdAt).toLocaleString()}</div>
        </div>`;
      container.appendChild(div);
    });
  }

  // Package form page
  function initPackageFormPage() {
    const form = document.getElementById('packageForm');
    if (!form) return;
    const idToEdit = localStorage.getItem(STORAGE.editPackageId);
    const titleEl = document.getElementById('pkgTitle');
    const locEl = document.getElementById('pkgLocation');
    const daysEl = document.getElementById('pkgDays');
    const priceEl = document.getElementById('pkgPrice');
    const imgEl = document.getElementById('pkgImage');
    const descEl = document.getElementById('pkgDescription');
    const cancelBtn = document.getElementById('cancelPackageBtn');
    const formTitle = document.getElementById('formTitle');

    if (idToEdit) {
      const pkg = getPackages().find(p => p.id === idToEdit);
      if (pkg) {
        if (formTitle) formTitle.textContent = 'Edit Package';
        titleEl.value = pkg.title;
        locEl.value = pkg.location;
        daysEl.value = pkg.days;
        priceEl.value = pkg.price;
        imgEl.value = pkg.imageUrl || '';
        descEl.value = pkg.description;
      }
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = titleEl.value.trim();
      const location = locEl.value.trim();
      const days = parseInt(daysEl.value, 10) || 0;
      const price = parseFloat(priceEl.value);
      const imageUrl = imgEl.value.trim();
      const description = descEl.value.trim();

      if (!title || title.length < 3) { alert('Title must be at least 3 characters.'); return; }
      if (!location || location.length < 3) { alert('Location must be at least 3 characters.'); return; }
      if (!Number.isFinite(days) || days < 1) { alert('Duration must be a positive number of days.'); return; }
      if (!Number.isFinite(price) || price <= 0) { alert('Price must be a positive number.'); return; }
      if (!isValidUrlMaybeEmpty(imageUrl)) { alert('Please enter a valid http(s) Image URL or leave it empty.'); return; }
      if (!description || description.length < 10) { alert('Description must be at least 10 characters.'); return; }
      const list = getPackages();
      if (idToEdit) {
        const idx = list.findIndex(p => p.id === idToEdit);
        if (idx !== -1) list[idx] = { ...list[idx], title, location, days, price, imageUrl, description };
      } else {
        list.push({ id: uid(), title, location, days, price, imageUrl, description, createdAt: new Date().toISOString() });
      }
      savePackages(list);
      alert('Package saved successfully.');
      window.close();
    });

    if (cancelBtn) cancelBtn.onclick = () => window.close();
  }

  // Public dashboard package rendering
  function initPublicDashboard() {
    const container = document.getElementById('publicPackages');
    const emptyMsg = document.getElementById('noPackagesMsg');
    const searchInput = document.getElementById('publicSearchText');
    const searchFilter = document.getElementById('publicSearchFilter');
    const searchBtn = document.getElementById('publicSearchBtn');
    const suggestions = document.getElementById('publicSuggestions');
    if (!container) return;
    let list = getPackages();
    const all = () => getPackages();

    const render = (items) => {
      container.innerHTML = '';
      if (!items.length) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
      }
      if (emptyMsg) emptyMsg.style.display = 'none';
      items.forEach(pkg => {
        const card = document.createElement('div');
        card.className = 'destination-card';
        card.innerHTML = `
          <h3>${pkg.title}</h3>
          <p>${pkg.description}</p>
          <div style="color:#666; font-size:0.9rem; margin:.25rem 0 0.75rem;">${pkg.location} • ${pkg.days} days • ₹${Number(pkg.price).toFixed(2)}</div>
          <button class="book-now-btn" data-id="${pkg.id}">Book Now</button>`;
        container.appendChild(card);
      });
    };

    const updateSuggestions = () => {
      if (!suggestions) return;
      const set = new Set();
      const mode = (searchFilter?.value || 'titleCity');
      all().forEach(p => {
        const [city, country] = p.location.split(',').map(s => (s || '').trim());
        if (mode === 'titleCity') {
          if (p.title) set.add(p.title);
          if (city) set.add(city);
        } else if (mode === 'locationCountry') {
          if (country) set.add(country);
        } else if (mode === 'duration') {
          set.add(String(p.days));
        } else if (mode === 'price') {
          set.add(String(Math.round(Number(p.price) || 0)));
        }
      });
      suggestions.innerHTML = Array.from(set).slice(0, 50).map(v => `<option value="${v}"></option>`).join('');
    };

    const applyFilter = () => {
      const q = (searchInput?.value || '').trim().toLowerCase();
      const f = (searchFilter?.value || 'titleCity');
      list = all();
      if (!q) { render(list); return; }
      const filtered = list.filter(p => {
        const title = (p.title || '').toLowerCase();
        const [city, country] = (p.location || '').split(',').map(s => (s || '').trim().toLowerCase());
        if (f === 'titleCity') return title.includes(q) || (city && city.includes(q));
        if (f === 'locationCountry') return country ? country.includes(q) : false;
        if (f === 'duration') {
          const days = Number(p.days);
          if (/^<=?\s*(\d+)$/.test(q)) { const m = q.match(/^<=?\s*(\d+)$/); return days <= Number(m[1]); }
          if (/^>=?\s*(\d+)$/.test(q)) { const m = q.match(/^>=?\s*(\d+)$/); return days >= Number(m[1]); }
          return String(days).includes(q);
        }
        if (f === 'price') {
          const price = Number(p.price);
          if (/^<=?\s*(\d+(?:\.\d+)?)$/.test(q)) { const m = q.match(/^<=?\s*(\d+(?:\.\d+)?)$/); return price <= Number(m[1]); }
          if (/^>=?\s*(\d+(?:\.\d+)?)$/.test(q)) { const m = q.match(/^>=?\s*(\d+(?:\.\d+)?)$/); return price >= Number(m[1]); }
          return String(Math.round(price)).includes(q);
        }
        return true;
      });
      render(filtered);
    };

    // initial render
    render(list);
    updateSuggestions();

    const updatePlaceholder = () => {
      if (!searchInput) return;
      const f = (searchFilter?.value || 'titleCity');
      if (f === 'titleCity') searchInput.placeholder = 'e.g., Delhi or Shimla Tour';
      if (f === 'locationCountry') searchInput.placeholder = 'e.g., India';
      if (f === 'duration') searchInput.placeholder = 'e.g., >= 5';
      if (f === 'price') searchInput.placeholder = 'e.g., <= 4999';
    };
    updatePlaceholder();
    if (searchFilter) searchFilter.addEventListener('change', () => { updatePlaceholder(); updateSuggestions(); });
    if (searchBtn) searchBtn.onclick = applyFilter;
    if (searchInput) searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); applyFilter(); } });
    window.addEventListener('storage', (e) => { if (e.key === STORAGE.packages) { list = all(); render(list); updateSuggestions(); } });
    container.onclick = (e) => {
      const btn = e.target.closest('button.book-now-btn');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      // require login
      const current = (() => { try { return JSON.parse(localStorage.getItem(STORAGE.currentUser)); } catch { return null; }})();
      if (!current) {
        // remember desired package to prefill and redirect to Login
        localStorage.setItem(STORAGE.pendingBookingPackageId, id);
        location.href = 'Login.html';
        return;
      }
      localStorage.setItem(STORAGE.pendingBookingPackageId, id);
      location.href = 'BookingForm.html';
    };
  }

  // User Dashboard
  function initUserDashboard() {
    const pkgContainer = document.getElementById('userPackages');
    const searchInput = document.getElementById('userSearchText');
    const searchFilter = document.getElementById('userSearchFilter');
    const searchBtn = document.getElementById('userSearchBtn');
    const suggestions = document.getElementById('userSuggestions');
    const emptyPkg = document.getElementById('noUserPackagesMsg');
    const bookingsDiv = document.getElementById('userBookings');
    if (pkgContainer) {
      const all = () => getPackages();
      const render = (items) => {
        pkgContainer.innerHTML = '';
        if (!items.length) {
          if (emptyPkg) emptyPkg.style.display = 'block';
          return;
        }
        if (emptyPkg) emptyPkg.style.display = 'none';
        items.forEach(pkg => {
          const card = document.createElement('div');
          card.className = 'destination-card';
          card.innerHTML = `
            <h3>${pkg.title}</h3>
            <p>${pkg.description}</p>
            <div style=\"color:#666; font-size:0.9rem; margin:.25rem 0 0.75rem;\">${pkg.location} • ${pkg.days} days • ₹${Number(pkg.price).toFixed(2)}</div>
            <button class="book-now-btn" data-id="${pkg.id}">Book Now</button>`;
          pkgContainer.appendChild(card);
        });
      };

      const updateSuggestions = () => {
        if (!suggestions) return;
        const set = new Set();
        const mode = (searchFilter?.value || 'titleCity');
        all().forEach(p => {
          const [city, country] = (p.location || '').split(',').map(s => (s || '').trim());
          if (mode === 'titleCity') { if (p.title) set.add(p.title); if (city) set.add(city); }
          else if (mode === 'locationCountry') { if (country) set.add(country); }
          else if (mode === 'duration') { set.add(String(p.days)); }
          else if (mode === 'price') { set.add(String(Math.round(Number(p.price) || 0))); }
        });
        suggestions.innerHTML = Array.from(set).slice(0, 50).map(v => `<option value="${v}"></option>`).join('');
      };

      const applyFilter = () => {
        const q = (searchInput?.value || '').trim().toLowerCase();
        const f = (searchFilter?.value || 'titleCity');
        const list = all();
        if (!q) { render(list); return; }
        const filtered = list.filter(p => {
          const title = (p.title || '').toLowerCase();
          const [city, country] = (p.location || '').split(',').map(s => (s || '').trim().toLowerCase());
          if (f === 'titleCity') return title.includes(q) || (city && city.includes(q));
          if (f === 'locationCountry') return country ? country.includes(q) : false;
          if (f === 'duration') {
            const days = Number(p.days);
            if (/^<=?\s*(\d+)$/.test(q)) { const m = q.match(/^<=?\s*(\d+)$/); return days <= Number(m[1]); }
            if (/^>=?\s*(\d+)$/.test(q)) { const m = q.match(/^>=?\s*(\d+)$/); return days >= Number(m[1]); }
            return String(days).includes(q);
          }
          if (f === 'price') {
            const price = Number(p.price);
            if (/^<=?\s*(\d+(?:\.\d+)?)$/.test(q)) { const m = q.match(/^<=?\s*(\d+(?:\.\d+)?)$/); return price <= Number(m[1]); }
            if (/^>=?\s*(\d+(?:\.\d+)?)$/.test(q)) { const m = q.match(/^>=?\s*(\d+(?:\.\d+)?)$/); return price >= Number(m[1]); }
            return String(Math.round(price)).includes(q);
          }
          return true;
        });
        render(filtered);
      };

      render(all());
      updateSuggestions();
      const updatePlaceholder = () => {
        if (!searchInput) return;
        const f = (searchFilter?.value || 'titleCity');
        if (f === 'titleCity') searchInput.placeholder = 'e.g., Delhi or Shimla Tour';
        if (f === 'locationCountry') searchInput.placeholder = 'e.g., India';
        if (f === 'duration') searchInput.placeholder = 'e.g., >= 5';
        if (f === 'price') searchInput.placeholder = 'e.g., <= 4999';
      };
      updatePlaceholder();
      if (searchFilter) searchFilter.addEventListener('change', () => { updatePlaceholder(); updateSuggestions(); });
      if (searchBtn) searchBtn.onclick = applyFilter;
      if (searchInput) searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); applyFilter(); } });
      window.addEventListener('storage', (e) => { if (e.key === STORAGE.packages) { render(all()); updateSuggestions(); } });

      pkgContainer.onclick = (e) => {
        const btn = e.target.closest('button.book-now-btn');
        if (!btn) return;
        localStorage.setItem(STORAGE.pendingBookingPackageId, btn.getAttribute('data-id'));
        location.href = 'BookingForm.html';
      };
    }

    if (bookingsDiv) {
      const current = (() => { try { return JSON.parse(localStorage.getItem(STORAGE.currentUser)); } catch { return null; }})();
      const all = getBookings();
      const my = current ? all.filter(b => b.userEmail === current.email) : [];
      bookingsDiv.innerHTML = '';
      if (!my.length) {
        bookingsDiv.innerHTML = '<p style="color:#666;">No bookings yet.</p>';
      } else {
        my.forEach(b => {
          const div = document.createElement('div');
          div.style.borderBottom = '1px solid #eee';
          div.style.padding = '0.75rem 0';
          div.innerHTML = `<strong>${b.packageTitle}</strong> • ${b.travellers} traveller(s) • ${b.startDate}<div style="color:#666; font-size:0.9rem;">Booked on ${new Date(b.createdAt).toLocaleString()}</div>`;
          bookingsDiv.appendChild(div);
        });
      }
    }
  }

  // Booking form page
  function initBookingForm() {
    const form = document.getElementById('bookingForm');
    if (!form) return;
    const current = (() => { try { return JSON.parse(localStorage.getItem(STORAGE.currentUser)); } catch { return null; }})();
    if (!current) { alert('Please log in first.'); location.href = 'Login.html'; return; }
    const id = localStorage.getItem(STORAGE.pendingBookingPackageId);
    const pkg = getPackages().find(p => p.id === id);
    if (!pkg) { alert('Selected package not found.'); location.href = 'Dashboard.html'; return; }

    const nameEl = document.getElementById('custName');
    const emailEl = document.getElementById('custEmail');
    const phoneEl = document.getElementById('custPhone');
    const travEl = document.getElementById('travellers');
    const dateEl = document.getElementById('startDate');
    const cancelBtn = document.getElementById('cancelBookingBtn');
    // prefill email and name if available
    nameEl.value = current.name || '';
    emailEl.value = current.email || '';

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = nameEl.value.trim();
      const email = emailEl.value.trim().toLowerCase();
      const phone = phoneEl.value.trim();
      const travellers = parseInt(travEl.value, 10) || 0;
      const startDate = dateEl.value;
      if (!isNonEmptyAlphaName(name)) { alert('Enter a valid full name (letters and spaces, min 2 chars).'); return; }
      if (!isValidEmail(email)) { alert('Enter a valid email address.'); return; }
      if (!isValidPhone(phone)) { alert('Enter a valid phone number (10-15 digits).'); return; }
      if (!Number.isFinite(travellers) || travellers < 1) { alert('Travellers must be at least 1.'); return; }
      if (!isTodayOrFuture(startDate)) { alert('Start date must be today or later.'); return; }
      const all = getBookings();
      all.push({
        id: uid(),
        packageId: pkg.id,
        packageTitle: pkg.title,
        userEmail: current.email,
        name, email, phone, travellers, startDate,
        createdAt: new Date().toISOString()
      });
      saveBookings(all);
      alert('Booking confirmed!');
      location.href = 'UserDashboard.html';
    });
    if (cancelBtn) cancelBtn.onclick = () => { history.back(); };
  }
  function initSignupPage() {
    const form = document.querySelector('.login-form form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
  const name = document.getElementById('name')?.value.trim();
  const email = document.getElementById('email')?.value.trim().toLowerCase();
  const password = document.getElementById('password')?.value || '';
  const confirm = document.getElementById('confirmPassword')?.value || '';

  if (!name || !email || !password || !confirm) { alert('Please fill in all fields.'); return; }
  if (!isNonEmptyAlphaName(name)) { alert('Name should contain only letters and spaces (min 2 characters).'); return; }
  if (!isValidEmail(email)) { alert('Please enter a valid email address.'); return; }
  const issues = strongPasswordIssues(password);
  if (issues.length) { alert('Password must: ' + issues.join(', ') + '.'); return; }
  if (password !== confirm) { alert('Passwords do not match.'); return; }
      const users = getUsers();
      if (users.some(u => u.email === email)) {
        alert('An account with this email already exists.');
        return;
      }
      users.push({ name, email, password, createdAt: new Date().toISOString() });
      saveUsers(users);
      alert('Account created successfully. Please login.');
      location.href = 'Login.html';
    });
  }

  function initLoginPage() {
    const form = document.querySelector('.login-form form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
  const email = document.getElementById('email')?.value.trim().toLowerCase();
  const password = document.getElementById('password')?.value || '';
  if (!email || !password) { alert('Please enter email and password.'); return; }
  if (!isValidEmail(email)) { alert('Please enter a valid email address.'); return; }
      const users = getUsers();
      const found = users.find(u => u.email === email && u.password === password);
      if (!found) {
        alert('Invalid email or password.');
        return;
      }
  setCurrentUser({ name: found.name, email: found.email, loginTime: new Date().toISOString() });
  // Always land on User Dashboard after login
  location.href = 'UserDashboard.html';
    });
  }

  function initAdminLoginPage() {
    const form = document.querySelector('.login-form form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('adminUser')?.value?.trim() || '';
      const password = document.getElementById('adminPass')?.value || '';
      if (!username || !password) {
        alert('Please enter username and password.');
        return;
      }
      if (username.toLowerCase() === ADMIN.username.toLowerCase() && password === ADMIN.password) {
        setCurrentAdmin({ username, role: 'admin', loginTime: new Date().toISOString() });
  // Clear sensitive fields before redirect
  const u = document.getElementById('adminUser');
  const p = document.getElementById('adminPass');
  if (u) u.value = '';
  if (p) p.value = '';
  // Replace history entry so back button doesn't show filled form
  location.replace('Admin.html');
      } else {
        alert('Invalid admin credentials.');
      }
    });
  }

  function protectAdminPage() {
    if (!getCurrentAdmin()) {
      alert('Admin login required.');
      location.href = 'AdminLogin.html';
    }
  }

  function initLogoutPage() {
    // Auto-logout on visiting logout page
    logoutAll();
  }

  // Dynamic navbar auth item
  function initAuthNavbar() {
    const nav = document.querySelector('.nav-list');
    if (!nav) return;

    const update = () => {
      const user = (() => { try { return JSON.parse(localStorage.getItem(STORAGE.currentUser)); } catch { return null; }})();
      const admin = getCurrentAdmin();
      const isLoggedIn = !!(user || admin);

      // Hide/show Login & Signup
      const authLinks = nav.querySelectorAll('a[href="Login.html"], a[href="Signup.html"]');
      authLinks.forEach(a => {
        const li = a.closest('li');
        if (!li) return;
        li.style.display = isLoggedIn ? 'none' : '';
      });

      // Ensure a Logout item exists when logged in
      let logoutItem = document.getElementById('authLogoutItem');
      if (isLoggedIn) {
        if (!logoutItem) {
          logoutItem = document.createElement('li');
          logoutItem.id = 'authLogoutItem';
          logoutItem.className = 'auth-item';
          const link = document.createElement('a');
          link.href = '#';
          link.textContent = 'Logout';
          link.addEventListener('click', (e) => {
            e.preventDefault();
            logoutAll();
            // optional: clear pending booking intent
            // localStorage.removeItem(STORAGE.pendingBookingPackageId);
            location.href = 'Logout.html';
          });
          logoutItem.appendChild(link);
          nav.appendChild(logoutItem);
        }
      } else {
        // Remove logout when not logged in
        if (logoutItem) logoutItem.remove();
      }
    };

    update();
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE.currentUser || e.key === STORAGE.currentAdmin) update();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (isPage('Signup.html')) initSignupPage();
    if (isPage('Login.html')) initLoginPage();
    if (isPage('AdminLogin.html')) initAdminLoginPage();
  if (isPage('Admin.html')) { protectAdminPage(); initAdminDashboard(); }
    if (isPage('Logout.html')) initLogoutPage();
  if (isPage('PackageForm.html')) initPackageFormPage();
  if (isPage('Dashboard.html')) initPublicDashboard();
  if (isPage('UserDashboard.html')) initUserDashboard();
  if (isPage('BookingForm.html')) initBookingForm();
  // Always try to update nav auth state when nav present
  initAuthNavbar();
  });
})();
