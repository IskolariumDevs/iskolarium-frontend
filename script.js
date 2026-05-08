// ============================================================
// CONFIGURATION
// ============================================================
//const API_BASE_URL = "https://iskolarium-api.onrender.com";
const API_BASE_URL = "http://localhost:8080";   // ← uncomment for local dev


// ============================================================
// AUTH — RAW API CALLS
// ============================================================

/**
 * POST /api/auth/login
 * Returns { ok, data: { token } } or { ok: false, error }
 */
async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const token = await response.text();

        if (response.ok) {
            return { ok: true, data: { token } };
        } else {
            return { ok: false, error: token || "Invalid credentials" };
        }
    } catch (error) {
        console.error("Login Error:", error);
        return { ok: false, error: "Cannot connect to server. Is Render awake? (cold-start may take ~60s)" };
    }
}

/**
 * POST /api/users/register
 * Accepts the full UserRegistrationDto JSON.
 * Returns { ok, data } or { ok: false, error }
 */
async function registerUser(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch (e) { data = { message: text }; }

        return { ok: response.ok, data };
    } catch (error) {
        console.error("Registration Error:", error);
        return { ok: false, error: "Cannot connect to server." };
    }
}


// ============================================================
// UI LOGIC — BUTTON HANDLERS
// ============================================================

/**
 * FIX 1: handleLogin now fetches profile with ?email= query param
 * and saves profileData to localStorage as 'userProfile'.
 */
