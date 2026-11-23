/* ==========================================================================
   General AI - Core Platform Script (Frontend Logic & API Integration)
   ========================================================================== */

(function() {
    'use strict';

    // --- State Management ---
    const State = {
        user: null,
        token: localStorage.getItem('gai_token'),
        projects: [],
        activeCategory: 'All',
        loading: false,
        notifications: [],
        currentView: 'home' // 'home', 'dashboard', 'projects', 'eval'
    };

    // --- Selectors ---
    const selectors = {
        navToggle: document.querySelector('.nav__toggle'),
        navLinks: document.querySelector('.nav__links'),
        header: document.querySelector('.header'),
        registerBtns: document.querySelectorAll('a[href="#register"], .btn--primary:not(.enterprise__cta)'),
        loginBtns: document.querySelectorAll('a[href="#login"]'),
        projectGrid: document.querySelector('.features__grid'),
        enterpriseForm: document.querySelector('.enterprise__content'),
        body: document.body
    };

    // --- Initialization ---
    function init() {
        setupMobileNav();
        setupSmoothScroll();
        setupScrollEffects();
        setupIntersectionObserver();
        setupProjectPortal();
        setupAuthModals();
        checkAuthStatus();
        setupParallax();
        setupEarningsCalculator();
        injectModals();
        setupLiveEvalDemo();
    }

    // --- API Service ---
    const API = {
        async fetch(endpoint, options = {}) {
            try {
                const res = await fetch(`/api${endpoint}`, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${State.token}`,
                        ...(options.headers || {})
                    }
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'API Error');
                return data;
            } catch (err) {
                // If in dev/local and API fails, return mock data for seamless demo
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    return this.getMock(endpoint, options);
                }
                showToast(err.message, 'error');
                throw err;
            }
        },

        getMock(endpoint, options) {
            if (endpoint.includes('/projects')) {
                return {
                    success: true,
                    projects: [
                        { id: 'p1', title: 'Python Reasoning Evals', domain: 'Code', level: 'Advanced', payRate: '₹1,200/hr', estHours: '20hrs', description: 'Evaluate complex Python logic and rank model outputs.' },
                        { id: 'p2', title: 'Medical Case Summary', domain: 'Medicine', level: 'Expert', payRate: '₹2,500/hr', estHours: '10hrs', description: 'Review medical LLM outputs for clinical accuracy.' },
                        { id: 'p3', title: 'Indic Language Tuning', domain: 'Linguistics', level: 'Inter.', payRate: '₹950/hr', estHours: '30hrs', description: 'Grade Hindi and Tamil translations for cultural nuance.' }
                    ]
                };
            }
            if (endpoint.includes('/auth/send-otp')) return { success: true };
            if (endpoint.includes('/auth/verify-otp')) return { success: true, user: { name: 'Demo Expert', email: 'demo@generalai.in', walletBalance: 4850 } };
            return { success: true };
        },

        async getProjects(domain = 'All') {
            return this.fetch(`/projects?domain=${domain}`);
        },

        async sendOtp(email, phone, name) {
            return this.fetch('/auth/send-otp', {
                method: 'POST',
                body: JSON.stringify({ email, phone, name })
            });
        },

        async verifyOtp(email, otp) {
            return this.fetch('/auth/verify-otp', {
                method: 'POST',
                body: JSON.stringify({ email, otp })
            });
        },

        async applyForProject(projectId) {
            return this.fetch('/projects/apply', {
                method: 'POST',
                body: JSON.stringify({ projectId, userEmail: State.user?.email })
            });
        }
    };

    // --- UI Components ---

    function setupMobileNav() {
        if (!selectors.navToggle) return;
        selectors.navToggle.addEventListener('click', () => {
            const isExpanded = selectors.navToggle.getAttribute('aria-expanded') === 'true';
            selectors.navToggle.setAttribute('aria-expanded', !isExpanded);
            selectors.navLinks.classList.toggle('active');
            selectors.body.style.overflow = isExpanded ? '' : 'hidden';
        });
    }

    function setupAuthModals() {
        selectors.registerBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                showModal('signup');
            });
        });
        selectors.loginBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                showModal('login');
            });
        });
    }

    function injectModals() {
        const modalContainer = document.createElement('div');
        modalContainer.id = 'modal-root';
        modalContainer.className = 'modal-overlay hidden';
        modalContainer.innerHTML = `
            <div class="modal-card">
                <button class="modal-close" aria-label="Close modal">&times;</button>
                <div id="modal-content"></div>
            </div>
        `;
        selectors.body.appendChild(modalContainer);

        modalContainer.querySelector('.modal-close').addEventListener('click', hideModal);
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) hideModal();
        });
    }

    function showModal(type) {
        const root = document.getElementById('modal-root');
        const content = document.getElementById('modal-content');
        root.classList.remove('hidden');
        selectors.body.style.overflow = 'hidden';

        if (type === 'signup') {
            content.innerHTML = `
                <div class="auth-step" id="step-1">
                    <h2 class="modal-title">Join General AI Expert Network</h2>
                    <p class="modal-subtitle">Start earning by contributing to the AI economy.</p>
                    <form class="modal-form" id="signup-form">
                        <div class="form-group">
                            <label>Full Name</label>
                            <input type="text" name="name" placeholder="Enter your full name" required>
                        </div>
                        <div class="form-group">
                            <label>Email Address</label>
                            <input type="email" name="email" placeholder="work@email.com" required>
                        </div>
                        <div class="form-group">
                            <label>Phone Number</label>
                            <input type="tel" name="phone" placeholder="+91 98765 43210" required>
                        </div>
                        <button type="submit" class="btn btn--primary btn--full">Send Verification OTP</button>
                    </form>
                </div>
                <div class="auth-step hidden" id="step-2">
                    <h2 class="modal-title">Verify Your Email</h2>
                    <p class="modal-subtitle">We've sent a 6-digit code to your email.</p>
                    <div class="otp-input-container">
                        <input type="text" maxlength="6" id="otp-input" placeholder="000000">
                    </div>
                    <p class="otp-hint">Hint: For demo, use 123456</p>
                    <button id="verify-btn" class="btn btn--primary btn--full">Complete Verification</button>
                </div>
            `;

            document.getElementById('signup-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const email = formData.get('email');
                try {
                    await API.sendOtp(email, formData.get('phone'), formData.get('name'));
                    document.getElementById('step-1').classList.add('hidden');
                    document.getElementById('step-2').classList.remove('hidden');
                    State.pendingEmail = email;
                } catch(err) {}
            });

            document.getElementById('verify-btn').addEventListener('click', async () => {
                const otp = document.getElementById('otp-input').value;
                try {
                    const data = await API.verifyOtp(State.pendingEmail, otp);
                    loginUser(data.user, data.token);
                    hideModal();
                    showToast('Welcome to General AI!', 'success');
                } catch(err) {}
            });
        }
    }

    function hideModal() {
        document.getElementById('modal-root').classList.add('hidden');
        selectors.body.style.overflow = '';
    }

    function loginUser(user, token) {
        State.user = user;
        State.token = token;
        localStorage.setItem('gai_token', token || 'demo_token');
        localStorage.setItem('gai_user', JSON.stringify(user));
        updateUIForAuth();
    }

    function checkAuthStatus() {
        const savedUser = localStorage.getItem('gai_user');
        if (savedUser) {
            State.user = JSON.parse(savedUser);
            updateUIForAuth();
        }
    }

    function updateUIForAuth() {
        if (!State.user) return;
        const navActions = document.querySelector('.nav__actions');
        if (navActions) {
            navActions.innerHTML = `
                <div class="nav__user-badge">
                    <span class="user-balance">₹${(State.user.walletBalance || 0).toLocaleString('en-IN')}</span>
                    <div class="user-avatar">${State.user.name.charAt(0)}</div>
                </div>
            `;
        }
    }

    function setupProjectPortal() {
        const grid = document.querySelector('.features__grid');
        if (!grid) return;

        async function render() {
            grid.innerHTML = '<div class="loader">Loading opportunities...</div>';
            try {
                const data = await API.getProjects();
                grid.innerHTML = '';
                data.projects.forEach(proj => {
                    const card = document.createElement('div');
                    card.className = 'project-card';
                    card.innerHTML = `
                        <div class="project-header"><span class="tag tag--domain">${proj.domain}</span></div>
                        <h3 class="project-title">${proj.title}</h3>
                        <p class="project-desc">${proj.description}</p>
                        <div class="project-meta">
                            <div class="meta-item"><span class="meta-label">Pay</span><span class="meta-value highlight">${proj.payRate}</span></div>
                            <div class="meta-item"><span class="meta-label">Time</span><span class="meta-value">${proj.estHours}</span></div>
                        </div>
                        <button class="btn btn--primary btn--full">Apply Now</button>
                    `;
                    grid.appendChild(card);
                });
            } catch(e) {}
        }
        render();
    }

    function setupLiveEvalDemo() {
        const heroVisual = document.querySelector('.hero__visual');
        if (!heroVisual) return;

        heroVisual.innerHTML = `
            <div class="live-eval-demo" data-aos="fade-left">
                <div class="eval-window">
                    <div class="eval-header">
                        <div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div>
                        <span class="eval-label">Live AI Evaluation Task</span>
                    </div>
                    <div class="eval-body">
                        <div class="eval-prompt">
                            <strong>Prompt:</strong> Explain Quantum Entanglement in 2 sentences for a 10-year old.
                        </div>
                        <div class="eval-options">
                            <div class="eval-option" id="opt-a">
                                <strong>Response A:</strong> It's like having two magic dice that always show the same number, even if you throw them in different rooms.
                            </div>
                            <div class="eval-option" id="opt-b">
                                <strong>Response B:</strong> Quantum entanglement is a physical phenomenon that occurs when a group of particles are generated or interact in ways such that the quantum state of each particle cannot be described independently.
                            </div>
                        </div>
                        <div class="eval-actions">
                            <button class="btn btn--sm btn--primary" id="vote-a">Rank A Better</button>
                            <button class="btn btn--sm btn--outline" id="vote-b">Rank B Better</button>
                        </div>
                    </div>
                </div>
                <div class="floating-stat">₹48.50 Earned</div>
            </div>
        `;

        document.getElementById('vote-a')?.addEventListener('click', () => {
            showToast('Correct! Analogies are preferred for younger audiences. +₹48.50 credited.', 'success');
            document.querySelector('.floating-stat').classList.add('pulse');
        });
    }

    function setupEarningsCalculator() {
        // Implementation as before...
    }

    function showToast(msg, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.textContent = msg;
        selectors.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    function setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(a => {
            a.addEventListener('click', function(e) {
                const id = this.getAttribute('href');
                if (id === '#') return;
                const target = document.querySelector(id);
                if (target) {
                    e.preventDefault();
                    window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
                }
            });
        });
    }

    function setupScrollEffects() {
        window.addEventListener('scroll', () => {
            selectors.header.classList.toggle('scrolled', window.scrollY > 50);
        });
    }

    function setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('aos-animate'); });
        }, { threshold: 0.1 });
        document.querySelectorAll('[data-aos]').forEach(el => observer.observe(el));
    }

    function setupParallax() {
        window.addEventListener('mousemove', (e) => {
            const moveX = (e.clientX - window.innerWidth / 2) / 50;
            const moveY = (e.clientY - window.innerHeight / 2) / 50;
            document.querySelectorAll('.hero__card').forEach((card, idx) => {
                card.style.transform = `translate(${moveX * (idx + 1) * 0.5}px, ${moveY * (idx + 1) * 0.5}px)`;
            });
        });
    }

    init();

})();