// CONFIGURATION
const API_BASE_URL = "https://iskolarium-api.onrender.com";
// const API_BASE_URL = "http://localhost:8080/api";

/**
 * handles the raw communication with the login endpoint
 */
async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const token = await response.text();

        if (response.ok) {
            return { ok: true, data: { token: token } };
        } else {
            return { ok: false, error: token || "Invalid credentials" };
        }
    } catch (error) {
        console.error("Login Connection Error:", error);
        return { ok: false, error: "Cannot connect to server. Is Render awake?" };
    }
}

/**
 * handles the raw communication with the registration endpoint
 */
async function registerUser(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        // Some backends return text, some return JSON. this handle both.
        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch (e) { data = { message: text }; }

        return { ok: response.ok, data: data };
    } catch (error) {
        console.error("Registration Connection Error:", error);
        return { ok: false, error: "Cannot connect to server." };
    }
}

// ============================================================
// UI LOGIC (The "Button Handlers")
// ============================================================

async function handleLogin(event) {
    event.preventDefault(); 

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const result = await loginUser(email, password);

    if (result && result.ok) { 
        const token = result.data.token;
        localStorage.setItem('token', token);
        localStorage.setItem('userEmail', email);
        
        window.location.href = "dashboard.html"; 
    } else {
        alert(result?.error || "Login failed. Please check your email and password."); 
    }
}


async function handleRegister(event) {
    event.preventDefault();

    const userData = {
        fullName: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        gwa: document.getElementById('regGwa').value || null,
        university: document.getElementById('regUniversity')?.value || "Batangas State University",
        city: document.getElementById('regCity').value,
        incomeBracket: document.getElementById('regIncome').value,
        program: document.getElementById('regProgram')?.value || ""
    };

    const result = await registerUser(userData);

    if (result.ok) {
        alert('Registration successful! Redirecting to login...');
        window.location.href = 'login.html';
    } else {
        alert('Registration failed: ' + (result.data?.message || result.error));
    }
}

// ============================================================
// UTILITIES & NAVIGATION
// ============================================================

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    window.location.href = 'index.html';
}

function checkLoginStatusOnPage() {
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail');
    const loginLink = document.getElementById('loginNavLink');
    const userWelcome = document.getElementById('userWelcome');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (token && userEmail) {
        if (loginLink) loginLink.style.display = 'none';
        if (userWelcome) {
            userWelcome.style.display = 'inline';
            userWelcome.innerHTML = `Hello, ${userEmail.split('@')[0]}`;
        }
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
    }
}
    function displayScholarships(scholarships) {
    const list = document.getElementById('scholarship-list');
    list.innerHTML = ''; // Clear old content

    scholarships.forEach(s => {
        const card = `
            <div class="scholarship-card">
                <h3>${s.title}</h3>
                <p><strong>Provider:</strong> ${s.provider}</p>
                <p>${s.description}</p>
                <button onclick="viewDetails(${s.scholarshipId})">View Details</button>
            </div>
        `;
        list.insertAdjacentHTML('beforeend', card);
    });
}

// INITIALIZATION

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatusOnPage();

    // If we are on the dashboard, fetch data and wire up the button
    if (window.location.pathname.includes('dashboard.html')) {
        loadDashboardStats(); // Auto-load on entry

        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', loadDashboardStats);
        }
    }

    // Form Listeners
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    const regForm = document.getElementById('registrationForm');
    if (regForm) regForm.addEventListener('submit', handleRegister);
});