async function handleLogin(event) {
    event.preventDefault();

    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const msgBox   = document.getElementById('loginMessage');

    msgBox.className = 'message-box';
    msgBox.textContent = '⏳ Signing in...';
    msgBox.style.display = 'block';

    const result = await loginUser(email, password);

    if (result && result.ok) {
        const token = result.data.token;
        localStorage.setItem('token', token);
        localStorage.setItem('userEmail', email);

        // FIX 1: Fetch profile using ?email= param and save to 'userProfile'
        try {
            const profileRes = await fetch(`${API_BASE_URL}/api/users/profile?email=${encodeURIComponent(email)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (profileRes.ok) {
                const profileData = await profileRes.json();
                // Save profileData so accountId is available for comments & messages
                localStorage.setItem('userProfile', JSON.stringify(profileData));
            }
        } catch (err) {
            console.error('Failed to fetch user profile:', err);
        }

        msgBox.className = 'message-box success';
        msgBox.textContent = '✓ Login successful! Redirecting...';

        setTimeout(() => { window.location.href = "dashboard.html"; }, 1500);
    } else {
        msgBox.className = 'message-box error';
        msgBox.textContent = '✗ ' + (result?.error || "Login failed. Please check your credentials.");
    }
}

async function handleRegister(event) {
    event.preventDefault();

    const email         = document.getElementById('regEmail').value.trim();
    const password      = document.getElementById('regPassword').value;
    const firstName     = document.getElementById('regFirstName').value.trim();
    const middleName    = document.getElementById('regMiddleName')?.value.trim() || null;
    const lastName      = document.getElementById('regLastName').value.trim();
    const university    = document.getElementById('regUniversity').value;
    const program       = document.getElementById('regProgram').value;
    const gwaRaw        = document.getElementById('regGwa').value;
    const strand        = document.getElementById('regStrand')?.value || null;
    const province      = document.getElementById('regProvince').value;
    const city          = document.getElementById('regCity').value;
    const incomeBracket = document.getElementById('regIncome').value;

    if (!email || !password || !firstName || !lastName || !university || !program || !province || !city || !incomeBracket) {
        showRegisterMessage('error', '✗ Please fill in all required fields.');
        return;
    }

    const userData = {
        email,
        password,
        firstName,
        middleName:    middleName || null,
        lastName,
        gwa:           gwaRaw ? parseFloat(gwaRaw) : null,
        university,
        program,
        city,
        province,
        incomeBracket,
        strand:        strand || null
    };

    showRegisterMessage('info', '⏳ Creating your account...');

    const result = await registerUser(userData);

    if (result.ok) {
        showRegisterMessage('success', '✓ Account created! Redirecting to login...');
        setTimeout(() => { window.location.href = 'login.html'; }, 2000);
    } else {
        const errMsg = result.data?.message || result.error || "Registration failed.";
        showRegisterMessage('error', '✗ ' + errMsg);
    }
}

function showRegisterMessage(type, text) {
    const box = document.getElementById('registerMessage');
    if (!box) return;
    box.className = type === 'info'    ? 'message-box'
                  : type === 'success' ? 'message-box success'
                  :                      'message-box error';
    box.textContent = text;
    box.style.display = 'block';
}


// ============================================================
// UTILITIES & NAVIGATION
// ============================================================

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userProfile');
    window.location.href = 'index.html';
}

function checkLoginStatusOnPage() {
    const token     = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail');

    const loginLink   = document.getElementById('loginNavLink');
    const userWelcome = document.getElementById('userWelcome');
    const logoutBtn   = document.getElementById('logoutBtn');

    if (token && userEmail) {
        if (loginLink)   loginLink.style.display   = 'none';
        if (userWelcome) {
            userWelcome.style.display = 'inline';
            userWelcome.textContent   = `👋 ${userEmail.split('@')[0]}`;
        }
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
    }
}

function getToken() {
    return localStorage.getItem('token');
}

function authHeader() {
    const token = getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#39;');
}


// ============================================================
// SCHOLARSHIPS — fetched from backend
// ============================================================

async function searchScholarships(event) {
    if (event) event.preventDefault();

    const listEl = document.getElementById('scholarshipsList');
    if (!listEl) return;

    listEl.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-muted)">🔍 Searching...</p>';

    const userEmail = localStorage.getItem("userEmail");

    try {
        let fetchUrl = "";
        const headers = { 'Content-Type': 'application/json' };

        const token = getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        if (userEmail) {
            fetchUrl = `${API_BASE_URL}/api/scholarships/recommended?email=${encodeURIComponent(userEmail)}`;
            const filterCard = document.querySelector('.filter-card');
            if (filterCard) filterCard.style.display = 'none';
        } else {
            const gwa        = document.getElementById('filterGwa')?.value       || '';
            const program    = document.getElementById('filterProgram')?.value   || '';
            const university = document.getElementById('filterUniversity')?.value|| '';
            const province   = document.getElementById('filterProvince')?.value  || '';
            const city       = document.getElementById('filterCity')?.value      || '';
            const income     = document.getElementById('filterIncome')?.value    || '';
            const strand     = document.getElementById('filterStrand')?.value    || '';

            const params = new URLSearchParams();
            if (gwa)        params.append('gwa', gwa);
            if (program)    params.append('program', program);
            if (university) params.append('university', university);
            if (province)   params.append('province', province);
            if (city)       params.append('city', city);
            if (income)     params.append('incomeBracket', income);
            if (strand)     params.append('strand', strand);

            fetchUrl = `${API_BASE_URL}/api/scholarships/search?${params.toString()}`;
        }

        const res = await fetch(fetchUrl, { headers });
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);

        const scholarships = await res.json();
        displayScholarships(scholarships);

    } catch (err) {
        console.error("searchScholarships error:", err);
        listEl.innerHTML = '<p style="text-align:center;color:var(--text-muted)">⚠️ Cannot connect to server. Please try again later.</p>';
    }
}

function displayScholarships(scholarships) {
    const listEl = document.getElementById('scholarshipsList') || document.getElementById('scholarship-list');
    if (!listEl) return;

    if (!scholarships || scholarships.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>No Matching Scholarships</h3>
                <p>Try adjusting your filters or browse all scholarships.</p>
            </div>`;
        return;
    }

    listEl.innerHTML = scholarships.map(s => `
        <div class="scholarship-card">
            <div style="flex:1">
                <h3>${escapeHtml(s.title || s.name || 'Untitled Scholarship')}</h3>
                <p><strong>Provider:</strong> ${escapeHtml(s.provider || 'N/A')}</p>
                <p>${escapeHtml(s.description || '')}</p>
            </div>
            <button class="save-btn" onclick="saveScholarship(${s.scholarshipId || s.id})">
                ⭐ Save
            </button>
        </div>
    `).join('');
}

async function saveScholarship(scholarshipId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("You must be logged in to save scholarships.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/applications/apply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                scholarshipId: Number(scholarshipId)
            })
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`Server rejected request: ${errorMessage}`);
        }
        alert("Scholarship saved successfully!");

    } catch (error) {
        console.error("Error saving scholarship:", error);
        alert("Failed to save scholarship: " + error.message);
    }
}


// ============================================================
// DASHBOARD — loads tracked scholarships
// ============================================================

async function loadDashboard() {
    const token     = getToken();
    const userEmail = localStorage.getItem('userEmail');

    if (!token || !userEmail) {
        const emptyState = document.getElementById('emptyState');
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    try {
        // Use cached profile from localStorage — avoids duplicate profile fetch
        // that was triggering MissingServletRequestParameterException
        const cachedProfile = localStorage.getItem('userProfile');
        if (cachedProfile) {
            displayUserProfile(JSON.parse(cachedProfile));
        } else {
            // Fallback: fetch only if cache is missing (e.g. first login before cache was set)
            const profileRes = await fetch(`${API_BASE_URL}/api/users/profile?email=${encodeURIComponent(userEmail)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (profileRes.ok) {
                const profile = await profileRes.json();
                localStorage.setItem('userProfile', JSON.stringify(profile));
                displayUserProfile(profile);
            }
        }

        const res = await fetch(`${API_BASE_URL}/api/applications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const applications = await res.json();
        renderDashboard(applications);
    } catch (err) {
        console.error("loadDashboard error:", err);
        const emptyState = document.getElementById('emptyState');
        if (emptyState) emptyState.style.display = 'block';
    }
}

function displayUserProfile(profile) {
    const profileCard = document.getElementById('userProfileCard');
    if (profileCard) profileCard.style.display = 'block';

    const profileName = document.getElementById('profileName');
    if (profileName && profile.firstName) {
        const fullName = `${profile.firstName} ${profile.middleName ? profile.middleName + ' ' : ''}${profile.lastName || ''}`;
        profileName.textContent = fullName.trim();
    }

    const profileDetails = document.getElementById('profileDetails');
    if (profileDetails) {
        const details = [];
        if (profile.program)    details.push(profile.program);
        if (profile.university) details.push(profile.university);
        if (profile.gwa)        details.push(`GWA: ${profile.gwa}`);
        if (profile.city)       details.push(profile.city);
        profileDetails.textContent = details.join(' • ');
    }
}

function renderDashboard(applications) {
    const trackedList    = document.getElementById('trackedList');
    const totalSaved     = document.getElementById('totalSaved');
    const totalProgress  = document.getElementById('totalProgress');
    const totalCompleted = document.getElementById('totalCompleted');

    if (!trackedList) return;

    let totalPct = 0, completedCount = 0;

    if (!applications || applications.length === 0) {
        trackedList.innerHTML = '';
        if (totalSaved) totalSaved.textContent = "0";
        const emptyState = document.getElementById('emptyState');
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    const cardsHtml = applications.map(app => {
        const requirements = app.requirements || [];
        const done  = requirements.filter(r => r.completed).length;
        const total = requirements.length || 1;
        const pct   = Math.round((done / total) * 100);
        totalPct     += pct;
        completedCount += done;

        const statusClass = pct === 100 ? 'status-completed' : 'status-progress';
        const statusLabel = pct === 100 ? '✅ Complete'       : '⏳ In Progress';

        let deadlineHtml = '';
        if (app.deadlineDate) {
            const daysRemaining = app.daysRemaining;
            let deadlineClass = '', warningIcon = '';

            if (app.isPriorityWarning) {
                deadlineClass = 'deadline-priority';
                warningIcon   = '🚨 ';
            } else if (daysRemaining <= 7) {
                deadlineClass = 'deadline-urgent';
                warningIcon   = '⚠️ ';
            } else if (daysRemaining <= 30) {
                deadlineClass = 'deadline-soon';
                warningIcon   = '⏰ ';
            }

            deadlineHtml = `
                <div class="${deadlineClass}" style="margin:0.75rem 0;padding:0.5rem;border-radius:6px;background:#f7fafc;">
                    <strong>${warningIcon}Deadline:</strong> ${app.deadlineDate}
                    ${daysRemaining !== null ? `<span style="margin-left:0.5rem;color:#718096;">(${daysRemaining} days remaining)</span>` : ''}
                </div>`;
        }

        const benefitsHtml = app.benefits ? `
            <div style="margin:0.75rem 0;">
                <strong>Benefits:</strong>
                <p style="color:#4a5568;margin:0.25rem 0;">${escapeHtml(app.benefits)}</p>
            </div>` : '';

        const linkHtml = app.applicationLink ? `
            <div style="margin:0.75rem 0;">
                <a href="${escapeHtml(app.applicationLink)}" target="_blank"
                   style="color:#3182ce;text-decoration:none;font-weight:500;">
                    🔗 Application Link
                </a>
            </div>` : '';

        // FIX: Added missing closing > on checkbox input tag
        const checklistHtml = requirements.map((req, idx) => `
            <div class="checklist-item ${req.completed ? 'completed' : ''}">
                <input type="checkbox" id="chk-${app.trackerId}-${idx}"
                    ${req.completed ? 'checked' : ''}
                    onchange="toggleRequirement(${req.id}, this.checked, ${app.trackerId})">
                <label for="chk-${app.trackerId}-${idx}">${escapeHtml(req.requirementName)}</label>
            </div>
        `).join('');

        return `
            <div class="dashboard-card" style="position:relative;margin-bottom:2rem;padding:1.5rem;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                <button onclick="deleteApplication(${app.trackerId})"
                        style="position:absolute;top:1rem;right:1rem;background:none;border:none;color:#e53e3e;cursor:pointer;font-size:1.5rem;">
                    ✕
                </button>
                <div class="dashboard-header">
                    <span class="dashboard-title" style="display:block;font-size:1.2rem;font-weight:bold;margin-bottom:0.5rem;">
                        ${escapeHtml(app.scholarshipTitle || 'Scholarship')}
                    </span>
                    <span class="dashboard-status ${statusClass}">${statusLabel}</span>
                </div>
                <p style="color:#718096;margin:0.5rem 0;"><strong>Provider:</strong> ${escapeHtml(app.provider || 'N/A')}</p>
                ${deadlineHtml}
                ${benefitsHtml}
                ${linkHtml}
                <div class="progress-bar" style="background:#edf2f7;height:8px;border-radius:4px;margin-top:1rem;">
                    <div class="progress-fill" style="width:${pct}%;background:#667eea;height:100%;border-radius:4px;"></div>
                </div>
                <small style="color:var(--text-muted);display:block;margin:0.5rem 0 1rem 0;">
                    ${pct}% complete · ${done}/${total} requirements done
                </small>
                <div class="checklist">${checklistHtml}</div>
            </div>`;
    }).join('');

    trackedList.innerHTML = cardsHtml;

    if (totalSaved)     totalSaved.textContent     = applications.length;
    if (totalProgress)  totalProgress.textContent  = Math.round(totalPct / applications.length) + '%';
    if (totalCompleted) totalCompleted.textContent = completedCount;
}

async function deleteApplication(trackerId) {
    if (!confirm('Remove this scholarship from your dashboard?')) return;

    const token = getToken();
    if (!token) {
        alert('Please log in.');
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/applications/${trackerId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            alert('✅ Removed from dashboard!');
            loadDashboard();
        } else {
            const errorMsg = await res.text();
            alert('Error: ' + errorMsg);
        }
    } catch (err) {
        console.error('deleteApplication error:', err);
        alert('⚠️ Network error.');
    }
}

async function toggleRequirement(itemId, isCompleted, trackerId) {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE_URL}/api/applications/checklist/${itemId}?completed=${isCompleted}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            updateUIProgress(trackerId);
        } else {
            alert("Could not save progress.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

function updateUIProgress(trackerId) {
    const checkboxes = document.querySelectorAll(`input[id^="chk-${trackerId}"]`);
    if (checkboxes.length === 0) return;

    const total = checkboxes.length;
    const done  = Array.from(checkboxes).filter(chk => chk.checked).length;
    const pct   = Math.round((done / total) * 100);

    const card        = checkboxes[0].closest('.dashboard-card');
    const progressText = card.querySelector('small');
    const progressBar  = card.querySelector('.progress-fill');
    const statusBadge  = card.querySelector('.dashboard-status');

    if (progressText) progressText.textContent = `${pct}% complete · ${done}/${total} requirements done`;
    if (progressBar)  progressBar.style.width  = `${pct}%`;

    if (statusBadge) {
        if (pct === 100) {
            statusBadge.className = 'dashboard-status status-completed';
            statusBadge.innerHTML = '✅ Complete';
        } else {
            statusBadge.className = 'dashboard-status status-progress';
            statusBadge.innerHTML = '⏳ In Progress';
        }
    }

    updateGlobalStats();
}

function updateGlobalStats() {
    const allBars = document.querySelectorAll('.progress-fill');
    let totalSum  = 0;
    allBars.forEach(bar => { totalSum += parseInt(bar.style.width) || 0; });

    const avgProgress    = allBars.length > 0 ? Math.round(totalSum / allBars.length) : 0;
    const globalProgressEl = document.getElementById('totalProgress');
    if (globalProgressEl) globalProgressEl.textContent = `${avgProgress}%`;

    const allCheckboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
    const totalDone     = Array.from(allCheckboxes).filter(chk => chk.checked).length;
    const globalCompletedEl = document.getElementById('totalCompleted');
    if (globalCompletedEl) globalCompletedEl.textContent = totalDone;
}


// ============================================================
// FORUM
// ============================================================

async function loadForum(filter = 'all') {
    const postsEl = document.getElementById('forumPosts');
    if (!postsEl) return;

    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(
        filter === 'all'        ? 'allPostsBtn'    :
        filter === 'resolved'   ? 'resolvedBtn'    :
        filter === 'unresolved' ? 'unresolvedBtn' :
        'myPostsBtn'
    );
    if (activeBtn) activeBtn.classList.add('active');

    const token   = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(`${API_BASE_URL}/api/forum/posts`, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        let filtered = data;
        const userEmail = localStorage.getItem('userEmail');

        // Apply filters based on button clicked
        if (filter === 'resolved')   filtered = data.filter(p => p.isResolved === true);
        if (filter === 'unresolved') filtered = data.filter(p => p.isResolved !== true);
        if (filter === 'my')         filtered = data.filter(p => p.authorEmail === userEmail);

        renderPosts(filtered);
    } catch (err) {
        console.error("loadForum error:", err);
        if (postsEl) postsEl.innerHTML = '<p style="text-align:center;color:var(--text-muted)">⚠️ Could not load posts.</p>';
    }
}

/**
 * renderPosts — modern card UI with Mark as Resolved feature.
 * Shows resolve button only for post owners on unresolved posts.
 * Shows RESOLVED badge for resolved posts.
 * Task 1: Makes author names clickable for direct messaging.
 */
function renderPosts(posts) {
    const postsEl = document.getElementById('forumPosts');
    const currentUserEmail = localStorage.getItem('userEmail');
    
    if (!postsEl || !posts) return;

    postsEl.innerHTML = posts.map(p => {
        const id = p.postId || p.id;
        const isOwner = p.authorEmail === currentUserEmail;
        const displayName = escapeHtml(p.authorName || 'Student');
        const isResolved = p.isResolved === true;
        const authorId = p.authorId;

        return `
        <div class="post-card" style="background:#fff; padding:1.5rem; border-radius:16px; margin-bottom:1.5rem; box-shadow:0 2px 12px rgba(0,0,0,0.08); border: ${isResolved ? '2px solid #48bb78' : '1px solid #f0f0f0'};">
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:38px; height:38px; border-radius:50%; background:#667eea; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:bold;">
                        ${(p.authorName || 'S').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <span class="user-link" onclick="redirectToMessage(${authorId}, '${displayName.replace(/'/g, "\\'")}')" style="font-weight:600; cursor:pointer; color:#667eea; text-decoration:none; transition: color 0.2s;" onmouseover="this.style.color='#5a67d8'" onmouseout="this.style.color='#667eea'">
                            👤 ${displayName}
                        </span>
                        <div style="font-size:0.75rem; color:#a0aec0;">${p.timestamp ? new Date(p.timestamp).toLocaleString() : ''}</div>
                    </div>
                </div>
                ${isResolved ? '<span style="background:#def7ec; color:#03543f; padding:4px 12px; border-radius:15px; font-size:0.75rem; font-weight:bold;">✅ RESOLVED</span>' : ''}
            </div>

            <p style="color:#2d3748; line-height:1.6; margin-bottom:0.5rem;">${escapeHtml(p.textContent || p.content)}</p>

            ${isOwner && !isResolved ? `
                <div style="display:flex; justify-content:flex-end; margin-bottom: 1rem;">
                    <button onclick="resolvePost(${id})" style="background:#48bb78; color:white; border:none; padding:6px 14px; border-radius:20px; cursor:pointer; font-weight:600; font-size: 0.85rem; transition: background 0.2s;" onmouseover="this.style.background='#38a169'" onmouseout="this.style.background='#48bb78'">
                        ✓ Mark as Resolved
                    </button>
                </div>
            ` : ''}

            <div id="comments-section-${id}"></div>

            <div style="display:flex; gap:0.5rem; margin-top:1rem;">
                <input type="text" id="comment-input-${id}" placeholder="Add a reply..." style="flex:1; padding:10px 18px; border-radius:25px; border:1px solid #e2e8f0; outline:none;">
                <button onclick="addComment(${id})" style="background:#e6a84b; color:white; border:none; padding:10px 20px; border-radius:25px; cursor:pointer; font-weight:600;">Reply</button>
            </div>
        </div>`;
    }).join('');

    posts.forEach(p => fetchCommentsForPost(p.postId || p.id));
}
/**
 * Fetches comments for a single post from GET /api/forum/posts/{postId}/comments
 * Sorts newest first, injects styled bubbles with avatars into the card.
 * Task 1: Makes comment author names clickable for direct messaging.
 */
async function fetchCommentsForPost(postId) {
    const section = document.getElementById(`comments-section-${postId}`);
    const token = getToken();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
        const res = await fetch(`${API_BASE_URL}/api/forum/posts/${postId}/comments`, { headers });

        const contentType = res.headers.get("content-type");
        if (!res.ok || !contentType || !contentType.includes("application/json")) {
            if (section) section.innerHTML = ''; 
            return;
        }

        const comments = await res.json();
        if (!section) return;

        const countEl = document.getElementById(`comment-count-${postId}`);
        if (countEl) countEl.textContent = `💬 ${comments.length} comment${comments.length !== 1 ? 's' : ''}`;

        if (!comments || comments.length === 0) {
            section.innerHTML = '<p style="font-size:0.85rem;color:#a0aec0;margin:0;">No replies yet — be the first!</p>';
            return;
        }

        const sorted = [...comments].sort((a, b) => {
            const ta = a.timestamp ? new Date(a.timestamp) : 0;
            const tb = b.timestamp ? new Date(b.timestamp) : 0;
            return tb - ta;
        });

        section.innerHTML = `
            <div style="border-top:1px solid #f0f0f0;padding-top:0.85rem;margin-top:0.25rem;">
                <p style="font-size:0.78rem;font-weight:600;color:#a0aec0;margin:0 0 0.6rem 0;letter-spacing:0.04em;text-transform:uppercase;">
                    Replies · newest first
                </p>
                ${sorted.map(c => {
                    const name = escapeHtml(c.authorName || c.email || 'Student');
                    const initial = name.charAt(0).toUpperCase();
                    const authorId = c.authorId;
                    const timeStr = c.timestamp
                        ? new Date(c.timestamp).toLocaleString('en-PH', {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})
                        : '';
                    return `
                    <div style="display:flex;gap:0.6rem;align-items:flex-start;margin-bottom:0.75rem;">
                        <div style="
                            width:28px;height:28px;border-radius:50%;
                            background:#e2e8f0;color:#4a5568;
                            font-weight:700;font-size:0.75rem;
                            display:flex;align-items:center;justify-content:center;
                            flex-shrink:0;margin-top:2px;
                        ">${initial}</div>
                        <div style="
                            flex:1;background:#f7fafc;
                            border-radius:0 12px 12px 12px;
                            padding:0.55rem 0.85rem;
                            font-size:0.88rem;
                        ">
                            <span class="user-link" onclick="redirectToMessage(${authorId}, '${name.replace(/'/g, "\\'")}')" style="font-weight:600;color:#667eea;cursor:pointer;transition:color 0.2s;" onmouseover="this.style.color='#5a67d8'" onmouseout="this.style.color='#667eea'">${name}</span>
                            ${timeStr ? `<span style="font-size:0.75rem;color:#a0aec0;margin-left:0.5rem;">${timeStr}</span>` : ''}
                            <p style="margin:0.25rem 0 0 0;color:#4a5568;line-height:1.5;">
                                ${escapeHtml(c.textContent || c.content)}
                            </p>
                        </div>
                    </div>`;
                }).join('')}
            </div>`;
    } catch (err) {
        if (section) section.innerHTML = '';
        console.warn(`fetchCommentsForPost(${postId}) skipped or failed:`, err);
    }
}

/**
 * FIX 2: createPost — grabs checkbox by id='postAnonymous',
 * sends { email, textContent, isAnonymous } matching ForumPostRequestDto.
 */
async function createPost() {
    const content = document.getElementById('postContent')?.value?.trim();
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail');

    if (!content) return alert("Please write something!");

    try {
        const response = await fetch(`${API_BASE_URL}/api/forum/posts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            // Removed isAnonymous from the body
            body: JSON.stringify({
                email: userEmail,
                textContent: content
            })
        });

        if (response.ok) {
            document.getElementById('postContent').value = '';
            loadForum();
        }
    } catch (error) {
        console.error("Post Error:", error);
    }
}

/**
 * FIX 3: addComment — pulls accountId from 'userProfile',
 * sends { accountId (Number), textContent } matching CommentRequestDto.
 */
async function addComment(postId) {
    const inputId    = `comment-input-${postId}`;
    const commentBox = document.getElementById(inputId);
    const token      = localStorage.getItem('token');

    // FIX 3: Pull accountId from saved userProfile
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    console.log("Current User Profile for comment:", userProfile);

    const accountId = userProfile.accountId || userProfile.id || userProfile.profileId;

    if (!accountId) {
        alert("Session error: Your Account ID is missing. Please log out and log in again.");
        return;
    }

    if (!commentBox?.value?.trim()) return alert("Please write a comment!");

    try {
        const response = await fetch(`${API_BASE_URL}/api/forum/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            // FIX 3: Body matches CommentRequestDto — accountId as Number
            body: JSON.stringify({
                accountId:   Number(accountId),
                textContent: commentBox.value.trim()
            })
        });

        if (response.ok) {
            commentBox.value = '';
            loadForum();
        } else {
            alert("Error: " + await response.text());
        }
    } catch (error) {
        console.error("Comment Error:", error);
    }
}

async function resolvePost(postId) {
    const token = getToken();
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const accountId = userProfile.accountId || userProfile.id;

    if (!accountId) {
        alert("Session error: Please log out and log in again.");
        return;
    }

    if (!confirm("Mark this post as resolved?")) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/forum/posts/${postId}/resolve?accountId=${accountId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            alert("✅ Post marked as resolved!");
            loadForum();
        } else {
            const errorMsg = await res.text();
            alert("⚠️ " + errorMsg);
        }
    } catch (err) {
        console.error("Resolve error:", err);
        alert("⚠️ Network error. Please try again.");
    }
}

// ============================================================
// MESSAGES
// ============================================================

let currentConversationId = null; // ✅ Single declaration

/**
 * Task 1: Redirect to messages with user info
 */
function redirectToMessage(userId, userName) {
    if (!userId || !userName) {
        console.error('redirectToMessage: userId and userName required');
        return;
    }
    
    // Save to sessionStorage for messages.html to pick up
    sessionStorage.setItem('pendingUserId', userId);
    sessionStorage.setItem('pendingUserName', userName);
    
    // Redirect to messages page
    window.location.href = 'messages.html';
}

/**
 * Task 3: Search users by name or email
 */
async function searchUsers() {
    const query = document.getElementById('searchUser')?.value?.trim();
    const resultsEl = document.getElementById('searchResults');
    
    if (!resultsEl) return;
    
    if (!query || query.length < 2) {
        resultsEl.innerHTML = '<p style="text-align:center;color:#a0aec0;padding:1rem;font-size:0.85rem;">Type at least 2 characters...</p>';
        return;
    }
    
    const token = getToken();
    if (!token) {
        alert('Please log in to search users.');
        return;
    }
    
    resultsEl.innerHTML = '<p style="text-align:center;color:#a0aec0;padding:1rem;font-size:0.85rem;">Searching...</p>';
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/users/search?query=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const users = await res.json();
        
        if (!users || users.length === 0) {
            resultsEl.innerHTML = '<p style="text-align:center;color:#a0aec0;padding:1rem;font-size:0.85rem;">No users found.</p>';
            return;
        }
        
        resultsEl.innerHTML = users.map(u => {
            const userId = u.accountId || u.id;
            const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'User';
            return `
                <div class="search-result-item" onclick="startConversation(${userId}, '${escapeHtml(fullName).replace(/'/g, "\\'")}')" 
                     style="display:flex;align-items:center;gap:10px;padding:12px;cursor:pointer;border-bottom:1px solid #f0f0f0;transition:background 0.2s;"
                     onmouseover="this.style.background='#f7fafc'" onmouseout="this.style.background=''">
                    <div style="width:36px;height:36px;border-radius:50%;background:#667eea;color:white;display:flex;align-items:center;justify-content:center;font-size:0.9rem;font-weight:bold;">
                        ${fullName.charAt(0).toUpperCase()}
                    </div>
                    <div style="flex:1;">
                        <div style="font-weight:600;font-size:0.95rem;color:#2d3748;">👤 ${escapeHtml(fullName)}</div>
                        <div style="font-size:0.8rem;color:#718096;">${escapeHtml(u.email || '')}</div>
                    </div>
                </div>`;
        }).join('');
    } catch (err) {
        console.error('searchUsers error:', err);
        resultsEl.innerHTML = '<p style="text-align:center;color:#e53e3e;padding:1rem;font-size:0.85rem;">⚠️ Error searching users.</p>';
    }
}

/**
 * Task 3: Start a conversation with a user
 */
function startConversation(userId, userName) {
    const modal = document.getElementById('newConversationModal');
    if (modal) modal.style.display = 'none';
    openConversation(userId, userName);
    
    console.log('💬 Starting conversation with:', { userId, userName });
    // Set pending receiver for new conversation
    window._pendingReceiverId = userId;
    window._pendingReceiverName = userName;
    
    // Reset current conversation (this is a NEW chat)
    currentConversationId = null;
    
    // Show the chat interface
    const noConvEl = document.getElementById('noConversationSelected');
    const convViewEl = document.getElementById('conversationView');
    const chatNameEl = document.getElementById('chatWithName');
    const messagesListEl = document.getElementById('messagesList');
    
    if (noConvEl) noConvEl.style.display = 'none';
    if (convViewEl) convViewEl.style.display = 'flex';
    if (chatNameEl) chatNameEl.textContent = `💬 ${userName}`;
    if (messagesListEl) {
        messagesListEl.innerHTML = `
            <div style="text-align:center;padding:3rem 1rem;color:#a0aec0;">
                <div style="font-size:3rem;margin-bottom:1rem;">👋</div>
                <h3 style="color:#2d3748;margin-bottom:0.5rem;">Start a conversation with ${escapeHtml(userName)}</h3>
                <p style="font-size:0.9rem;">Send your first message below!</p>
            </div>`;
    }
    
    // Focus on message input
    const inputEl = document.getElementById('messageInput');
    if (inputEl) {
        setTimeout(() => inputEl.focus(), 100);
    }
}


async function loadConversations() {
    const token = getToken();
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const myId = userProfile.accountId || userProfile.id;

    if (!myId) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/messages/conversations?userId=${myId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        // Take that good JSON data and build the sidebar!
        const conversations = await res.json();
        renderConversations(conversations); 
    } catch (err) {
        console.error("loadConversations error:", err);
    }
}

function renderConversations(conversations) {
    const listEl = document.getElementById('conversationsList');
    if (!listEl) return;

    if (!conversations || conversations.length === 0) {
        listEl.innerHTML = '<p style="text-align:center;color:#65676b;padding:2rem;font-size:0.9375rem;">No conversations yet.</p>';
        return;
    }

    listEl.innerHTML = conversations.map(conv => {
        const name = escapeHtml(conv.otherUserName || 'User');
        const initial = name.charAt(0).toUpperCase();
        return `
        <div class="conversation-item" onclick="openConversation(${conv.otherUserId}, '${name.replace(/'/g, "\\'")}')">
            <div class="conversation-avatar">${initial}</div>
            <div class="conversation-info">
                <div class="conversation-name">${name}</div>
                <div class="conversation-preview">${escapeHtml(conv.lastMessage || 'No messages yet')}</div>
            </div>
        </div>`;
    }).join('');
}

function openConversation(otherUserId, otherUserName) {
    // Tell the app who we are currently talking to
    window._pendingReceiverId = otherUserId; 

    // Update the UI headers
    const noSelect = document.getElementById('noConversationSelected');
    const convView = document.getElementById('conversationView');
    const chatName = document.getElementById('chatWithName');
    const msgList = document.getElementById('messagesList');

    if (noSelect) noSelect.style.display = 'none';
    if (convView) convView.style.display = 'block';
    if (chatName) chatName.textContent = `💬 ${otherUserName}`;
    if (msgList) msgList.innerHTML = '<p style="text-align:center;color:#a0aec0;padding:2rem;">Loading messages...</p>';

    // Fetch the message history from the backend!
    loadConversationBetween(otherUserId);
}

function initializeMessagingPage() {
    if (window._pendingReceiverId && window._pendingReceiverName) {
        document.getElementById('noConversationSelected').style.display = 'none';
        document.getElementById('conversationView').style.display = 'block';
        document.getElementById('chatWithName').textContent = `💬 ${window._pendingReceiverName}`;
        document.getElementById('messagesList').innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:2rem;">Start a new conversation!</p>';
    }
}

function renderMessages(messages) {
    const listEl = document.getElementById('messagesList');
    if (!listEl) return;

    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const myId = Number(userProfile.accountId || userProfile.id);

    if (!messages || messages.length === 0) {
        listEl.innerHTML = '<p style="text-align:center;color:#65676b;padding:3rem;font-size:0.9375rem;">No messages yet. Say hello!</p>';
        return;
    }

    listEl.innerHTML = messages.map(m => {
        const msgSenderId = Number(m.senderId || m.sender_id || (m.sender && m.sender.accountId));
        const isMine = (msgSenderId === myId);
        const bubbleClass = isMine ? 'message-bubble message-sent' : 'message-bubble message-received';
        
        return `<div class="${bubbleClass}">${escapeHtml(m.content || '')}</div>`;
    }).join('');

    listEl.scrollTo({ top: listEl.scrollHeight, behavior: 'smooth' });
}

/**
 * sendMessage — handles both:
 *   (a) Existing conversation: posts to /api/messages/conversations/{id}/send
 *   (b) New conversation:      posts to /api/messages/send with receiverId from search selection
 * Pulls senderId from saved 'userProfile'.
 */
/**
 * sendMessage — FIXED to use 'content' field matching MessageRequestDto
 * Handles both existing conversations and new chats
 */
async function sendMessage() {
    const token = getToken();
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const senderId = userProfile.accountId || userProfile.id;
    const inputEl = document.getElementById('messageInput');
    const messageText = inputEl?.value?.trim();

    if (!senderId) {
        alert("Session error: Please log out and log in again.");
        return;
    }

    if (!messageText) return;
    
    const receiverId = window._pendingReceiverId;
    if (!receiverId) {
        alert("No conversation selected. Please select a user first.");
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/messages/send`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                senderId: Number(senderId),
                receiverId: Number(receiverId),
                content: messageText
            })
        });

        if (res.ok) {
            inputEl.value = '';
            await loadConversationBetween(receiverId);
            loadConversations();
        } else {
            const errorMsg = await res.text();
            alert("⚠️ Error: " + errorMsg);
        }
    } catch (err) {
        console.error("sendMessage error:", err);
        alert("⚠️ Network error. Please try again.");
    }
}

// ==========================================
// LOAD CHAT BUBBLES (With Error Loudspeaker)
// ==========================================
async function loadConversationBetween(otherUserId) {
    const listEl = document.getElementById('messagesList');
    
    // Ensure we show loading state while fetching
    if (listEl) {
        listEl.innerHTML = '<p style="text-align:center;color:#a0aec0;padding:2rem;">Loading messages...</p>';
    }

    const token = getToken();
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const myId = Number(userProfile.accountId || userProfile.id);

    if (!myId || !otherUserId) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/messages/between?user1Id=${myId}&user2Id=${otherUserId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            // 🚨 MAGIC FIX: Grab the exact Java crash reason and stamp it on the screen!
            const errorText = await res.text();
            console.error("Backend 400 Crash:", errorText);
            
            if (listEl) {
                listEl.innerHTML = `<p style="text-align:center; color:#e53e3e; padding:2rem; font-weight:bold;">
                    🚨 Backend Error: <br><br> ${errorText}
                </p>`;
            }
            return; // Stop right here so the app doesn't break
        }
        
        // If successful, draw the green bubbles!
        const messages = await res.json();
        renderMessages(messages);
        
    } catch (err) {
        console.error("loadConversationBetween error:", err);
        if (listEl) {
            listEl.innerHTML = `<p style="text-align:center;color:#e53e3e;padding:2rem;">Network Error: Could not connect to backend.</p>`;
        }
    }
}


// ============================================================
// EVENT LISTENERS
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatusOnPage();

    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    const regForm = document.getElementById('registrationForm');
    if (regForm) regForm.addEventListener('submit', handleRegister);
});